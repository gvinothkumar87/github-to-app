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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}