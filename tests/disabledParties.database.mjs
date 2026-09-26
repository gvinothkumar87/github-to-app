import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
const db = new PGlite();
const party = '00000000-0000-0000-0000-000000000001';
const active = '00000000-0000-0000-0000-000000000002';
const tables = { outward_entries: 'customers', sales: 'customers', receipts: 'customers', debit_notes: 'customers', credit_notes: 'customers', inward_entries: 'suppliers', purchases: 'suppliers' };
await db.exec(`CREATE ROLE authenticated;
  CREATE TABLE customers(id uuid PRIMARY KEY, is_active boolean NOT NULL);
  CREATE TABLE suppliers(LIKE customers INCLUDING ALL);
  INSERT INTO customers VALUES ('${party}',true),('${active}',true);
  INSERT INTO suppliers SELECT * FROM customers;`);
for (const [table, master] of Object.entries(tables)) {
  const key = master === 'customers' ? 'customer_id' : 'supplier_id';
  await db.exec(`CREATE TABLE ${table}(id uuid PRIMARY KEY, ${key} uuid REFERENCES ${master}(id), amount numeric, einvoice_status text, updated_at timestamptz);`);
}
await db.exec(readFileSync(new URL('../supabase/migrations/20260926150000_block_disabled_party_entries.sql', import.meta.url), 'utf8'));
await db.exec(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated; SET ROLE authenticated;`);
for (const [table, master] of Object.entries(tables)) {
  const key = master === 'customers' ? 'customer_id' : 'supplier_id';
  await db.exec(`INSERT INTO ${table}(id,${key},amount) VALUES ('${party}','${party}',100);`);
}
await db.exec(`UPDATE customers SET is_active=false WHERE id='${party}'; UPDATE suppliers SET is_active=false WHERE id='${party}';`);
for (const [table, master] of Object.entries(tables)) {
  const key = master === 'customers' ? 'customer_id' : 'supplier_id';
  await assert.rejects(db.exec(`INSERT INTO ${table}(id,${key},amount) VALUES ('${active}','${party}',200)`), /disabled/);
  await assert.rejects(db.exec(`UPDATE ${table} SET amount=200 WHERE id='${party}'`), /disabled/);
  assert.equal((await db.query(`SELECT amount FROM ${table} WHERE id='${party}'`)).rows[0].amount, '100');
  await db.exec(`UPDATE ${table} SET einvoice_status='CANCELLED' WHERE id='${party}';`);
  await db.exec(`UPDATE ${table} SET ${key}='${active}' WHERE id='${party}';`);
  console.log(`PASS ${table}: disabled insert/edit blocked, history readable, status sync and active reassignment allowed`);
}
await db.exec(`UPDATE customers SET is_active=true WHERE id='${party}'; UPDATE suppliers SET is_active=true WHERE id='${party}';`);
for (const [table, master] of Object.entries(tables)) {
  const key = master === 'customers' ? 'customer_id' : 'supplier_id';
  await db.exec(`INSERT INTO ${table}(id,${key},amount) VALUES ('${active}','${party}',200);`);
}
console.log('PASS re-enabled customers and suppliers accept new entries');
await db.close();
