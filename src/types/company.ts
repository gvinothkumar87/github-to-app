export interface CompanySetting {
  id: string;
  location_code: string;
  location_name: string;
  company_name: string;
  gstin: string;
  address_line1: string;
  address_line2?: string;
  locality: string;
  pin_code: number;
  state_code: string;
  phone?: string;
  email?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_branch?: string;
  start_bill_no?: number;
  start_debit_note_no?: number;
  start_credit_note_no?: number;
  bill_prefix?: string;
  bill_digits?: number;
  financial_year_in_serial?: boolean;
  debit_note_prefix?: string;
  debit_note_digits?: number;
  debit_note_financial_year_in_serial?: boolean;
  credit_note_prefix?: string;
  credit_note_digits?: number;
  credit_note_financial_year_in_serial?: boolean;
  is_active: boolean;
  einvoice_enabled?: boolean;
  einvoice_sandbox?: boolean;
  ewaybill_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

// Explicitly excludes all legacy TaxPro/NIC credential columns. Do not replace
// this with select('*') in browser or mobile code.
export const COMPANY_SETTINGS_PUBLIC_COLUMNS = [
  'id', 'location_code', 'location_name', 'company_name', 'gstin',
  'address_line1', 'address_line2', 'locality', 'pin_code', 'state_code',
  'phone', 'email', 'bank_name', 'bank_account_no', 'bank_ifsc', 'bank_branch',
  'start_bill_no', 'start_debit_note_no', 'start_credit_note_no', 'bill_prefix',
  'bill_digits', 'financial_year_in_serial', 'debit_note_prefix',
  'debit_note_digits', 'debit_note_financial_year_in_serial',
  'credit_note_prefix', 'credit_note_digits', 'credit_note_financial_year_in_serial',
  'is_active', 'einvoice_enabled', 'einvoice_sandbox', 'ewaybill_enabled',
  'created_at', 'updated_at'
].join(',');
