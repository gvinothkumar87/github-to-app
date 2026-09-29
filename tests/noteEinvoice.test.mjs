import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText.replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
const { buildNotePrintHtml, noteTax } = new Function(`${compile('../src/utils/notePrintTemplate.ts')}; return {buildNotePrintHtml,noteTax};`)();
const serviceCode = compile('../src/services/einvoiceService.ts').replace(/import\.meta/g, '({ env: {} })');
const note = { id: 'note-1', note_no: 'GRMD-2026-27-008', note_date: '2026-09-26', amount: 1180, gst_percentage: 18, reason: 'Quality adjustment', reference_bill_no: '1234' };
const company = { company_name: 'GOVINDAN RICE MILL', gstin: '33AALFG0221E1Z3', address_line1: 'S.No.58, SE KUNNATHUR ROAD, MATTAPARAI', address_line2: 'GINGEE TK., VILLUPURAM DIST.', locality: 'MATTAPARAI VILLAGE', pin_code: 605201, state_code: '33' };
const customer = { name_english: 'VAIGHAI AGRO PRODUCTS LTD', gstin: '33AADCV1880F1ZH', address_english: '342, KURUMPATTI ROAD, VALAYAPATTI, NAMAKKAL', pin_code: '637020', state_code: '33', place_of_supply: '33' };
const item = { name_english: 'RICE BRAN GR-BBH (HIGH OIL)', hsn_no: '23022020', gst_percentage: 18, unit: 'KGS' };
const portalData = { Irn: 'a'.repeat(64), AckNo: 123456789, AckDt: '2026-09-26 18:00:00', SignedQRCode: 'portal.signed.qr', SignedInvoice: 'portal.signed.invoice' };
function setup(result = { Status: 1, Data: portalData }, saveError = false) {
  const saved = [];
  const supabase = { from(table) { let values; return { update(v) { values = v; return this; }, eq() { return this; }, select() { return this; }, async single() { if (saveError) return { error: { message: 'Permission denied' } }; saved.push({ table, ...values }); return { data: { id: note.id }, error: null }; } }; } };
  const service = new Function('supabase', 'noteTax', `${serviceCode}; return einvoiceService;`)(supabase, noteTax);
  service.authenticate = async () => 'test-token';
  service.executeRequest = async () => ({ ok: true, json: async () => result });
  service.getEInvoiceDetails = async () => ({ Status: 1, Data: portalData });
  return { service, saved };
}
for (const [noteType, table] of [['DBN', 'debit_notes'], ['CRN', 'credit_notes']]) {
  test(`${noteType}: automatically saves IRN, acknowledgement and signed QR`, async () => {
    const s = setup(); const result = await s.service.generateNoteEInvoice({ note, noteType, table, companySettings: company, customer, item });
    assert.equal(s.saved[0].table, table); assert.equal(s.saved[0].signed_qrcode, portalData.SignedQRCode);
    assert.equal(s.saved[0].irn, result.irn); assert.equal(result.ackNo, '123456789'); assert.equal(s.saved[0].einvoice_status, 'GENERATED');
  });
}
test('failed IRN persistence never reports generation success', async () => {
  const s = setup(undefined, true);
  await assert.rejects(s.service.generateNoteEInvoice({ note, noteType: 'DBN', table: 'debit_notes', companySettings: company, customer, item }), /could not be saved/);
});
test('duplicate retry recovers QR and saves existing IRN', async () => {
  const s = setup({ Status: 0, ErrorDetails: [{ ErrorCode: '2150' }], InfoDtls: [{ InfCd: 'DUPIRN', Desc: { Irn: portalData.Irn } }] });
  await s.service.generateNoteEInvoice({ note, noteType: 'DBN', table: 'debit_notes', companySettings: company, customer, item });
  assert.equal(s.saved[0].signed_qrcode, portalData.SignedQRCode);
});
test('cancel e-invoice persists confirmed status', async () => {
  const s = setup(); await s.service.cancelNoteEInvoice({ note: { ...note, irn: portalData.Irn }, noteType: 'DBN', table: 'debit_notes', companySettings: company, reasonCode: '2', remark: 'Data entry mistake' });
  assert.equal(s.saved[0].einvoice_status, 'CANCELLED');
});
test('failed cancellation persistence surfaces retry error', async () => {
  const s = setup(undefined, true); await assert.rejects(s.service.cancelNoteEInvoice({ note: { ...note, irn: portalData.Irn }, noteType: 'DBN', table: 'debit_notes', companySettings: company, reasonCode: '2', remark: 'Data entry mistake' }), /saving the status failed/);
});
test('dedicated print supports long IRN, escaped content, and cancelled status', () => {
  const html = buildNotePrintHtml({ type: 'DBN', note: { ...note, irn: portalData.Irn, reason: '<script>bad</script>', einvoice_status: 'CANCELLED' }, company, customer, item });
  assert.ok(html.includes('size:A4')); assert.ok(html.includes(portalData.Irn)); assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('E-INVOICE CANCELLED')); assert.ok(!html.includes('<script>')); assert.ok(!html.includes('Signed e-invoice QR code'));
});
test('tax totals preserve amount and distinguish IGST', () => {
  const result = noteTax({ type: 'CRN', note, company, customer: { ...customer, place_of_supply: '29' }, item });
  assert.equal(result.igst, 180); assert.equal(result.cgst, 0); assert.equal(result.taxable + result.tax, note.amount);
});
if (process.env.NOTE_PRINT_FIXTURE) writeFileSync(process.env.NOTE_PRINT_FIXTURE, buildNotePrintHtml({ type: 'DBN', note: { ...note, irn: portalData.Irn, ack_no: String(portalData.AckNo), ack_date: portalData.AckDt, einvoice_status: 'GENERATED' }, company, customer, item }));
