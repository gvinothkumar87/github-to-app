import { supabase } from '@/integrations/supabase/client';
import { einvoiceService } from './einvoiceService';
import type { Sale } from '@/types';
import type { CompanySetting } from '@/types/company';

const COMPANY_SETTINGS_PUBLIC_COLUMNS = 'id,location_code,location_name,company_name,gstin,address_line1,address_line2,locality,pin_code,state_code,phone,email,bank_name,bank_account_no,bank_ifsc,bank_branch,start_bill_no,start_debit_note_no,start_credit_note_no,bill_prefix,bill_digits,financial_year_in_serial,debit_note_prefix,debit_note_digits,debit_note_financial_year_in_serial,credit_note_prefix,credit_note_digits,credit_note_financial_year_in_serial,is_active,einvoice_enabled,einvoice_sandbox,ewaybill_enabled,created_at,updated_at';

export type CancellableBillType = 'sale' | 'debit_note' | 'credit_note' | 'outward_entry';
const tables = { sale: 'sales', debit_note: 'debit_notes', credit_note: 'credit_notes', outward_entry: 'outward_entries' } as const;

export async function cancelBill(type: CancellableBillType, ids: string[], reason: string) {
  const remark = reason.trim();
  if (!remark || remark.length > 50) throw new Error('Enter a cancellation reason (1–50 characters).');
  // Fail before making irreversible portal calls if the audit migration is missing.
  const audit = await supabase.from('cancelled_bills').select('id').limit(1);
  if (audit.error) throw new Error(`Cancellation audit is unavailable: ${audit.error.message}`);
  // Load current records, never trust stale list statuses when deciding to skip a portal call.
  const { data, error } = await supabase.from(tables[type]).select('*').in('id', ids);
  if (error) throw error;
  if (data.length !== ids.length) throw new Error('Bill changed. Refresh and try again.');
  const cancelledEwbs = new Set<string>();
  const cancelledIrns = new Set<string>();
  for (const record of data) {
    const row = record as unknown as Sale & { mill?: string };
    const needsEwb = row.eway_bill_no && row.eway_bill_status !== 'CANCELLED';
    const needsIrn = row.irn && row.einvoice_status !== 'CANCELLED';
    if (!needsEwb && !needsIrn) continue;
    let location = type === 'sale' ? row.loading_place : row.mill;
    if (!location && type === 'sale' && row.outward_entry_id) {
      const result = await supabase.from('outward_entries').select('loading_place').eq('id', row.outward_entry_id).single();
      if (result.error) throw result.error;
      location = result.data.loading_place;
    }
    if (!location) throw new Error('Set the bill location before cancelling linked GST documents.');
    const settings = await supabase.from('company_settings').select(COMPANY_SETTINGS_PUBLIC_COLUMNS).eq('location_code', location).eq('is_active', true).single();
    if (settings.error) throw settings.error;
    const company = settings.data as CompanySetting;
    // E-way bill must be cancelled before the IRN. Persist each success for retry.
    if (needsEwb) {
      if (type !== 'sale') throw new Error('Linked e-way bill cancellation is supported only for sales bills.');
      if (!cancelledEwbs.has(row.eway_bill_no)) {
        if (!await einvoiceService.cancelEWayBill(row, company, 4, remark)) throw new Error('E-way bill cancellation was not confirmed.');
        cancelledEwbs.add(row.eway_bill_no);
      }
      const saved = await supabase.from('sales').update({ eway_bill_status: 'CANCELLED' }).eq('id', row.id).eq('eway_bill_no', row.eway_bill_no).select('id').single();
      if (saved.error) throw saved.error;
    }
    if (needsIrn) {
      if (!cancelledIrns.has(row.irn)) {
        const success = type === 'sale'
          ? await einvoiceService.cancelEInvoice(row, company, '4', remark)
          : type === 'credit_note' || type === 'debit_note'
            ? await einvoiceService.cancelNoteEInvoice({ note: row, noteType: type === 'credit_note' ? 'CRN' : 'DBN', table: tables[type], companySettings: company, reasonCode: '4', remark })
            : false;
        if (!success) throw new Error('E-invoice cancellation was not confirmed.');
        cancelledIrns.add(row.irn);
      }
      const update = { einvoice_status: 'CANCELLED' };
      const saved = type === 'sale'
        ? await supabase.from('sales').update(update).eq('id', row.id).eq('irn', row.irn).select('id').single()
        : type === 'credit_note'
          ? await supabase.from('credit_notes').update(update).eq('id', row.id).eq('irn', row.irn).select('id').single()
          : await supabase.from('debit_notes').update(update).eq('id', row.id).eq('irn', row.irn).select('id').single();
      if (saved.error) throw saved.error;
    }
  }
  const archived = await supabase.rpc('cancel_bill', { p_type: type, p_ids: ids, p_reason: remark });
  if (archived.error) throw archived.error;
  return archived.data;
}
