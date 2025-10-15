export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          absent_duration: string | null
          attendance_status: string | null
          clock_in_time: string | null
          clock_out_time: string | null
          created_at: string | null
          daily_salary: number | null
          date: string
          department: string | null
          employee_id: string
          full_name: string | null
          id: number
          late_duration: string | null
          overtime_duration: string | null
          worked_hours: string | null
        }
        Insert: {
          absent_duration?: string | null
          attendance_status?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string | null
          daily_salary?: number | null
          date: string
          department?: string | null
          employee_id: string
          full_name?: string | null
          id?: never
          late_duration?: string | null
          overtime_duration?: string | null
          worked_hours?: string | null
        }
        Update: {
          absent_duration?: string | null
          attendance_status?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string | null
          daily_salary?: number | null
          date?: string
          department?: string | null
          employee_id?: string
          full_name?: string | null
          id?: never
          late_duration?: string | null
          overtime_duration?: string | null
          worked_hours?: string | null
        }
        Relationships: []
      }
      business_contacts: {
        Row: {
          auth_user_id: string
          contact_info: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          contact_info?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          contact_info?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address_line1: string
          address_line2: string | null
          bank_account_no: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          company_name: string
          created_at: string
          email: string | null
          gstin: string
          id: string
          is_active: boolean
          locality: string
          location_code: string
          location_name: string
          phone: string | null
          pin_code: number
          state_code: string
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          company_name: string
          created_at?: string
          email?: string | null
          gstin: string
          id?: string
          is_active?: boolean
          locality: string
          location_code: string
          location_name: string
          phone?: string | null
          pin_code: number
          state_code?: string
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          gstin?: string
          id?: string
          is_active?: boolean
          locality?: string
          location_code?: string
          location_name?: string
          phone?: string | null
          pin_code?: number
          state_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          gst_percentage: number | null
          id: string
          item_id: string | null
          note_date: string
          note_no: string
          reason: string
          reference_bill_no: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          gst_percentage?: number | null
          id?: string
          item_id?: string | null
          note_date?: string
          note_no: string
          reason: string
          reference_bill_no?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          gst_percentage?: number | null
          id?: string
          item_id?: string | null
          note_date?: string
          note_no?: string
          reason?: string
          reference_bill_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_ledger: {
        Row: {
          balance: number
          created_at: string
          credit_amount: number
          customer_id: string
          debit_amount: number
          description: string | null
          id: string
          reference_id: string
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          credit_amount?: number
          customer_id: string
          debit_amount?: number
          description?: string | null
          id?: string
          reference_id: string
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          credit_amount?: number
          customer_id?: string
          debit_amount?: number
          description?: string | null
          id?: string
          reference_id?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_ledger_mapping: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string
          id: string
          ledger_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id: string
          id?: string
          ledger_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          ledger_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_ledger_mapping_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_ledger_mapping_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_english: string | null
          address_tamil: string | null
          code: string
          contact_person: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name_english: string
          name_tamil: string | null
          phone: string | null
          pin_code: string | null
          place_of_supply: string | null
          state_code: string | null
          updated_at: string
        }
        Insert: {
          address_english?: string | null
          address_tamil?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name_english: string
          name_tamil?: string | null
          phone?: string | null
          pin_code?: string | null
          place_of_supply?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Update: {
          address_english?: string | null
          address_tamil?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name_english?: string
          name_tamil?: string | null
          phone?: string | null
          pin_code?: string | null
          place_of_supply?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      debit_notes: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          gst_percentage: number | null
          id: string
          item_id: string | null
          note_date: string
          note_no: string
          reason: string
          reference_bill_no: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          gst_percentage?: number | null
          id?: string
          item_id?: string | null
          note_date?: string
          note_no: string
          reason: string
          reference_bill_no?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          gst_percentage?: number | null
          id?: string
          item_id?: string | null
          note_date?: string
          note_no?: string
          reason?: string
          reference_bill_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debit_notes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_salary_ledgers: {
        Row: {
          created_at: string | null
          department: string | null
          employee_id: string
          employee_name: string
          id: string
          ledger_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          employee_id: string
          employee_name: string
          id?: string
          ledger_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          employee_id?: string
          employee_name?: string
          id?: string
          ledger_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_salary_ledgers_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          base_salary: number
          created_at: string | null
          department: string | null
          email: string
          employee_id: string
          id: string
          is_active: boolean | null
          joining_date: string
          name: string
          phone: string | null
          position: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          base_salary?: number
          created_at?: string | null
          department?: string | null
          email: string
          employee_id: string
          id?: string
          is_active?: boolean | null
          joining_date?: string
          name: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          base_salary?: number
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id?: string
          id?: string
          is_active?: boolean | null
          joining_date?: string
          name?: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      google_sheets_configs: {
        Row: {
          column_letter: string
          config_key: string
          created_at: string
          created_by: string
          display_name: string
          id: string
          is_active: boolean
          sheet_ids: Json
          sheet_name: string
          updated_at: string
        }
        Insert: {
          column_letter: string
          config_key: string
          created_at?: string
          created_by: string
          display_name: string
          id?: string
          is_active?: boolean
          sheet_ids?: Json
          sheet_name: string
          updated_at?: string
        }
        Update: {
          column_letter?: string
          config_key?: string
          created_at?: string
          created_by?: string
          display_name?: string
          id?: string
          is_active?: boolean
          sheet_ids?: Json
          sheet_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          code: string
          created_at: string
          description_english: string | null
          description_tamil: string | null
          gst_percentage: number | null
          hsn_no: string | null
          id: string
          is_active: boolean
          name_english: string
          name_tamil: string | null
          opening_stock: number | null
          unit: string
          unit_weight: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description_english?: string | null
          description_tamil?: string | null
          gst_percentage?: number | null
          hsn_no?: string | null
          id?: string
          is_active?: boolean
          name_english: string
          name_tamil?: string | null
          opening_stock?: number | null
          unit?: string
          unit_weight?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description_english?: string | null
          description_tamil?: string | null
          gst_percentage?: number | null
          hsn_no?: string | null
          id?: string
          is_active?: boolean
          name_english?: string
          name_tamil?: string | null
          opening_stock?: number | null
          unit?: string
          unit_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      ledger_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          description_tamil: string | null
          id: string
          name: string
          name_tamil: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          description_tamil?: string | null
          id?: string
          name: string
          name_tamil?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          description_tamil?: string | null
          id?: string
          name?: string
          name_tamil?: string | null
        }
        Relationships: []
      }
      ledgers: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          description_tamil: string | null
          group_id: string | null
          id: string
          name: string
          name_tamil: string | null
          opening_balance: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          description_tamil?: string | null
          group_id?: string | null
          id?: string
          name: string
          name_tamil?: string | null
          opening_balance?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          description_tamil?: string | null
          group_id?: string | null
          id?: string
          name?: string
          name_tamil?: string | null
          opening_balance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledgers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ledger_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      outward_entries: {
        Row: {
          created_at: string
          customer_id: string
          driver_mobile: string
          empty_weight: number
          entry_date: string
          id: string
          is_completed: boolean
          item_id: string
          load_weight: number | null
          load_weight_photo_url: string | null
          load_weight_updated_at: string | null
          load_weight_updated_by: string | null
          loading_place: string
          lorry_no: string
          net_weight: number | null
          remarks: string | null
          serial_no: number
          updated_at: string
          weighment_photo_url: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          driver_mobile: string
          empty_weight: number
          entry_date?: string
          id?: string
          is_completed?: boolean
          item_id: string
          load_weight?: number | null
          load_weight_photo_url?: string | null
          load_weight_updated_at?: string | null
          load_weight_updated_by?: string | null
          loading_place?: string
          lorry_no: string
          net_weight?: number | null
          remarks?: string | null
          serial_no?: number
          updated_at?: string
          weighment_photo_url?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          driver_mobile?: string
          empty_weight?: number
          entry_date?: string
          id?: string
          is_completed?: boolean
          item_id?: string
          load_weight?: number | null
          load_weight_photo_url?: string | null
          load_weight_updated_at?: string | null
          load_weight_updated_by?: string | null
          loading_place?: string
          lorry_no?: string
          net_weight?: number | null
          remarks?: string | null
          serial_no?: number
          updated_at?: string
          weighment_photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outward_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outward_entries_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      page_permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          page_name: string
          page_route: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          page_name: string
          page_route: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          page_name?: string
          page_route?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payroll: {
        Row: {
          bonuses: number | null
          created_at: string | null
          days_worked: number | null
          deductions: number | null
          employee_id: string
          gross_salary: number | null
          id: string
          month: number
          net_salary: number | null
          processed_at: string | null
          processed_by: string | null
          status: string | null
          total_hours: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          bonuses?: number | null
          created_at?: string | null
          days_worked?: number | null
          deductions?: number | null
          employee_id: string
          gross_salary?: number | null
          id?: string
          month: number
          net_salary?: number | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          bonuses?: number | null
          created_at?: string | null
          days_worked?: number | null
          deductions?: number | null
          employee_id?: string
          gross_salary?: number | null
          id?: string
          month?: number
          net_salary?: number | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          total_hours?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          page_route: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          page_route?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          page_route?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          opening_balance: number
          status: string | null
          updated_at: string
          username: string
          username_tamil: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id: string
          opening_balance?: number
          status?: string | null
          updated_at?: string
          username: string
          username_tamil?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          opening_balance?: number
          status?: string | null
          updated_at?: string
          username?: string
          username_tamil?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          generated_code: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          generated_code: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          generated_code?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          bill_serial_no: string | null
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          mill: string
          purchase_date: string
          quantity: number
          rate: number
          supplier_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          bill_serial_no?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          mill?: string
          purchase_date?: string
          quantity: number
          rate: number
          supplier_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          bill_serial_no?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          mill?: string
          purchase_date?: string
          quantity?: number
          rate?: number
          supplier_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          payment_method: string
          receipt_date: string
          receipt_no: string
          remarks: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          payment_method?: string
          receipt_date?: string
          receipt_no: string
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          payment_method?: string
          receipt_date?: string
          receipt_no?: string
          remarks?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_form_submissions: {
        Row: {
          bags: number | null
          date: string | null
          driver: string | null
          email: string | null
          grade: string | null
          id: number
          lorry_no: string | null
          serial_no: number | null
          timestamp: string
          token: string | null
          token_link: string | null
          wayment_link: string | null
          wayment_nett_weight: number | null
        }
        Insert: {
          bags?: number | null
          date?: string | null
          driver?: string | null
          email?: string | null
          grade?: string | null
          id?: never
          lorry_no?: string | null
          serial_no?: number | null
          timestamp: string
          token?: string | null
          token_link?: string | null
          wayment_link?: string | null
          wayment_nett_weight?: number | null
        }
        Update: {
          bags?: number | null
          date?: string | null
          driver?: string | null
          email?: string | null
          grade?: string | null
          id?: never
          lorry_no?: string | null
          serial_no?: number | null
          timestamp?: string
          token?: string | null
          token_link?: string | null
          wayment_link?: string | null
          wayment_nett_weight?: number | null
        }
        Relationships: []
      }
      rice_loading_entries: {
        Row: {
          allotment_month: string
          bags: number
          bill_no: string
          bill_photo_url: string | null
          created_at: string
          driver: string
          entry_date: string
          godown: string
          grade: string
          id: string
          lorry_no: string
          mill: string
          rice_storage: string
          updated_at: string
          weight: number
        }
        Insert: {
          allotment_month: string
          bags: number
          bill_no: string
          bill_photo_url?: string | null
          created_at?: string
          driver: string
          entry_date?: string
          godown: string
          grade: string
          id?: string
          lorry_no: string
          mill: string
          rice_storage: string
          updated_at?: string
          weight: number
        }
        Update: {
          allotment_month?: string
          bags?: number
          bill_no?: string
          bill_photo_url?: string | null
          created_at?: string
          driver?: string
          entry_date?: string
          godown?: string
          grade?: string
          id?: string
          lorry_no?: string
          mill?: string
          rice_storage?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      rice_mill_batches: {
        Row: {
          batch_no: string
          created_at: string
          current_location: string
          current_location_type: string
          current_weight: number
          grade: string
          id: string
          initial_weight: number
          inward_entry_id: string | null
          mill: string
          thotti_no: string | null
          updated_at: string
        }
        Insert: {
          batch_no: string
          created_at?: string
          current_location: string
          current_location_type: string
          current_weight: number
          grade: string
          id?: string
          initial_weight: number
          inward_entry_id?: string | null
          mill?: string
          thotti_no?: string | null
          updated_at?: string
        }
        Update: {
          batch_no?: string
          created_at?: string
          current_location?: string
          current_location_type?: string
          current_weight?: number
          grade?: string
          id?: string
          initial_weight?: number
          inward_entry_id?: string | null
          mill?: string
          thotti_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rice_mill_batches_inward_entry_id_fkey"
            columns: ["inward_entry_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_inward_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_mill_container_contents: {
        Row: {
          batch_id: string
          created_at: string
          expected_completion_time: string | null
          grade: string
          id: string
          location: string
          location_type: string
          mill: string
          process_start_time: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          expected_completion_time?: string | null
          grade: string
          id?: string
          location: string
          location_type: string
          mill: string
          process_start_time?: string | null
          updated_at?: string
          weight: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          expected_completion_time?: string | null
          grade?: string
          id?: string
          location?: string
          location_type?: string
          mill?: string
          process_start_time?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "rice_mill_container_contents_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_mill_container_state_history: {
        Row: {
          batch_ids_after: Json | null
          batch_ids_before: Json | null
          created_at: string
          id: string
          location: string
          location_type: string
          mill: string
          operation_timestamp: string
          operation_type: string
          related_transfer_id: string | null
          weight_after: number
          weight_before: number
        }
        Insert: {
          batch_ids_after?: Json | null
          batch_ids_before?: Json | null
          created_at?: string
          id?: string
          location: string
          location_type: string
          mill: string
          operation_timestamp?: string
          operation_type: string
          related_transfer_id?: string | null
          weight_after?: number
          weight_before?: number
        }
        Update: {
          batch_ids_after?: Json | null
          batch_ids_before?: Json | null
          created_at?: string
          id?: string
          location?: string
          location_type?: string
          mill?: string
          operation_timestamp?: string
          operation_type?: string
          related_transfer_id?: string | null
          weight_after?: number
          weight_before?: number
        }
        Relationships: [
          {
            foreignKeyName: "rice_mill_container_state_history_related_transfer_id_fkey"
            columns: ["related_transfer_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_mill_global_variables: {
        Row: {
          category: string
          created_at: string
          display_text: string
          distance: number | null
          http_link_1: string | null
          http_link_1_description: string | null
          http_link_2: string | null
          http_link_2_description: string | null
          id: string
          is_active: boolean
          updated_at: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          display_text: string
          distance?: number | null
          http_link_1?: string | null
          http_link_1_description?: string | null
          http_link_2?: string | null
          http_link_2_description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          display_text?: string
          distance?: number | null
          http_link_1?: string | null
          http_link_1_description?: string | null
          http_link_2?: string | null
          http_link_2_description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      rice_mill_inward_entries: {
        Row: {
          bags: number
          challan_photo_url: string | null
          created_at: string
          driver: string
          entry_date: string
          grade: string
          id: string
          is_unloaded: boolean
          lorry_number: string
          mill: string
          serial_no: string
          token_id: string | null
          updated_at: string
          wayment_photo_url: string | null
          wayment_weight: number
        }
        Insert: {
          bags: number
          challan_photo_url?: string | null
          created_at?: string
          driver: string
          entry_date?: string
          grade: string
          id?: string
          is_unloaded?: boolean
          lorry_number: string
          mill?: string
          serial_no: string
          token_id?: string | null
          updated_at?: string
          wayment_photo_url?: string | null
          wayment_weight: number
        }
        Update: {
          bags?: number
          challan_photo_url?: string | null
          created_at?: string
          driver?: string
          entry_date?: string
          grade?: string
          id?: string
          is_unloaded?: boolean
          lorry_number?: string
          mill?: string
          serial_no?: string
          token_id?: string | null
          updated_at?: string
          wayment_photo_url?: string | null
          wayment_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "rice_mill_inward_entries_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_mill_tokens: {
        Row: {
          created_at: string
          id: string
          is_used: boolean
          loading_point: string
          lorry: string
          serial_no: string
          token_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_used?: boolean
          loading_point: string
          lorry: string
          serial_no: string
          token_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_used?: boolean
          loading_point?: string
          lorry?: string
          serial_no?: string
          token_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      rice_mill_transfers: {
        Row: {
          batch_id: string
          created_at: string
          expected_duration_minutes: number | null
          from_location: string
          from_location_type: string
          id: string
          is_overdue: boolean | null
          notes: string | null
          process_duration_minutes: number | null
          process_end_time: string | null
          process_start_time: string | null
          status: string | null
          thotti_no: string | null
          to_location: string
          to_location_type: string
          transfer_date: string
          transferred_by: string | null
          updated_at: string
          weight_transferred: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          expected_duration_minutes?: number | null
          from_location: string
          from_location_type: string
          id?: string
          is_overdue?: boolean | null
          notes?: string | null
          process_duration_minutes?: number | null
          process_end_time?: string | null
          process_start_time?: string | null
          status?: string | null
          thotti_no?: string | null
          to_location: string
          to_location_type: string
          transfer_date?: string
          transferred_by?: string | null
          updated_at?: string
          weight_transferred: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          expected_duration_minutes?: number | null
          from_location?: string
          from_location_type?: string
          id?: string
          is_overdue?: boolean | null
          notes?: string | null
          process_duration_minutes?: number | null
          process_end_time?: string | null
          process_start_time?: string | null
          status?: string | null
          thotti_no?: string | null
          to_location?: string
          to_location_type?: string
          transfer_date?: string
          transferred_by?: string | null
          updated_at?: string
          weight_transferred?: number
        }
        Relationships: [
          {
            foreignKeyName: "rice_mill_transfers_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_mill_unloading_entries: {
        Row: {
          bags: number
          batch_no: string | null
          created_at: string
          id: string
          inward_entry_id: string | null
          is_batch_completed: boolean | null
          mill: string
          unloading_point: string
          updated_at: string
        }
        Insert: {
          bags: number
          batch_no?: string | null
          created_at?: string
          id?: string
          inward_entry_id?: string | null
          is_batch_completed?: boolean | null
          mill?: string
          unloading_point: string
          updated_at?: string
        }
        Update: {
          bags?: number
          batch_no?: string | null
          created_at?: string
          id?: string
          inward_entry_id?: string | null
          is_batch_completed?: boolean | null
          mill?: string
          unloading_point?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rice_mill_unloading_entries_inward_entry_id_fkey"
            columns: ["inward_entry_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_inward_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          bill_serial_no: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          irn: string | null
          item_id: string
          loading_place: string | null
          outward_entry_id: string | null
          quantity: number
          rate: number
          sale_date: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          bill_serial_no?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          irn?: string | null
          item_id: string
          loading_place?: string | null
          outward_entry_id?: string | null
          quantity: number
          rate: number
          sale_date?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          bill_serial_no?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          irn?: string | null
          item_id?: string
          loading_place?: string | null
          outward_entry_id?: string | null
          quantity?: number
          rate?: number
          sale_date?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_outward_entry_id_fkey"
            columns: ["outward_entry_id"]
            isOneToOne: false
            referencedRelation: "outward_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_ledger: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_id: string
          mill: string
          quantity_in: number
          quantity_out: number
          reference_id: string | null
          running_stock: number
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_id: string
          mill?: string
          quantity_in?: number
          quantity_out?: number
          reference_id?: string | null
          running_stock?: number
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_id?: string
          mill?: string
          quantity_in?: number
          quantity_out?: number
          reference_id?: string | null
          running_stock?: number
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_ledger_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_ledger: {
        Row: {
          balance: number
          created_at: string
          credit_amount: number
          debit_amount: number
          description: string | null
          id: string
          reference_id: string
          supplier_id: string
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          credit_amount?: number
          debit_amount?: number
          description?: string | null
          id?: string
          reference_id: string
          supplier_id: string
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          credit_amount?: number
          debit_amount?: number
          description?: string | null
          id?: string
          reference_id?: string
          supplier_id?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_ledger_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          payment_date: string
          payment_method: string
          payment_no: string
          remarks: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          payment_date?: string
          payment_method: string
          payment_no: string
          remarks?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          payment_date?: string
          payment_method?: string
          payment_no?: string
          remarks?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address_english: string | null
          address_tamil: string | null
          code: string
          contact_person: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name_english: string
          name_tamil: string | null
          phone: string | null
          pin_code: string | null
          place_of_supply: string | null
          state_code: string | null
          updated_at: string
        }
        Insert: {
          address_english?: string | null
          address_tamil?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name_english: string
          name_tamil?: string | null
          phone?: string | null
          pin_code?: string | null
          place_of_supply?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Update: {
          address_english?: string | null
          address_tamil?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name_english?: string
          name_tamil?: string | null
          phone?: string | null
          pin_code?: string | null
          place_of_supply?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      thotti_audit_log: {
        Row: {
          batch_id: string | null
          change_reason: string
          change_timestamp: string
          changed_by: string | null
          id: string
          new_thotti_no: string | null
          old_thotti_no: string | null
          sync_session_id: string | null
          transfer_id: string | null
        }
        Insert: {
          batch_id?: string | null
          change_reason: string
          change_timestamp?: string
          changed_by?: string | null
          id?: string
          new_thotti_no?: string | null
          old_thotti_no?: string | null
          sync_session_id?: string | null
          transfer_id?: string | null
        }
        Update: {
          batch_id?: string | null
          change_reason?: string
          change_timestamp?: string
          changed_by?: string | null
          id?: string
          new_thotti_no?: string | null
          old_thotti_no?: string | null
          sync_session_id?: string | null
          transfer_id?: string | null
        }
        Relationships: []
      }
      transaction_cache: {
        Row: {
          closing_balance: number
          created_at: string
          date: string
          id: string
          last_updated: string
          opening_balance: number
          total_expense: number
          total_income: number
          transaction_count: number
          user_id: string
        }
        Insert: {
          closing_balance?: number
          created_at?: string
          date: string
          id?: string
          last_updated?: string
          opening_balance?: number
          total_expense?: number
          total_income?: number
          transaction_count?: number
          user_id: string
        }
        Update: {
          closing_balance?: number
          created_at?: string
          date?: string
          id?: string
          last_updated?: string
          opening_balance?: number
          total_expense?: number
          total_income?: number
          transaction_count?: number
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          attached_bill: string | null
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          ledger_id: string | null
          ledger_running_balance_after: number | null
          ledger_running_balance_before: number | null
          running_balance_after: number | null
          running_balance_before: number | null
          sequence_number: number
          source_ledger_id: string | null
          transfer_to_running_balance_after: number | null
          transfer_to_running_balance_before: number | null
          transfer_to_user_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          attached_bill?: string | null
          created_at?: string
          created_by: string
          date: string
          description: string
          id?: string
          ledger_id?: string | null
          ledger_running_balance_after?: number | null
          ledger_running_balance_before?: number | null
          running_balance_after?: number | null
          running_balance_before?: number | null
          sequence_number?: number
          source_ledger_id?: string | null
          transfer_to_running_balance_after?: number | null
          transfer_to_running_balance_before?: number | null
          transfer_to_user_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          attached_bill?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          id?: string
          ledger_id?: string | null
          ledger_running_balance_after?: number | null
          ledger_running_balance_before?: number | null
          running_balance_after?: number | null
          running_balance_before?: number | null
          sequence_number?: number
          source_ledger_id?: string | null
          transfer_to_running_balance_after?: number | null
          transfer_to_running_balance_before?: number | null
          transfer_to_user_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_offline_batches: {
        Row: {
          batch_no: string
          created_at: string
          current_location: string
          current_location_type: string
          current_weight: number
          device_id: string
          grade: string
          id: string
          mill: string
          synced: boolean | null
          updated_at: string
        }
        Insert: {
          batch_no: string
          created_at?: string
          current_location: string
          current_location_type: string
          current_weight: number
          device_id: string
          grade: string
          id: string
          mill: string
          synced?: boolean | null
          updated_at?: string
        }
        Update: {
          batch_no?: string
          created_at?: string
          current_location?: string
          current_location_type?: string
          current_weight?: number
          device_id?: string
          grade?: string
          id?: string
          mill?: string
          synced?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      unified_offline_container_contents: {
        Row: {
          batch_id: string
          created_at: string
          device_id: string
          expected_completion_time: string | null
          grade: string
          id: string
          location: string
          location_type: string
          mill: string
          process_start_time: string | null
          synced: boolean | null
          updated_at: string
          weight: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          device_id: string
          expected_completion_time?: string | null
          grade: string
          id: string
          location: string
          location_type: string
          mill: string
          process_start_time?: string | null
          synced?: boolean | null
          updated_at?: string
          weight: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          device_id?: string
          expected_completion_time?: string | null
          grade?: string
          id?: string
          location?: string
          location_type?: string
          mill?: string
          process_start_time?: string | null
          synced?: boolean | null
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      unified_offline_global_variables: {
        Row: {
          category: string
          created_at: string | null
          device_id: string
          display_text: string
          distance: number | null
          http_link_1: string | null
          http_link_1_description: string | null
          http_link_2: string | null
          http_link_2_description: string | null
          id: string
          is_active: boolean | null
          synced: boolean | null
          synced_at: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          category: string
          created_at?: string | null
          device_id: string
          display_text: string
          distance?: number | null
          http_link_1?: string | null
          http_link_1_description?: string | null
          http_link_2?: string | null
          http_link_2_description?: string | null
          id: string
          is_active?: boolean | null
          synced?: boolean | null
          synced_at?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string | null
          device_id?: string
          display_text?: string
          distance?: number | null
          http_link_1?: string | null
          http_link_1_description?: string | null
          http_link_2?: string | null
          http_link_2_description?: string | null
          id?: string
          is_active?: boolean | null
          synced?: boolean | null
          synced_at?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      unified_offline_inward_entries: {
        Row: {
          bags: number
          challan_photo_url: string | null
          created_at: string | null
          device_id: string
          driver: string
          entry_date: string
          grade: string
          id: string
          is_unloaded: boolean | null
          lorry_number: string
          mill: string
          serial_no: string
          synced: boolean | null
          synced_at: string | null
          token_id: string | null
          updated_at: string | null
          wayment_photo_url: string | null
          wayment_weight: number
        }
        Insert: {
          bags: number
          challan_photo_url?: string | null
          created_at?: string | null
          device_id: string
          driver: string
          entry_date: string
          grade: string
          id: string
          is_unloaded?: boolean | null
          lorry_number: string
          mill?: string
          serial_no: string
          synced?: boolean | null
          synced_at?: string | null
          token_id?: string | null
          updated_at?: string | null
          wayment_photo_url?: string | null
          wayment_weight: number
        }
        Update: {
          bags?: number
          challan_photo_url?: string | null
          created_at?: string | null
          device_id?: string
          driver?: string
          entry_date?: string
          grade?: string
          id?: string
          is_unloaded?: boolean | null
          lorry_number?: string
          mill?: string
          serial_no?: string
          synced?: boolean | null
          synced_at?: string | null
          token_id?: string | null
          updated_at?: string | null
          wayment_photo_url?: string | null
          wayment_weight?: number
        }
        Relationships: []
      }
      unified_offline_rice_loading_entries: {
        Row: {
          allotment_month: string
          bags: number
          bill_no: string
          bill_photo_url: string | null
          created_at: string
          device_id: string
          driver: string
          entry_date: string
          godown: string
          grade: string
          id: string
          lorry_no: string
          mill: string
          rice_storage: string
          synced: boolean | null
          updated_at: string
          weight: number
        }
        Insert: {
          allotment_month: string
          bags: number
          bill_no: string
          bill_photo_url?: string | null
          created_at?: string
          device_id: string
          driver: string
          entry_date?: string
          godown: string
          grade: string
          id: string
          lorry_no: string
          mill: string
          rice_storage: string
          synced?: boolean | null
          updated_at?: string
          weight: number
        }
        Update: {
          allotment_month?: string
          bags?: number
          bill_no?: string
          bill_photo_url?: string | null
          created_at?: string
          device_id?: string
          driver?: string
          entry_date?: string
          godown?: string
          grade?: string
          id?: string
          lorry_no?: string
          mill?: string
          rice_storage?: string
          synced?: boolean | null
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      unified_offline_tokens: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          is_used: boolean | null
          loading_point: string
          lorry: string
          serial_no: string
          synced: boolean | null
          synced_at: string | null
          token_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id: string
          is_used?: boolean | null
          loading_point: string
          lorry: string
          serial_no: string
          synced?: boolean | null
          synced_at?: string | null
          token_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          is_used?: boolean | null
          loading_point?: string
          lorry?: string
          serial_no?: string
          synced?: boolean | null
          synced_at?: string | null
          token_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      unified_offline_transfers: {
        Row: {
          batch_id: string
          created_at: string
          device_id: string
          expected_duration_minutes: number | null
          from_location: string
          from_location_type: string
          id: string
          mill: string
          status: string | null
          synced: boolean | null
          synced_at: string | null
          thotti_no: string | null
          to_location: string
          to_location_type: string
          transfer_date: string
          user_intent: string | null
          weight_transferred: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          device_id: string
          expected_duration_minutes?: number | null
          from_location: string
          from_location_type: string
          id: string
          mill: string
          status?: string | null
          synced?: boolean | null
          synced_at?: string | null
          thotti_no?: string | null
          to_location: string
          to_location_type: string
          transfer_date: string
          user_intent?: string | null
          weight_transferred: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          device_id?: string
          expected_duration_minutes?: number | null
          from_location?: string
          from_location_type?: string
          id?: string
          mill?: string
          status?: string | null
          synced?: boolean | null
          synced_at?: string | null
          thotti_no?: string | null
          to_location?: string
          to_location_type?: string
          transfer_date?: string
          user_intent?: string | null
          weight_transferred?: number
        }
        Relationships: []
      }
      unified_offline_unloading_entries: {
        Row: {
          bags: number
          batch_no: string | null
          created_at: string | null
          device_id: string
          id: string
          inward_entry_id: string | null
          is_batch_completed: boolean | null
          mill: string
          synced: boolean | null
          synced_at: string | null
          unloading_point: string
          updated_at: string | null
        }
        Insert: {
          bags: number
          batch_no?: string | null
          created_at?: string | null
          device_id: string
          id: string
          inward_entry_id?: string | null
          is_batch_completed?: boolean | null
          mill?: string
          synced?: boolean | null
          synced_at?: string | null
          unloading_point: string
          updated_at?: string | null
        }
        Update: {
          bags?: number
          batch_no?: string | null
          created_at?: string | null
          device_id?: string
          id?: string
          inward_entry_id?: string | null
          is_batch_completed?: boolean | null
          mill?: string
          synced?: boolean | null
          synced_at?: string | null
          unloading_point?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      unified_sync_conflicts: {
        Row: {
          conflict_reason: string
          conflict_type: string
          created_at: string
          detected_at: string
          device_id: string
          id: string
          resolution_details: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          transfer_id: string
        }
        Insert: {
          conflict_reason: string
          conflict_type: string
          created_at?: string
          detected_at: string
          device_id: string
          id: string
          resolution_details?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          transfer_id: string
        }
        Update: {
          conflict_reason?: string
          conflict_type?: string
          created_at?: string
          detected_at?: string
          device_id?: string
          id?: string
          resolution_details?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          transfer_id?: string
        }
        Relationships: []
      }
      user_balance_cache: {
        Row: {
          balance_type: string
          cache_timestamp: string
          cached_balance: number
          created_at: string
          date: string | null
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          balance_type: string
          cache_timestamp?: string
          cached_balance: number
          created_at?: string
          date?: string | null
          expires_at?: string
          id?: string
          user_id: string
        }
        Update: {
          balance_type?: string
          cache_timestamp?: string
          cached_balance?: number
          created_at?: string
          date?: string | null
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_balances: {
        Row: {
          closing_balance: number
          created_at: string
          date: string
          expense_total: number
          id: string
          income_total: number
          opening_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          closing_balance?: number
          created_at?: string
          date: string
          expense_total?: number
          id?: string
          income_total?: number
          opening_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          closing_balance?: number
          created_at?: string
          date?: string
          expense_total?: number
          id?: string
          income_total?: number
          opening_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ledger_access: {
        Row: {
          business_contact_id: string | null
          can_view_statement: boolean
          created_at: string
          created_by: string
          id: string
          ledger_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_contact_id?: string | null
          can_view_statement?: boolean
          created_at?: string
          created_by: string
          id?: string
          ledger_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_contact_id?: string | null
          can_view_statement?: boolean
          created_at?: string
          created_by?: string
          id?: string
          ledger_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ledger_access_business_contact_id_fkey"
            columns: ["business_contact_id"]
            isOneToOne: false
            referencedRelation: "business_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ledger_access_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_page_access: {
        Row: {
          granted_at: string | null
          granted_by: string
          id: string
          page_id: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by: string
          id?: string
          page_id?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string
          id?: string
          page_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_page_access_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_fix_receipt_ledger_integrity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_duplicate_container_contents: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_offline_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      clear_source_container: {
        Args: {
          p_batch_id: string
          p_location: string
          p_location_type: string
          p_mill?: string
        }
        Returns: undefined
      }
      complete_unloading_batch: {
        Args: { p_mill: string; p_unloading_point: string }
        Returns: undefined
      }
      create_business_contact_auth_user: {
        Args: {
          contact_email: string
          contact_password: string
          contact_username?: string
        }
        Returns: string
      }
      delete_multi_entry_transaction: {
        Args: { transaction_id: string }
        Returns: undefined
      }
      delete_transaction_with_balance_fix: {
        Args: { p_transaction_id: string }
        Returns: Json
      }
      ensure_daily_balance_exists: {
        Args: { p_date: string; p_user_id: string }
        Returns: undefined
      }
      ensure_employee_salary_ledger: {
        Args: {
          p_department?: string
          p_employee_id: string
          p_employee_name: string
        }
        Returns: string
      }
      fix_running_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_and_reserve_thotti_no: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_batch_no: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_credit_note_no: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_debit_note_no: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_receipt_no: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_thotti_no: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_available_source_containers: {
        Args: { p_mill?: string }
        Returns: {
          batch_details: Json
          location: string
          location_type: string
          mill: string
          total_weight: number
        }[]
      }
      get_cached_balance: {
        Args: { p_balance_type: string; p_date?: string; p_user_id: string }
        Returns: number
      }
      get_closing_balance_for_date: {
        Args: { p_date: string; p_user_id: string }
        Returns: number
      }
      get_email_from_username: {
        Args: { p_username: string }
        Returns: string
      }
      get_employee_salary_details: {
        Args: { p_date_from: string; p_date_to: string; p_employee_id: string }
        Returns: {
          daily_records: Json
          total_days: number
          total_salary: number
        }[]
      }
      get_opening_balance_for_date: {
        Args: { p_date: string; p_user_id: string }
        Returns: number
      }
      get_or_create_batch_for_unloading_point: {
        Args:
          | { p_grade: string; p_mill: string; p_unloading_point: string }
          | { p_mill: string; p_unloading_point: string }
        Returns: Json
      }
      get_user_accessible_pages: {
        Args: { _user_id: string }
        Returns: {
          description: string
          page_id: string
          page_name: string
          page_route: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      handle_rice_storage_transfer: {
        Args: {
          p_batch_id: string
          p_mill: string
          p_to_location: string
          p_weight_transferred: number
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_container_empty_at_timestamp: {
        Args: {
          p_location: string
          p_location_type: string
          p_mill: string
          p_timestamp: string
        }
        Returns: boolean
      }
      is_container_empty_now: {
        Args: { p_location: string; p_location_type: string; p_mill?: string }
        Returns: boolean
      }
      populate_missing_daily_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_bulk_transactions: {
        Args: { p_transactions: Json }
        Returns: Json
      }
      process_transaction: {
        Args: {
          p_amount: number
          p_attached_bill?: string
          p_created_by: string
          p_date: string
          p_description: string
          p_ledger_id?: string
          p_source_ledger_id?: string
          p_transfer_to_user_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      reassign_thotti_numbers_chronologically: {
        Args: { p_sync_session_id?: string }
        Returns: Json
      }
      rebuild_all_daily_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_all_running_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_daily_balances_from_date: {
        Args: { p_from_date: string; p_user_id: string }
        Returns: undefined
      }
      recalculate_running_balances_from_date: {
        Args: { p_from_date: string; p_user_ids: string[] }
        Returns: undefined
      }
      recompute_daily_balance: {
        Args: { _date: string; _user_id: string }
        Returns: undefined
      }
      refresh_transaction_cache: {
        Args: { p_date: string; p_user_id: string }
        Returns: undefined
      }
      undo_transfer: {
        Args: { transfer_id: string }
        Returns: Json
      }
      update_overdue_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_supplier_balance: {
        Args: { p_supplier_id: string }
        Returns: undefined
      }
      user_has_page_access: {
        Args: { _page_route: string; _user_id: string }
        Returns: boolean
      }
      validate_balance_consistency: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      validate_container_empty_at_timestamp: {
        Args: {
          p_location: string
          p_location_type: string
          p_mill: string
          p_timestamp: string
        }
        Returns: Json
      }
      validate_transfer_sequence: {
        Args: { p_from_location_type: string; p_to_location_type: string }
        Returns: boolean
      }
      validate_undo_operation: {
        Args: { transfer_id: string }
        Returns: Json
      }
      verify_daily_balance_chain: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
