// Run with PGLITE_MODULE pointing to an installed @electric-sql/pglite module.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
const db = new PGlite();
let id = '00000000-0000-0000-0000-000000000001';
const second = '00000000-0000-0000-0000-000000000002';
await db.exec(`
  CREATE ROLE authenticated; CREATE ROLE anon;
  CREATE SCHEMA auth;
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '${id}'::uuid $$;
  GRANT USAGE ON SCHEMA auth TO authenticated;
  CREATE TABLE customers (id uuid PRIMARY KEY, name text);
  CREATE TABLE items (id uuid PRIMARY KEY, name text);
  CREATE TABLE outward_entries (id uuid PRIMARY KEY, serial_no integer, customer_id uuid, item_id uuid);
  CREATE TABLE sales (id uuid PRIMARY KEY, bill_serial_no text, customer_id uuid, item_id uuid, outward_entry_id uuid,
    irn text, einvoice_status text, eway_bill_no text, eway_bill_status text, sale_date date, total_amount numeric);
  CREATE TABLE debit_notes (LIKE sales INCLUDING ALL); ALTER TABLE debit_notes ADD note_no text;
  CREATE TABLE credit_notes (LIKE sales INCLUDING ALL); ALTER TABLE credit_notes ADD note_no text;
  CREATE TABLE customer_ledger (id uuid PRIMARY KEY, reference_id uuid, transaction_type text, amount numeric);
  CREATE TABLE stock_ledger (LIKE customer_ledger INCLUDING ALL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
  CREATE FUNCTION stock_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    DELETE FROM stock_ledger WHERE reference_id = OLD.id AND transaction_type = 'sale'; RETURN OLD; END $$;
  CREATE TRIGGER stock_cleanup AFTER DELETE ON sales FOR EACH ROW EXECUTE FUNCTION stock_cleanup();
`);
await db.exec(readFileSync(new URL('../supabase/migrations/20260926120000_bill_cancellation_audit.sql', import.meta.url), 'utf8'));
const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0];
await db.exec(`INSERT INTO sales(id,bill_serial_no,total_amount) VALUES ('${id}','B-001',100),('${second}','B-001',200);
  INSERT INTO customer_ledger VALUES ('${id}','${id}','sale',100);
  INSERT INTO stock_ledger VALUES ('${id}','${id}','sale',10);
  SET ROLE authenticated;`);
await db.query('SELECT cancel_bill($1,$2,$3)', ['sale', [id, second], 'Duplicate']);
assert.equal(await scalar('SELECT count(*) FROM sales'), 0);
assert.equal(await scalar('SELECT count(*) FROM customer_ledger'), 0);
assert.equal(await scalar('SELECT count(*) FROM stock_ledger'), 0);
assert.equal(await scalar("SELECT jsonb_array_length(snapshot->'records') FROM cancelled_bills"), 2);
assert.equal(await scalar("SELECT jsonb_array_length(snapshot->'customer_ledger') FROM cancelled_bills"), 1);
assert.equal(await scalar('SELECT bill_serial_no FROM sales_bill_numbers'), 'B-001');
await assert.rejects(db.query('SELECT cancel_bill($1,$2,$3)', ['sale', [id, second], 'Retry']), /unavailable/);
assert.equal(await scalar('SELECT count(*) FROM cancelled_bills'), 1);
await assert.rejects(db.exec("UPDATE cancelled_bills SET reason = 'tamper'"), /permission denied/);
await assert.rejects(db.exec('DELETE FROM cancelled_bills'), /permission denied/);
console.log('PASS: grouped archive, ledger/stock cleanup, immutable audit, number history, repeated cancellation');

await assert.rejects(db.exec(`INSERT INTO sales(id,bill_serial_no) VALUES ('${id}','B-009')`), /reserved for audit/);
await assert.rejects(db.exec(`INSERT INTO sales(id,bill_serial_no) VALUES ('00000000-0000-0000-0000-000000000003','B-001')`), /reserved for audit/);
console.log('PASS: archived IDs and bill numbers cannot be reused');
id = '00000000-0000-0000-0000-000000000003';
await db.exec(`INSERT INTO sales(id,bill_serial_no,irn,einvoice_status) VALUES ('${id}','B-002','IRN','ACT');`);
await assert.rejects(db.query('SELECT cancel_bill($1,$2,$3)', ['sale', [id], 'Cancel']), /linked e-way/);
assert.equal(await scalar('SELECT count(*) FROM sales'), 1);
await db.exec(`UPDATE sales SET einvoice_status='CANCELLED', eway_bill_no='123', eway_bill_status='ACT';`);
await assert.rejects(db.query('SELECT cancel_bill($1,$2,$3)', ['sale', [id], 'Cancel']), /linked e-way/);
console.log('PASS: active IRN and EWB prevent local cancellation');

await db.exec(`UPDATE sales SET eway_bill_status='CANCELLED'; RESET ROLE;
  CREATE FUNCTION reject_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Simulated delete failure'; END $$;
  CREATE TRIGGER reject_delete BEFORE DELETE ON sales FOR EACH ROW EXECUTE FUNCTION reject_delete();
  INSERT INTO customer_ledger VALUES ('${id}','${id}','sale',100);
  SET ROLE authenticated;`);
await assert.rejects(db.query('SELECT cancel_bill($1,$2,$3)', ['sale', [id], 'Cancel']), /Simulated/);
assert.equal(await scalar('SELECT count(*) FROM cancelled_bills'), 1);
assert.equal(await scalar('SELECT count(*) FROM sales'), 1);
assert.equal(await scalar('SELECT count(*) FROM customer_ledger'), 1);
console.log('PASS: delete failure rolls back audit insertion and ledger deletion');

await db.exec(`RESET ROLE; DROP TRIGGER reject_delete ON sales;
  ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
  CREATE POLICY read_sales ON sales FOR SELECT TO authenticated USING (true);
  CREATE POLICY update_sales ON sales FOR UPDATE TO authenticated USING (true);
  SET ROLE authenticated;`);
await assert.rejects(db.query('SELECT cancel_bill($1,$2,$3)', ['sale', [id], 'Cancel']), /Permission denied/);
assert.equal(await scalar('SELECT count(*) FROM customer_ledger'), 1);
assert.equal(await scalar('SELECT count(*) FROM cancelled_bills'), 1);
console.log('PASS: existing DELETE permissions enforced with atomic rollback');
for (const [type, table] of [['debit_note', 'debit_notes'], ['credit_note', 'credit_notes'], ['outward_entry', 'outward_entries']]) {
  const rowId = '00000000-0000-0000-0000-000000000004';
  await db.exec(`INSERT INTO ${table}(id) VALUES ('${rowId}');`);
  await db.query('SELECT cancel_bill($1,$2,$3)', [type, [rowId], 'Audit test']);
  assert.equal(await scalar(`SELECT count(*) FROM ${table}`), 0);
  assert.equal(await scalar(`SELECT count(*) FROM cancelled_bills WHERE bill_type='${type}'`), 1);
}
console.log('PASS: debit note, credit note and unbilled outward entry cancellation');
await db.close();
