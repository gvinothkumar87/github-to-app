export interface Customer {
  id: string;
  name_english: string;
  name_tamil?: string;
  code: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address_english?: string;
  address_tamil?: string;
  gstin?: string;
  pin_code?: string;
  state_code?: string;
  place_of_supply?: string;
  opening_balance?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  name_english: string;
  name_tamil?: string;
  code: string;
  unit: string;
  unit_weight: number;
  hsn_no?: string;
  gst_percentage: number;
  opening_stock?: number;
  description_english?: string;
  description_tamil?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OutwardEntry {
  id: string;
  serial_no: number;
  entry_date: string;
  customer_id: string;
  item_id: string;
  lorry_no: string;
  driver_mobile: string;
  empty_weight: number;
  load_weight?: number;
  net_weight?: number;
  load_weight_updated_at?: string;
  load_weight_updated_by?: string;
  remarks?: string;
  loading_place: string;
  weighment_photo_url?: string;
  load_weight_photo_url?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  items?: Item;
}

export interface Sale {
  id: string;
  outward_entry_id: string;
  customer_id: string;
  item_id: string;
  quantity: number;
  rate: number;
  total_amount: number;
  bill_serial_no?: string;
  irn?: string;
  sale_date: string;
  loading_place?: string; // For direct sales to determine invoice company address
  lorry_no?: string; // For direct sales to store lorry number on invoice
  created_by?: string;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  items?: Item;
  outward_entries?: OutwardEntry;
}

export interface Receipt {
  id: string;
  receipt_no: string;
  customer_id: string;
  amount: number;
  receipt_date: string;
  payment_method: string;
  remarks?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customers?: Customer;
}

export interface CustomerLedger {
  id: string;
  customer_id: string;
  transaction_type: 'sale' | 'receipt' | 'debit_note' | 'credit_note';
  reference_id: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
  transaction_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
  customers?: Customer;
}

export interface DebitNote {
  id: string;
  note_no: string;
  customer_id: string;
  item_id?: string;
  reference_bill_no?: string;
  amount: number;
  gst_percentage?: number;
  reason: string;
  note_date: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  items?: Item;
}

export interface CreditNote {
  id: string;
  note_no: string;
  customer_id: string;
  item_id?: string;
  reference_bill_no?: string;
  amount: number;
  gst_percentage?: number;
  reason: string;
  note_date: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  items?: Item;
}

export type Language = 'english' | 'tamil';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  getDisplayName: (item: { name_english: string; name_tamil?: string }) => string;
}