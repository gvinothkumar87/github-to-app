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
  is_completed: boolean;
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