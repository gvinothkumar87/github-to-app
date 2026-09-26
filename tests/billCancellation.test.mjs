import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/services/billCancellationService.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText.replace(/^import .*;\r?\n/gm, '').replace('export async function', 'async function');

function setup(records, { failEwb = false, failIrn = false, failArchive = false } = {}) {
  const calls = [];
  const state = structuredClone(records);
  const supabase = {
    from(table) {
      let ids, id, patch;
      const query = {
        select() { return query; },
        limit() { return Promise.resolve({ data: [], error: null }); },
        in(_, values) { ids = values; return query; },
        eq(key, value) { if (key === 'id') id = value; return query; },
        update(value) { patch = value; return query; },
        async single() {
          if (table === 'company_settings') return { data: {}, error: null };
          if (table === 'outward_entries') return { data: { loading_place: 'MILL' }, error: null };
          Object.assign(state.find(row => row.id === id), patch);
          calls.push(`save:${Object.keys(patch)[0]}`);
          return { data: { id }, error: null };
        },
        then(resolve) { return Promise.resolve({ data: structuredClone(state.filter(row => ids.includes(row.id))), error: null }).then(resolve); },
      };
      return query;
    },
    async rpc(name, args) { calls.push('archive'); return { data: 'audit-id', error: failArchive ? new Error('DB failure') : null }; },
  };
  const einvoiceService = {
    async cancelEWayBill() { calls.push('eway'); if (failEwb) throw new Error('EWB rejected'); return true; },
    async cancelEInvoice() { calls.push('irn'); if (failIrn) throw new Error('IRN rejected'); return true; },
    async cancelNoteEInvoice() { calls.push('note-irn'); return true; },
  };
  const cancel = new Function('supabase', 'einvoiceService', `${source}; return cancelBill;`)(supabase, einvoiceService);
  return { calls, state, cancel };
}
const bill = { id: 'a', loading_place: 'MILL', irn: 'irn1', eway_bill_no: 'ewb1' };
test('plain bill archives without portal calls', async () => {
  const s = setup([{ id: 'a' }]); await s.cancel('sale', ['a'], 'Duplicate');
  assert.deepEqual(s.calls, ['archive']);
});
test('cancels EWB before IRN, then archives', async () => {
  const s = setup([bill]); await s.cancel('sale', ['a'], 'Order cancelled');
  assert.deepEqual(s.calls, ['eway', 'save:eway_bill_status', 'irn', 'save:einvoice_status', 'archive']);
});
test('EWB failure prevents IRN cancellation and archive', async () => {
  const s = setup([bill], { failEwb: true }); await assert.rejects(s.cancel('sale', ['a'], 'Cancel'), /EWB rejected/);
  assert.deepEqual(s.calls, ['eway']);
});
test('IRN failure preserves EWB progress and keeps bill active', async () => {
  const s = setup([bill], { failIrn: true }); await assert.rejects(s.cancel('sale', ['a'], 'Cancel'), /IRN rejected/);
  assert.equal(s.state[0].eway_bill_status, 'CANCELLED'); assert.ok(!s.calls.includes('archive'));
});
test('retry skips confirmed portal cancellations', async () => {
  const s = setup([{ ...bill, eway_bill_status: 'CANCELLED', einvoice_status: 'CANCELLED' }]);
  await s.cancel('sale', ['a'], 'Cancel'); assert.deepEqual(s.calls, ['archive']);
});
test('grouped lines cancel each shared portal document once', async () => {
  const s = setup([bill, { ...bill, id: 'b' }]); await s.cancel('sale', ['a', 'b'], 'Cancel');
  assert.equal(s.calls.filter(c => c === 'eway').length, 1); assert.equal(s.calls.filter(c => c === 'irn').length, 1);
  assert.equal(s.state[1].einvoice_status, 'CANCELLED');
});
test('notes use note cancellation API', async () => {
  const s = setup([{ id: 'a', mill: 'MILL', irn: 'note-irn' }]); await s.cancel('credit_note', ['a'], 'Cancel');
  assert.deepEqual(s.calls, ['note-irn', 'save:einvoice_status', 'archive']);
});
test('missing records and blank reasons fail before portal calls', async () => {
  const s = setup([]); await assert.rejects(s.cancel('sale', ['a'], 'Cancel'), /Bill changed/);
  await assert.rejects(s.cancel('sale', ['a'], ' '), /reason/); assert.deepEqual(s.calls, []);
});
test('archive failure is surfaced, with portal progress saved', async () => {
  const s = setup([bill], { failArchive: true }); await assert.rejects(s.cancel('sale', ['a'], 'Cancel'), /DB failure/);
  assert.equal(s.state[0].einvoice_status, 'CANCELLED');
});
