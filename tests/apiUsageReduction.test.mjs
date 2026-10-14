import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const compile = path => ts.transpileModule(
  readFileSync(new URL(path, import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }
).outputText.replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');

const serviceCode = compile('../src/services/einvoiceService.ts').replace(/import\.meta/g, '({ env: {} })');
const supabase = { auth: { getSession: async () => ({ data: { session: null } }) } };
const makeService = () => new Function('supabase', 'noteTax', `${serviceCode}; return einvoiceService;`)(supabase, {});
const settings = { gstin: '33AALFG0221E1Z3', einvoice_sandbox: false };

test('concurrent and repeated EWB detail reads use one provider request', async () => {
  const service = makeService();
  let calls = 0;
  service.getEWayBillDetailsUncached = async () => {
    calls += 1;
    await new Promise(resolve => setTimeout(resolve, 10));
    return { ewbNo: '111' };
  };

  const [a, b] = await Promise.all([
    service.getEWayBillDetails('111', settings),
    service.getEWayBillDetails('111', settings)
  ]);
  const c = await service.getEWayBillDetails('111', settings);

  assert.equal(calls, 1);
  assert.equal(a.ewbNo, '111');
  assert.deepEqual(b, c);
});

test('known unavailable dedicated EWB auth is bypassed for later IRN lookups', async () => {
  const service = makeService();
  let authCalls = 0;
  let directCalls = 0;
  let invoiceDetailCalls = 0;
  service.authenticateEWayBill = async () => {
    authCalls += 1;
    throw new Error('NIC404');
  };
  service.authenticate = async () => 'invoice-token';
  service.executeRequest = async () => {
    directCalls += 1;
    return {
      ok: false,
      status: 404,
      url: 'test://eway',
      text: async () => JSON.stringify({ error: { message: 'NIC404' } })
    };
  };
  service.getEInvoiceDetails = async irn => {
    invoiceDetailCalls += 1;
    const ewbNo = ({ 'irn-1': '222', 'irn-2': '333', 'irn-3': '444' })[irn];
    return { Status: 1, Data: { EwbNo: ewbNo } };
  };

  const first = await service.getEWayBillDetails('222', settings, 'irn-1');
  const second = await service.getEWayBillDetails('333', settings, 'irn-2');

  assert.equal(first.EwbNo || first.Data?.EwbNo, '222');
  assert.equal(second.EwbNo || second.Data?.EwbNo, '333');
  assert.equal(authCalls, 1);
  assert.equal(directCalls, 1);
  assert.equal(invoiceDetailCalls, 2);

  service.clearDedicatedEWayBillAuthFallback(settings);
  await service.getEWayBillDetails('444', settings, 'irn-3');
  assert.equal(authCalls, 2);
  assert.equal(directCalls, 2);
});

test('proxy does not replay unsafe POST requests across hosts', () => {
  const source = readFileSync(new URL('../supabase/functions/taxpro-gsp/index.ts', import.meta.url), 'utf8');
  assert.match(source, /mayRetryAcrossHosts = normalizedMethod === 'GET' \|\| normalizedMethod === 'HEAD'/);
  assert.match(source, /if \(!mayRetryAcrossHosts\) break/);
});
