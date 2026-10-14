import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const appRoot = resolve(import.meta.dirname, '..');
const platformRoot = resolve(appRoot, '..', 'client-platform');
const read = (path) => readFileSync(path, 'utf8');

test('browser service does not read or send TaxPro credentials', () => {
  const service = read(resolve(appRoot, 'src/services/einvoiceService.ts'));
  for (const forbidden of [
    'einvoice_aspid',
    'einvoice_asppassword',
    'einvoice_username',
    'einvoice_password',
    'ewaybill_password',
  ]) {
    assert.equal(service.includes(forbidden), false, `${forbidden} must remain server-managed`);
  }
});

test('canonical migration protects the TaxPro credential tables from browser roles', () => {
  const migration = read(resolve(
    platformRoot,
    'template/supabase/migrations/20261012020701_secure_taxpro_credentials.sql',
  ));
  assert.match(migration, /alter table public\.taxpro_gstin_credentials enable row level security/i);
  assert.match(migration, /revoke all on table public\.taxpro_gstin_credentials from anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.taxpro_gstin_credentials to service_role/i);
});

test('canonical proxy gets ASP credentials only from Edge Function secrets', () => {
  const proxy = read(resolve(platformRoot, 'template/supabase/functions/taxpro-gsp/index.ts'));
  assert.match(proxy, /Deno\.env\.get\('TAXPRO_ASPID'\)/);
  assert.match(proxy, /Deno\.env\.get\('TAXPRO_ASPPASSWORD'\)/);
  assert.doesNotMatch(proxy, /company\.einvoice_aspid|company\.einvoice_asppassword/);
});
