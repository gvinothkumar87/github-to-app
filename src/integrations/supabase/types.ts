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
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_activity_logs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_credentials: {
        Row: {
          api_key: string
          client_code: string
          created_at: string | null
          id: string
          password: string
          totp_secret: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_key: string
          client_code: string
          created_at?: string | null
          id?: string
          password: string
          totp_secret: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_key?: string
          client_code?: string
          created_at?: string | null
          id?: string
          password?: string
          totp_secret?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_pages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          route: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          route: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          route?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          location_permission: boolean | null
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role_type"]
          status: string | null
          task_role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          location_permission?: boolean | null
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
          status?: string | null
          task_role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          location_permission?: boolean | null
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role_type"]
          status?: string | null
          task_role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      attachments: {
        Row: {
          drive_file_id: string | null
          file_type: string
          file_url: string | null
          id: string
          task_id: string | null
          transaction_id: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          drive_file_id?: string | null
          file_type: string
          file_url?: string | null
          id?: string
          task_id?: string | null
          transaction_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          drive_file_id?: string | null
          file_type?: string
          file_url?: string | null
          id?: string
          task_id?: string | null
          transaction_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          absent_duration: string | null
          attendance_percentage: number | null
          attendance_status: string | null
          clock_in_time: string | null
          clock_out_time: string | null
          created_at: string | null
          daily_salary: number | null
          date: string
          department: string | null
          duty_minutes: number | null
          employee_id: string
          final_salary: number | null
          full_name: string | null
          half_salary_applied: boolean | null
          id: number
          is_processed: boolean | null
          late_duration: string | null
          original_salary: number | null
          overtime_duration: string | null
          required_percentage: number | null
          salary_missing: boolean | null
          worked_hours: string | null
          worked_minutes: number | null
        }
        Insert: {
          absent_duration?: string | null
          attendance_percentage?: number | null
          attendance_status?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string | null
          daily_salary?: number | null
          date: string
          department?: string | null
          duty_minutes?: number | null
          employee_id: string
          final_salary?: number | null
          full_name?: string | null
          half_salary_applied?: boolean | null
          id?: never
          is_processed?: boolean | null
          late_duration?: string | null
          original_salary?: number | null
          overtime_duration?: string | null
          required_percentage?: number | null
          salary_missing?: boolean | null
          worked_hours?: string | null
          worked_minutes?: number | null
        }
        Update: {
          absent_duration?: string | null
          attendance_percentage?: number | null
          attendance_status?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string | null
          daily_salary?: number | null
          date?: string
          department?: string | null
          duty_minutes?: number | null
          employee_id?: string
          final_salary?: number | null
          full_name?: string | null
          half_salary_applied?: boolean | null
          id?: never
          is_processed?: boolean | null
          late_duration?: string | null
          original_salary?: number | null
          overtime_duration?: string | null
          required_percentage?: number | null
          salary_missing?: boolean | null
          worked_hours?: string | null
          worked_minutes?: number | null
        }
        Relationships: []
      }
      bank_narration_mappings: {
        Row: {
          cleaned_narration: string
          created_at: string | null
          id: string
          reconciliation_type: string | null
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          cleaned_narration: string
          created_at?: string | null
          id?: string
          reconciliation_type?: string | null
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          cleaned_narration?: string
          created_at?: string | null
          id?: string
          reconciliation_type?: string | null
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_recon_configs: {
        Row: {
          amount_col: number | null
          amount_mode: string | null
          balance_col: number | null
          bank_name: string
          cleaning_rules: Json | null
          cr_dr_col: number | null
          created_at: string | null
          credit_col: number | null
          date_col: number | null
          debit_col: number | null
          id: string
          narration_col: number | null
          ref_col: number | null
          skip_rows: number | null
          updated_at: string | null
        }
        Insert: {
          amount_col?: number | null
          amount_mode?: string | null
          balance_col?: number | null
          bank_name: string
          cleaning_rules?: Json | null
          cr_dr_col?: number | null
          created_at?: string | null
          credit_col?: number | null
          date_col?: number | null
          debit_col?: number | null
          id?: string
          narration_col?: number | null
          ref_col?: number | null
          skip_rows?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_col?: number | null
          amount_mode?: string | null
          balance_col?: number | null
          bank_name?: string
          cleaning_rules?: Json | null
          cr_dr_col?: number | null
          created_at?: string | null
          credit_col?: number | null
          date_col?: number | null
          debit_col?: number | null
          id?: string
          narration_col?: number | null
          ref_col?: number | null
          skip_rows?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_reconciliations: {
        Row: {
          cleaned_narration: string
          closing_balance: number | null
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          id: string
          original_narration: string
          reconciled_target_id: string | null
          reconciled_target_type: string | null
          reconciled_transaction_id: string | null
          reconciliation_type: string | null
          reference_number: string
          source_ledger_id: string | null
          status: string | null
          transaction_date: string
          updated_at: string | null
          value_date: string | null
        }
        Insert: {
          cleaned_narration: string
          closing_balance?: number | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          id?: string
          original_narration: string
          reconciled_target_id?: string | null
          reconciled_target_type?: string | null
          reconciled_transaction_id?: string | null
          reconciliation_type?: string | null
          reference_number: string
          source_ledger_id?: string | null
          status?: string | null
          transaction_date: string
          updated_at?: string | null
          value_date?: string | null
        }
        Update: {
          cleaned_narration?: string
          closing_balance?: number | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          id?: string
          original_narration?: string
          reconciled_target_id?: string | null
          reconciled_target_type?: string | null
          reconciled_transaction_id?: string | null
          reconciliation_type?: string | null
          reference_number?: string
          source_ledger_id?: string | null
          status?: string | null
          transaction_date?: string
          updated_at?: string | null
          value_date?: string | null
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
      cashbook_transactions: {
        Row: {
          amount: number
          attachment_urls: string[] | null
          created_at: string | null
          currency: string
          custom_fields: Json | null
          event_id: string
          event_type: string
          expense_category: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          merchant_mcc: string | null
          merchant_name: string | null
          merchant_upi_id: string | null
          note: string | null
          phone_number: string | null
          reconciled_txn_id: string | null
          transaction_time: string
          txn_id: string
          txn_type: string | null
          upi_remark: string | null
        }
        Insert: {
          amount: number
          attachment_urls?: string[] | null
          created_at?: string | null
          currency?: string
          custom_fields?: Json | null
          event_id: string
          event_type: string
          expense_category?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          merchant_mcc?: string | null
          merchant_name?: string | null
          merchant_upi_id?: string | null
          note?: string | null
          phone_number?: string | null
          reconciled_txn_id?: string | null
          transaction_time: string
          txn_id: string
          txn_type?: string | null
          upi_remark?: string | null
        }
        Update: {
          amount?: number
          attachment_urls?: string[] | null
          created_at?: string | null
          currency?: string
          custom_fields?: Json | null
          event_id?: string
          event_type?: string
          expense_category?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          merchant_mcc?: string | null
          merchant_name?: string | null
          merchant_upi_id?: string | null
          note?: string | null
          phone_number?: string | null
          reconciled_txn_id?: string | null
          transaction_time?: string
          txn_id?: string
          txn_type?: string | null
          upi_remark?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashbook_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "cashbook_webhook_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbook_transactions_reconciled_txn_id_fkey"
            columns: ["reconciled_txn_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      cashbook_webhook_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          version?: string
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
          bill_digits: number | null
          bill_prefix: string | null
          company_name: string
          created_at: string
          credit_note_digits: number | null
          credit_note_financial_year_in_serial: boolean | null
          credit_note_prefix: string | null
          debit_note_digits: number | null
          debit_note_financial_year_in_serial: boolean | null
          debit_note_prefix: string | null
          einvoice_aspid: string | null
          einvoice_asppassword: string | null
          einvoice_enabled: boolean | null
          einvoice_password: string | null
          einvoice_sandbox: boolean | null
          einvoice_username: string | null
          ewaybill_enabled: boolean | null
          ewaybill_password: string | null
          email: string | null
          financial_year_in_serial: boolean
          gstin: string
          id: string
          is_active: boolean
          locality: string
          location_code: string
          location_name: string
          phone: string | null
          pin_code: number
          start_bill_no: number | null
          start_credit_note_no: number | null
          start_debit_note_no: number | null
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
          bill_digits?: number | null
          bill_prefix?: string | null
          company_name: string
          created_at?: string
          credit_note_digits?: number | null
          credit_note_financial_year_in_serial?: boolean | null
          credit_note_prefix?: string | null
          debit_note_digits?: number | null
          debit_note_financial_year_in_serial?: boolean | null
          debit_note_prefix?: string | null
          einvoice_aspid?: string | null
          einvoice_asppassword?: string | null
          einvoice_enabled?: boolean | null
          einvoice_password?: string | null
          einvoice_sandbox?: boolean | null
          einvoice_username?: string | null
          ewaybill_enabled?: boolean | null
          ewaybill_password?: string | null
          email?: string | null
          financial_year_in_serial?: boolean
          gstin: string
          id?: string
          is_active?: boolean
          locality: string
          location_code: string
          location_name: string
          phone?: string | null
          pin_code: number
          start_bill_no?: number | null
          start_credit_note_no?: number | null
          start_debit_note_no?: number | null
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
          bill_digits?: number | null
          bill_prefix?: string | null
          company_name?: string
          created_at?: string
          credit_note_digits?: number | null
          credit_note_financial_year_in_serial?: boolean | null
          credit_note_prefix?: string | null
          debit_note_digits?: number | null
          debit_note_financial_year_in_serial?: boolean | null
          debit_note_prefix?: string | null
          einvoice_aspid?: string | null
          einvoice_asppassword?: string | null
          einvoice_enabled?: boolean | null
          einvoice_password?: string | null
          einvoice_sandbox?: boolean | null
          einvoice_username?: string | null
          ewaybill_enabled?: boolean | null
          ewaybill_password?: string | null
          email?: string | null
          financial_year_in_serial?: boolean
          gstin?: string
          id?: string
          is_active?: boolean
          locality?: string
          location_code?: string
          location_name?: string
          phone?: string | null
          pin_code?: number
          start_bill_no?: number | null
          start_credit_note_no?: number | null
          start_debit_note_no?: number | null
          state_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      complaint_types: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          complaint_text: string | null
          complaint_type_id: string | null
          complaint_voice_url: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lorry_id: string | null
          resolution_notes: string | null
          resolution_voice_url: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          urgency: string | null
        }
        Insert: {
          complaint_text?: string | null
          complaint_type_id?: string | null
          complaint_voice_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lorry_id?: string | null
          resolution_notes?: string | null
          resolution_voice_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          urgency?: string | null
        }
        Update: {
          complaint_text?: string | null
          complaint_type_id?: string | null
          complaint_voice_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lorry_id?: string | null
          resolution_notes?: string | null
          resolution_voice_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_complaint_type_id_fkey"
            columns: ["complaint_type_id"]
            isOneToOne: false
            referencedRelation: "complaint_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_lorry_id_fkey"
            columns: ["lorry_id"]
            isOneToOne: false
            referencedRelation: "lorries"
            referencedColumns: ["id"]
          },
        ]
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
          mill: string
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
          mill?: string
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
          mill?: string
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
          opening_balance: number | null
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
          opening_balance?: number | null
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
          opening_balance?: number | null
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
          mill: string
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
          mill?: string
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
          mill?: string
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
      duty_status: {
        Row: {
          action: string
          created_at: string | null
          device_info: string | null
          id: string
          latitude: number | null
          location_accuracy: number | null
          longitude: number | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          device_info?: string | null
          id?: string
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          device_info?: string | null
          id?: string
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          user_id?: string
        }
        Relationships: []
      }
      employee_salary_ledgers: {
        Row: {
          created_at: string | null
          crosses_midnight: boolean | null
          department: string | null
          employee_id: string
          employee_name: string
          half_day_working_hours: number | null
          id: string
          is_enabled: boolean | null
          ledger_id: string
          monthly_salary: number | null
          updated_at: string | null
          working_hours: number | null
        }
        Insert: {
          created_at?: string | null
          crosses_midnight?: boolean | null
          department?: string | null
          employee_id: string
          employee_name: string
          half_day_working_hours?: number | null
          id?: string
          is_enabled?: boolean | null
          ledger_id: string
          monthly_salary?: number | null
          updated_at?: string | null
          working_hours?: number | null
        }
        Update: {
          created_at?: string | null
          crosses_midnight?: boolean | null
          department?: string | null
          employee_id?: string
          employee_name?: string
          half_day_working_hours?: number | null
          id?: string
          is_enabled?: boolean | null
          ledger_id?: string
          monthly_salary?: number | null
          updated_at?: string | null
          working_hours?: number | null
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
      failed_transactions: {
        Row: {
          attempted_data: Json
          created_at: string | null
          error_code: string | null
          error_message: string
          id: string
          last_retry_at: string | null
          retry_count: number | null
          status: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempted_data: Json
          created_at?: string | null
          error_code?: string | null
          error_message: string
          id?: string
          last_retry_at?: string | null
          retry_count?: number | null
          status?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempted_data?: Json
          created_at?: string | null
          error_code?: string | null
          error_message?: string
          id?: string
          last_retry_at?: string | null
          retry_count?: number | null
          status?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fcm_tokens: {
        Row: {
          app_id: string | null
          created_at: string
          device_info: string | null
          id: string
          last_used_at: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          device_info?: string | null
          id?: string
          last_used_at?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          device_info?: string | null
          id?: string
          last_used_at?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_audit_log: {
        Row: {
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string
          table_name: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id: string
          table_name: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frk_inward_entries: {
        Row: {
          batch_no: string
          bill_no: string
          created_at: string
          created_by: string | null
          entry_date: string
          id: string
          mill: string
          quantity: number
          serial_no: string
          updated_at: string
        }
        Insert: {
          batch_no: string
          bill_no: string
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          mill: string
          quantity: number
          serial_no: string
          updated_at?: string
        }
        Update: {
          batch_no?: string
          bill_no?: string
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          mill?: string
          quantity?: number
          serial_no?: string
          updated_at?: string
        }
        Relationships: []
      }
      frk_outward_entries: {
        Row: {
          created_at: string
          created_by: string | null
          entry_date: string
          id: string
          mill: string
          quantity: number
          rice_loading_bill_no: string
          rice_loading_entry_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          mill: string
          quantity: number
          rice_loading_bill_no: string
          rice_loading_entry_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          mill?: string
          quantity?: number
          rice_loading_bill_no?: string
          rice_loading_entry_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "frk_outward_entries_rice_loading_entry_id_fkey"
            columns: ["rice_loading_entry_id"]
            isOneToOne: false
            referencedRelation: "rice_loading_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      godown_expense_references: {
        Row: {
          bill_no: string
          created_at: string
          created_by: string
          expense_amount: number
          id: string
          lorry_no: string
          rice_loading_entry_id: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          bill_no: string
          created_at?: string
          created_by: string
          expense_amount: number
          id?: string
          lorry_no: string
          rice_loading_entry_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          bill_no?: string
          created_at?: string
          created_by?: string
          expense_amount?: number
          id?: string
          lorry_no?: string
          rice_loading_entry_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "godown_expense_references_rice_loading_entry_id_fkey"
            columns: ["rice_loading_entry_id"]
            isOneToOne: false
            referencedRelation: "rice_loading_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "godown_expense_references_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
      google_sheets_sync_log: {
        Row: {
          action: string
          attempt_count: number | null
          created_at: string | null
          created_by: string | null
          entry_id: string | null
          entry_type: string
          error_details: Json | null
          error_message: string | null
          id: string
          identifier: Json
          last_attempt_at: string | null
          operation_type: string
          status: string
          sync_data: Json
          synced_at: string | null
        }
        Insert: {
          action: string
          attempt_count?: number | null
          created_at?: string | null
          created_by?: string | null
          entry_id?: string | null
          entry_type: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          identifier: Json
          last_attempt_at?: string | null
          operation_type: string
          status?: string
          sync_data: Json
          synced_at?: string | null
        }
        Update: {
          action?: string
          attempt_count?: number | null
          created_at?: string | null
          created_by?: string | null
          entry_id?: string | null
          entry_type?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          identifier?: Json
          last_attempt_at?: string | null
          operation_type?: string
          status?: string
          sync_data?: Json
          synced_at?: string | null
        }
        Relationships: []
      }
      gps_historical_trips: {
        Row: {
          compressed_path: Json
          created_at: string
          date: string
          id: string
          total_distance_km: number | null
          user_id: string
        }
        Insert: {
          compressed_path?: Json
          created_at?: string
          date: string
          id?: string
          total_distance_km?: number | null
          user_id: string
        }
        Update: {
          compressed_path?: Json
          created_at?: string
          date?: string
          id?: string
          total_distance_km?: number | null
          user_id?: string
        }
        Relationships: []
      }
      gps_status_logs: {
        Row: {
          created_at: string
          event_timestamp: string
          id: string
          metadata: Json | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_timestamp?: string
          id?: string
          metadata?: Json | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_timestamp?: string
          id?: string
          metadata?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      gps_task_group_assignments: {
        Row: {
          created_at: string | null
          gps_task_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gps_task_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          gps_task_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_task_group_assignments_gps_task_id_fkey"
            columns: ["gps_task_id"]
            isOneToOne: false
            referencedRelation: "gps_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_task_group_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_task_transfers: {
        Row: {
          from_user: string
          gps_task_id: string
          id: string
          reason: string | null
          to_user: string
          transferred_at: string | null
        }
        Insert: {
          from_user: string
          gps_task_id: string
          id?: string
          reason?: string | null
          to_user: string
          transferred_at?: string | null
        }
        Update: {
          from_user?: string
          gps_task_id?: string
          id?: string
          reason?: string | null
          to_user?: string
          transferred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gps_task_transfers_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_task_transfers_gps_task_id_fkey"
            columns: ["gps_task_id"]
            isOneToOne: false
            referencedRelation: "gps_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_task_transfers_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_task_updates: {
        Row: {
          created_at: string | null
          gps_task_id: string
          id: string
          photo_url: string | null
          remarks: string | null
          status: string
          user_id: string
          voice_url: string | null
        }
        Insert: {
          created_at?: string | null
          gps_task_id: string
          id?: string
          photo_url?: string | null
          remarks?: string | null
          status: string
          user_id: string
          voice_url?: string | null
        }
        Update: {
          created_at?: string | null
          gps_task_id?: string
          id?: string
          photo_url?: string | null
          remarks?: string | null
          status?: string
          user_id?: string
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gps_task_updates_gps_task_id_fkey"
            columns: ["gps_task_id"]
            isOneToOne: false
            referencedRelation: "gps_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_task_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          assigned_to_group_id: string | null
          created_at: string | null
          description: string | null
          id: string
          latitude: number
          longitude: number
          paused_until: string | null
          radius: number
          status: string | null
          target_time: string | null
          title: string
          updated_at: string | null
          voice_recording_url: string | null
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          assigned_to_group_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude: number
          longitude: number
          paused_until?: string | null
          radius?: number
          status?: string | null
          target_time?: string | null
          title: string
          updated_at?: string | null
          voice_recording_url?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          assigned_to_group_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number
          longitude?: number
          paused_until?: string | null
          radius?: number
          status?: string | null
          target_time?: string | null
          title?: string
          updated_at?: string | null
          voice_recording_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gps_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_tasks_assigned_to_group_id_fkey"
            columns: ["assigned_to_group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_zone_entries: {
        Row: {
          acknowledged: boolean
          created_at: string
          entered_at: string
          exited_at: string | null
          gps_task_id: string
          id: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          created_at?: string
          entered_at?: string
          exited_at?: string | null
          gps_task_id: string
          id?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          created_at?: string
          entered_at?: string
          exited_at?: string | null
          gps_task_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_zone_entries_gps_task_id_fkey"
            columns: ["gps_task_id"]
            isOneToOne: false
            referencedRelation: "gps_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_zone_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instruction_acceptance: {
        Row: {
          accepted_at: string | null
          id: string
          instruction_id: string
          remarks: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          instruction_id: string
          remarks?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          instruction_id?: string
          remarks?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruction_acceptance_instruction_id_fkey"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "instructions"
            referencedColumns: ["id"]
          },
        ]
      }
      instruction_group_assignments: {
        Row: {
          created_at: string | null
          id: string
          instruction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instruction_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instruction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruction_group_assignments_instruction_id_fkey"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "instructions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instruction_group_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructions: {
        Row: {
          assigned_by: string
          assigned_to: string
          assigned_to_group_id: string | null
          created_at: string | null
          description: string | null
          id: string
          notification_sent: boolean | null
          scheduled_for: string | null
          status: string | null
          title: string
          updated_at: string | null
          voice_recording_url: string | null
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          assigned_to_group_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          notification_sent?: boolean | null
          scheduled_for?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          voice_recording_url?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          assigned_to_group_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          notification_sent?: boolean | null
          scheduled_for?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          voice_recording_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructions_assigned_to_group_id_fkey"
            columns: ["assigned_to_group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      inward_entries: {
        Row: {
          created_at: string
          driver_mobile: string
          empty_weight: number | null
          empty_weight_photo_url: string | null
          empty_weight_updated_at: string | null
          empty_weight_updated_by: string | null
          entry_date: string
          full_weight: number
          id: string
          is_completed: boolean
          item_id: string
          labour: string | null
          loading_place: string
          lorry_no: string
          net_weight: number | null
          remarks: string | null
          serial_no: number
          supplier_id: string
          updated_at: string
          weighment_photo_url: string | null
        }
        Insert: {
          created_at?: string
          driver_mobile: string
          empty_weight?: number | null
          empty_weight_photo_url?: string | null
          empty_weight_updated_at?: string | null
          empty_weight_updated_by?: string | null
          entry_date?: string
          full_weight: number
          id?: string
          is_completed?: boolean
          item_id: string
          labour?: string | null
          loading_place?: string
          lorry_no: string
          net_weight?: number | null
          remarks?: string | null
          serial_no?: never
          supplier_id: string
          updated_at?: string
          weighment_photo_url?: string | null
        }
        Update: {
          created_at?: string
          driver_mobile?: string
          empty_weight?: number | null
          empty_weight_photo_url?: string | null
          empty_weight_updated_at?: string | null
          empty_weight_updated_by?: string | null
          entry_date?: string
          full_weight?: number
          id?: string
          is_completed?: boolean
          item_id?: string
          labour?: string | null
          loading_place?: string
          lorry_no?: string
          net_weight?: number | null
          remarks?: string | null
          serial_no?: never
          supplier_id?: string
          updated_at?: string
          weighment_photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inward_entries_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inward_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          code: string
          created_at: string
          default_cost_rate: number | null
          description_english: string | null
          description_tamil: string | null
          gst_percentage: number | null
          hsn_no: string | null
          id: string
          is_active: boolean
          kooli: number | null
          kooli_mill_mattaparai: number | null
          kooli_mill_pulivanthi: number | null
          kooli_out_mattaparai: number | null
          kooli_out_pulivanthi: number | null
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
          default_cost_rate?: number | null
          description_english?: string | null
          description_tamil?: string | null
          gst_percentage?: number | null
          hsn_no?: string | null
          id?: string
          is_active?: boolean
          kooli?: number | null
          kooli_mill_mattaparai?: number | null
          kooli_mill_pulivanthi?: number | null
          kooli_out_mattaparai?: number | null
          kooli_out_pulivanthi?: number | null
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
          default_cost_rate?: number | null
          description_english?: string | null
          description_tamil?: string | null
          gst_percentage?: number | null
          hsn_no?: string | null
          id?: string
          is_active?: boolean
          kooli?: number | null
          kooli_mill_mattaparai?: number | null
          kooli_mill_pulivanthi?: number | null
          kooli_out_mattaparai?: number | null
          kooli_out_pulivanthi?: number | null
          name_english?: string
          name_tamil?: string | null
          opening_stock?: number | null
          unit?: string
          unit_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      kooli_ledger_config: {
        Row: {
          created_at: string | null
          id: string
          labour: string
          ledger_id: string
          mill: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          labour: string
          ledger_id: string
          mill: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          labour?: string
          ledger_id?: string
          mill?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kooli_ledger_config_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["id"]
          },
        ]
      }
      kooli_rates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          rate_mill_mattaparai: number | null
          rate_mill_pulivanthi: number | null
          rate_out_mattaparai: number | null
          rate_out_pulivanthi: number | null
          rate_type: string
          rate_value: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          rate_mill_mattaparai?: number | null
          rate_mill_pulivanthi?: number | null
          rate_out_mattaparai?: number | null
          rate_out_pulivanthi?: number | null
          rate_type: string
          rate_value?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          rate_mill_mattaparai?: number | null
          rate_mill_pulivanthi?: number | null
          rate_out_mattaparai?: number | null
          rate_out_pulivanthi?: number | null
          rate_type?: string
          rate_value?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      kooli_work_date_overrides: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_removed: boolean | null
          mill_override: string | null
          quantity_override: number | null
          record_id: string
          table_name: string
          updated_at: string | null
          work_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_removed?: boolean | null
          mill_override?: string | null
          quantity_override?: number | null
          record_id: string
          table_name: string
          updated_at?: string | null
          work_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_removed?: boolean | null
          mill_override?: string | null
          quantity_override?: number | null
          record_id?: string
          table_name?: string
          updated_at?: string | null
          work_date?: string
        }
        Relationships: []
      }
      ledger_groups: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          description_tamil: string | null
          id: string
          name: string
          name_tamil: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          description_tamil?: string | null
          id?: string
          name: string
          name_tamil?: string | null
        }
        Update: {
          category?: string | null
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
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          description: string | null
          description_tamil: string | null
          group_id: string | null
          id: string
          is_archived: boolean
          name: string
          name_tamil: string | null
          opening_balance: number | null
          updated_at: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          description_tamil?: string | null
          group_id?: string | null
          id?: string
          is_archived?: boolean
          name: string
          name_tamil?: string | null
          opening_balance?: number | null
          updated_at?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          description_tamil?: string | null
          group_id?: string | null
          id?: string
          is_archived?: boolean
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
      loading_places: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      location_tracking: {
        Row: {
          accuracy: number | null
          bearing: number | null
          bearing_accuracy: number | null
          created_at: string | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          provider: string | null
          recorded_at: string
          satellite_count: number | null
          source: string | null
          speed: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          bearing?: number | null
          bearing_accuracy?: number | null
          created_at?: string | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          provider?: string | null
          recorded_at?: string
          satellite_count?: number | null
          source?: string | null
          speed?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          bearing?: number | null
          bearing_accuracy?: number | null
          created_at?: string | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          provider?: string | null
          recorded_at?: string
          satellite_count?: number | null
          source?: string | null
          speed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      location_verifications: {
        Row: {
          action_type: string
          created_at: string | null
          distance_meters: number | null
          expected_lat: number | null
          expected_lng: number | null
          id: string
          task_id: string
          user_id: string
          verified_lat: number | null
          verified_lng: number | null
          within_radius: boolean | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          distance_meters?: number | null
          expected_lat?: number | null
          expected_lng?: number | null
          id?: string
          task_id: string
          user_id: string
          verified_lat?: number | null
          verified_lng?: number | null
          within_radius?: boolean | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          distance_meters?: number | null
          expected_lat?: number | null
          expected_lng?: number | null
          id?: string
          task_id?: string
          user_id?: string
          verified_lat?: number | null
          verified_lng?: number | null
          within_radius?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "location_verifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lorries: {
        Row: {
          created_at: string | null
          engine_oil_change_date: string | null
          fc_expiry: string | null
          gearbox_oil_change_date: string | null
          id: string
          insurance_expiry: string | null
          pollution_expiry: string | null
          status: string | null
          tax_expiry: string | null
          tyre_service_date: string | null
          vehicle_number: string
        }
        Insert: {
          created_at?: string | null
          engine_oil_change_date?: string | null
          fc_expiry?: string | null
          gearbox_oil_change_date?: string | null
          id?: string
          insurance_expiry?: string | null
          pollution_expiry?: string | null
          status?: string | null
          tax_expiry?: string | null
          tyre_service_date?: string | null
          vehicle_number: string
        }
        Update: {
          created_at?: string | null
          engine_oil_change_date?: string | null
          fc_expiry?: string | null
          gearbox_oil_change_date?: string | null
          id?: string
          insurance_expiry?: string | null
          pollution_expiry?: string | null
          status?: string | null
          tax_expiry?: string | null
          tyre_service_date?: string | null
          vehicle_number?: string
        }
        Relationships: []
      }
      manual_kooli_entries: {
        Row: {
          amount: number | null
          created_at: string | null
          created_by: string | null
          description: string
          entry_date: string
          id: string
          is_posted: boolean | null
          labour: string | null
          ledger_transaction_id: string | null
          mill: string
          qty: number
          rate: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          entry_date: string
          id?: string
          is_posted?: boolean | null
          labour?: string | null
          ledger_transaction_id?: string | null
          mill?: string
          qty?: number
          rate?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          entry_date?: string
          id?: string
          is_posted?: boolean | null
          labour?: string | null
          ledger_transaction_id?: string | null
          mill?: string
          qty?: number
          rate?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_kooli_entries_ledger_transaction_id_fkey"
            columns: ["ledger_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_logs: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string
          lorry_id: string | null
          mechanic_name: string | null
          problem: string | null
          repair_date: string | null
          repair_done: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string
          lorry_id?: string | null
          mechanic_name?: string | null
          problem?: string | null
          repair_date?: string | null
          repair_done?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          id?: string
          lorry_id?: string | null
          mechanic_name?: string | null
          problem?: string | null
          repair_date?: string | null
          repair_done?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_logs_lorry_id_fkey"
            columns: ["lorry_id"]
            isOneToOne: false
            referencedRelation: "lorries"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_sms_messages: {
        Row: {
          body: string | null
          id: string
          received_at: string | null
          sender: string | null
          uploader_email: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          id?: string
          received_at?: string | null
          sender?: string | null
          uploader_email?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          id?: string
          received_at?: string | null
          sender?: string | null
          uploader_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      motor_compliance_log: {
        Row: {
          created_at: string | null
          duration_sec: number
          fault_code: number | null
          id: string
          mismatch_type: string
          motor_id: string
          relay_state: string
          vfd_state: string
        }
        Insert: {
          created_at?: string | null
          duration_sec: number
          fault_code?: number | null
          id?: string
          mismatch_type: string
          motor_id: string
          relay_state: string
          vfd_state: string
        }
        Update: {
          created_at?: string | null
          duration_sec?: number
          fault_code?: number | null
          id?: string
          mismatch_type?: string
          motor_id?: string
          relay_state?: string
          vfd_state?: string
        }
        Relationships: []
      }
      motor_mismatch_log: {
        Row: {
          created_at: string | null
          fault_code: number | null
          id: string
          mismatch_duration_sec: number
          motor_no: number
          relay_state: boolean
          vfd_running: boolean
        }
        Insert: {
          created_at?: string | null
          fault_code?: number | null
          id?: string
          mismatch_duration_sec: number
          motor_no: number
          relay_state: boolean
          vfd_running: boolean
        }
        Update: {
          created_at?: string | null
          fault_code?: number | null
          id?: string
          mismatch_duration_sec?: number
          motor_no?: number
          relay_state?: boolean
          vfd_running?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          acknowledged_at: string | null
          app_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_job_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          app_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_job_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          app_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_job_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          is_posted: boolean | null
          item_id: string
          labour: string | null
          ledger_transaction_id: string | null
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
          is_posted?: boolean | null
          item_id: string
          labour?: string | null
          ledger_transaction_id?: string | null
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
          is_posted?: boolean | null
          item_id?: string
          labour?: string | null
          ledger_transaction_id?: string | null
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
          {
            foreignKeyName: "outward_entries_ledger_transaction_id_fkey"
            columns: ["ledger_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      pa_actions: {
        Row: {
          action_taken: string
          confidence_score: number | null
          created_at: string | null
          final_outcome: string | null
          id: string
          insight_id: string | null
          owner_response: string | null
        }
        Insert: {
          action_taken: string
          confidence_score?: number | null
          created_at?: string | null
          final_outcome?: string | null
          id?: string
          insight_id?: string | null
          owner_response?: string | null
        }
        Update: {
          action_taken?: string
          confidence_score?: number | null
          created_at?: string | null
          final_outcome?: string | null
          id?: string
          insight_id?: string | null
          owner_response?: string | null
        }
        Relationships: []
      }
      pa_authority_rules: {
        Row: {
          action_type: string
          allowed_time_window: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string
          max_risk_level: string | null
          requires_approval: boolean | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          allowed_time_window?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          max_risk_level?: string | null
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          allowed_time_window?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          max_risk_level?: string | null
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pa_insights: {
        Row: {
          category: string
          confidence: number | null
          created_at: string | null
          evidence: Json | null
          id: string
          is_risk: boolean | null
          message: string
          owner_id: string
          priority: number
          severity: string | null
          title: string
          type: string
          viewed_at: string | null
        }
        Insert: {
          category: string
          confidence?: number | null
          created_at?: string | null
          evidence?: Json | null
          id?: string
          is_risk?: boolean | null
          message: string
          owner_id: string
          priority: number
          severity?: string | null
          title: string
          type: string
          viewed_at?: string | null
        }
        Update: {
          category?: string
          confidence?: number | null
          created_at?: string | null
          evidence?: Json | null
          id?: string
          is_risk?: boolean | null
          message?: string
          owner_id?: string
          priority?: number
          severity?: string | null
          title?: string
          type?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      pa_owner_profile: {
        Row: {
          created_at: string | null
          owner_id: string
          preferred_alert_times: Json | null
          preferred_language: string | null
          risk_tolerance: string | null
          updated_at: string | null
          verbosity_level: string | null
        }
        Insert: {
          created_at?: string | null
          owner_id: string
          preferred_alert_times?: Json | null
          preferred_language?: string | null
          risk_tolerance?: string | null
          updated_at?: string | null
          verbosity_level?: string | null
        }
        Update: {
          created_at?: string | null
          owner_id?: string
          preferred_alert_times?: Json | null
          preferred_language?: string | null
          risk_tolerance?: string | null
          updated_at?: string | null
          verbosity_level?: string | null
        }
        Relationships: []
      }
      paddy_inward_issue_memos: {
        Row: {
          additional_bag_grade: string | null
          additional_bag_grade_2: string | null
          additional_quantity: number | null
          additional_quantity_2: number | null
          bag_grade: string | null
          bags: number | null
          created_at: string | null
          created_by: string | null
          entry_unique_id: string | null
          grade: string | null
          id: string
          issue_memo_date: string
          issue_memo_no: string
          paddy_inward_entry_id: string
          quantity: number | null
          updated_at: string | null
        }
        Insert: {
          additional_bag_grade?: string | null
          additional_bag_grade_2?: string | null
          additional_quantity?: number | null
          additional_quantity_2?: number | null
          bag_grade?: string | null
          bags?: number | null
          created_at?: string | null
          created_by?: string | null
          entry_unique_id?: string | null
          grade?: string | null
          id?: string
          issue_memo_date: string
          issue_memo_no: string
          paddy_inward_entry_id: string
          quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          additional_bag_grade?: string | null
          additional_bag_grade_2?: string | null
          additional_quantity?: number | null
          additional_quantity_2?: number | null
          bag_grade?: string | null
          bags?: number | null
          created_at?: string | null
          created_by?: string | null
          entry_unique_id?: string | null
          grade?: string | null
          id?: string
          issue_memo_date?: string
          issue_memo_no?: string
          paddy_inward_entry_id?: string
          quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paddy_inward_issue_memos_paddy_inward_entry_id_fkey"
            columns: ["paddy_inward_entry_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_inward_entries"
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
      payment_requests: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          payee_name: string | null
          status: string
          updated_at: string
          upi_id: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          payee_name?: string | null
          status?: string
          updated_at?: string
          upi_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          payee_name?: string | null
          status?: string
          updated_at?: string
          upi_id?: string
          user_id?: string | null
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
      process_button_configurations: {
        Row: {
          button_name: string
          created_at: string
          created_by: string | null
          disable_rule: string | null
          from_enable_rule: string | null
          id: string
          is_active: boolean
          off_http_link: string | null
          on_http_link: string | null
          sort_order: number
          to_enable_rule: string | null
          updated_at: string
        }
        Insert: {
          button_name: string
          created_at?: string
          created_by?: string | null
          disable_rule?: string | null
          from_enable_rule?: string | null
          id?: string
          is_active?: boolean
          off_http_link?: string | null
          on_http_link?: string | null
          sort_order?: number
          to_enable_rule?: string | null
          updated_at?: string
        }
        Update: {
          button_name?: string
          created_at?: string
          created_by?: string | null
          disable_rule?: string | null
          from_enable_rule?: string | null
          id?: string
          is_active?: boolean
          off_http_link?: string | null
          on_http_link?: string | null
          sort_order?: number
          to_enable_rule?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cashbook_phone: string | null
          created_at: string
          fcm_token: string | null
          id: string
          is_auto_reconcile_enabled: boolean | null
          opening_balance: number
          status: string | null
          updated_at: string
          username: string
          username_tamil: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cashbook_phone?: string | null
          created_at?: string
          fcm_token?: string | null
          id: string
          is_auto_reconcile_enabled?: boolean | null
          opening_balance?: number
          status?: string | null
          updated_at?: string
          username: string
          username_tamil?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cashbook_phone?: string | null
          created_at?: string
          fcm_token?: string | null
          id?: string
          is_auto_reconcile_enabled?: boolean | null
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
          inward_entry_id: string | null
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
          inward_entry_id?: string | null
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
          inward_entry_id?: string | null
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
            foreignKeyName: "purchases_inward_entry_id_fkey"
            columns: ["inward_entry_id"]
            isOneToOne: false
            referencedRelation: "inward_entries"
            referencedColumns: ["id"]
          },
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
      push_logs: {
        Row: {
          created_at: string | null
          id: string
          notification_id: string | null
          response: string | null
          status: string | null
          token_prefix: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_id?: string | null
          response?: string | null
          status?: string | null
          token_prefix?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_id?: string | null
          response?: string | null
          status?: string | null
          token_prefix?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      rice_bag_deposit_entries: {
        Row: {
          allotment_month: string
          bag_grade: string
          created_at: string
          created_by: string | null
          entry_date: string
          godown: string
          id: string
          mill: string
          notes: string | null
          photo_url: string | null
          quantity: number
          updated_at: string
        }
        Insert: {
          allotment_month: string
          bag_grade: string
          created_at?: string
          created_by?: string | null
          entry_date: string
          godown: string
          id?: string
          mill: string
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          allotment_month?: string
          bag_grade?: string
          created_at?: string
          created_by?: string | null
          entry_date?: string
          godown?: string
          id?: string
          mill?: string
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          updated_at?: string
        }
        Relationships: []
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
      rice_loading_batch_usage: {
        Row: {
          batch_id: string | null
          created_at: string | null
          grade: string | null
          id: string
          rice_loading_entry_id: string | null
          synced: boolean | null
          weight_deducted: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          grade?: string | null
          id?: string
          rice_loading_entry_id?: string | null
          synced?: boolean | null
          weight_deducted: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          grade?: string | null
          id?: string
          rice_loading_entry_id?: string | null
          synced?: boolean | null
          weight_deducted?: number
        }
        Relationships: [
          {
            foreignKeyName: "rice_loading_batch_usage_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rice_loading_batch_usage_rice_loading_entry_id_fkey"
            columns: ["rice_loading_entry_id"]
            isOneToOne: false
            referencedRelation: "rice_loading_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_loading_entries: {
        Row: {
          accounting_mill: string | null
          allotment_month: string
          bag_grade: string
          bags: number
          bill_no: string
          bill_photo_url: string | null
          created_at: string
          created_by: string | null
          driver: string
          entry_date: string
          entry_datetime: string | null
          godown: string
          grade: string
          gs_sync_timestamp: string | null
          hint: string | null
          id: string
          is_frk: boolean
          is_posted: boolean | null
          labour: string | null
          ledger_transaction_id: string | null
          lorry_no: string
          mill: string
          rice_storage: string
          status: string
          unloading_date: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          accounting_mill?: string | null
          allotment_month: string
          bag_grade?: string
          bags: number
          bill_no: string
          bill_photo_url?: string | null
          created_at?: string
          created_by?: string | null
          driver: string
          entry_date?: string
          entry_datetime?: string | null
          godown: string
          grade: string
          gs_sync_timestamp?: string | null
          hint?: string | null
          id?: string
          is_frk?: boolean
          is_posted?: boolean | null
          labour?: string | null
          ledger_transaction_id?: string | null
          lorry_no: string
          mill: string
          rice_storage: string
          status?: string
          unloading_date?: string | null
          updated_at?: string
          weight: number
        }
        Update: {
          accounting_mill?: string | null
          allotment_month?: string
          bag_grade?: string
          bags?: number
          bill_no?: string
          bill_photo_url?: string | null
          created_at?: string
          created_by?: string | null
          driver?: string
          entry_date?: string
          entry_datetime?: string | null
          godown?: string
          grade?: string
          gs_sync_timestamp?: string | null
          hint?: string | null
          id?: string
          is_frk?: boolean
          is_posted?: boolean | null
          labour?: string | null
          ledger_transaction_id?: string | null
          lorry_no?: string
          mill?: string
          rice_storage?: string
          status?: string
          unloading_date?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "rice_loading_entries_ledger_transaction_id_fkey"
            columns: ["ledger_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_loading_status_history: {
        Row: {
          batch_id: string | null
          bill_no: string | null
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          entry_id: string
          entry_type: string
          id: string
          lorry_no: string | null
          new_status: string
          old_status: string | null
        }
        Insert: {
          batch_id?: string | null
          bill_no?: string | null
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          entry_id: string
          entry_type: string
          id?: string
          lorry_no?: string | null
          new_status: string
          old_status?: string | null
        }
        Update: {
          batch_id?: string | null
          bill_no?: string | null
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          entry_id?: string
          entry_type?: string
          id?: string
          lorry_no?: string | null
          new_status?: string
          old_status?: string | null
        }
        Relationships: []
      }
      rice_mill_batches: {
        Row: {
          bags: number | null
          batch_no: string
          created_at: string
          created_by: string | null
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
          bags?: number | null
          batch_no: string
          created_at?: string
          created_by?: string | null
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
          bags?: number | null
          batch_no?: string
          created_at?: string
          created_by?: string | null
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
          bags: number | null
          batch_id: string
          created_at: string
          created_by: string | null
          expected_completion_time: string | null
          grade: string
          id: string
          location: string
          location_type: string
          mill: string
          process_start_time: string | null
          thotti_no: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          bags?: number | null
          batch_id: string
          created_at?: string
          created_by?: string | null
          expected_completion_time?: string | null
          grade: string
          id?: string
          location: string
          location_type: string
          mill: string
          process_start_time?: string | null
          thotti_no?: string | null
          updated_at?: string
          weight: number
        }
        Update: {
          bags?: number | null
          batch_id?: string
          created_at?: string
          created_by?: string | null
          expected_completion_time?: string | null
          grade?: string
          id?: string
          location?: string
          location_type?: string
          mill?: string
          process_start_time?: string | null
          thotti_no?: string | null
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
      rice_mill_container_transactions: {
        Row: {
          bags: number | null
          batch_id: string | null
          created_at: string
          created_by: string | null
          entry_datetime: string | null
          form_name: string | null
          id: string
          location: string
          location_type: string
          mill: string
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          related_info: string | null
          thotti_no: string | null
          transaction_date: string
          transaction_type: string
          weight: number
        }
        Insert: {
          bags?: number | null
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          entry_datetime?: string | null
          form_name?: string | null
          id?: string
          location: string
          location_type: string
          mill: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          related_info?: string | null
          thotti_no?: string | null
          transaction_date?: string
          transaction_type: string
          weight: number
        }
        Update: {
          bags?: number | null
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          entry_datetime?: string | null
          form_name?: string | null
          id?: string
          location?: string
          location_type?: string
          mill?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          related_info?: string | null
          thotti_no?: string | null
          transaction_date?: string
          transaction_type?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "rice_mill_container_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_mill_global_variables: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          display_text: string
          distance: number | null
          distance_to_mattaparai: number | null
          distance_to_pulivanthi: number | null
          http_link_1: string | null
          http_link_1_description: string | null
          http_link_2: string | null
          http_link_2_description: string | null
          id: string
          is_active: boolean
          storage_type: string | null
          updated_at: string
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          display_text: string
          distance?: number | null
          distance_to_mattaparai?: number | null
          distance_to_pulivanthi?: number | null
          http_link_1?: string | null
          http_link_1_description?: string | null
          http_link_2?: string | null
          http_link_2_description?: string | null
          id?: string
          is_active?: boolean
          storage_type?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          display_text?: string
          distance?: number | null
          distance_to_mattaparai?: number | null
          distance_to_pulivanthi?: number | null
          http_link_1?: string | null
          http_link_1_description?: string | null
          http_link_2?: string | null
          http_link_2_description?: string | null
          id?: string
          is_active?: boolean
          storage_type?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      rice_mill_inward_blocks: {
        Row: {
          bags_count: number
          block_number: number
          created_at: string | null
          id: string
          inward_entry_id: string | null
        }
        Insert: {
          bags_count: number
          block_number: number
          created_at?: string | null
          id?: string
          inward_entry_id?: string | null
        }
        Update: {
          bags_count?: number
          block_number?: number
          created_at?: string | null
          id?: string
          inward_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rice_mill_inward_blocks_inward_entry_id_fkey"
            columns: ["inward_entry_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_inward_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_mill_inward_entries: {
        Row: {
          accounting_mill: string | null
          bags: number
          challan_photo_url: string | null
          created_at: string
          created_by: string | null
          dpc_amount: number | null
          driver: string
          empty_time: string | null
          empty_weight: number | null
          entry_date: string
          entry_unique_id: string
          grade: string
          gross_weight: number | null
          id: string
          is_unloaded: boolean
          load_time: string | null
          loading_point: string | null
          lorry_number: string
          mill: string
          serial_no: string
          token_id: string | null
          updated_at: string
          wayment_photo_url: string | null
          wayment_type: string | null
          wayment_weight: number
          without_empty_excess_resolved: boolean | null
        }
        Insert: {
          accounting_mill?: string | null
          bags: number
          challan_photo_url?: string | null
          created_at?: string
          created_by?: string | null
          dpc_amount?: number | null
          driver: string
          empty_time?: string | null
          empty_weight?: number | null
          entry_date?: string
          entry_unique_id: string
          grade: string
          gross_weight?: number | null
          id?: string
          is_unloaded?: boolean
          load_time?: string | null
          loading_point?: string | null
          lorry_number: string
          mill?: string
          serial_no: string
          token_id?: string | null
          updated_at?: string
          wayment_photo_url?: string | null
          wayment_type?: string | null
          wayment_weight: number
          without_empty_excess_resolved?: boolean | null
        }
        Update: {
          accounting_mill?: string | null
          bags?: number
          challan_photo_url?: string | null
          created_at?: string
          created_by?: string | null
          dpc_amount?: number | null
          driver?: string
          empty_time?: string | null
          empty_weight?: number | null
          entry_date?: string
          entry_unique_id?: string
          grade?: string
          gross_weight?: number | null
          id?: string
          is_unloaded?: boolean
          load_time?: string | null
          loading_point?: string | null
          lorry_number?: string
          mill?: string
          serial_no?: string
          token_id?: string | null
          updated_at?: string
          wayment_photo_url?: string | null
          wayment_type?: string | null
          wayment_weight?: number
          without_empty_excess_resolved?: boolean | null
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
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
          bags: number | null
          batch_id: string
          created_at: string
          entry_datetime: string | null
          expected_duration_minutes: number | null
          from_location: string
          from_location_type: string
          id: string
          is_overdue: boolean | null
          is_posted: boolean | null
          labour: string | null
          ledger_transaction_id: string | null
          mill: string | null
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
          bags?: number | null
          batch_id: string
          created_at?: string
          entry_datetime?: string | null
          expected_duration_minutes?: number | null
          from_location: string
          from_location_type: string
          id?: string
          is_overdue?: boolean | null
          is_posted?: boolean | null
          labour?: string | null
          ledger_transaction_id?: string | null
          mill?: string | null
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
          bags?: number | null
          batch_id?: string
          created_at?: string
          entry_datetime?: string | null
          expected_duration_minutes?: number | null
          from_location?: string
          from_location_type?: string
          id?: string
          is_overdue?: boolean | null
          is_posted?: boolean | null
          labour?: string | null
          ledger_transaction_id?: string | null
          mill?: string | null
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
          {
            foreignKeyName: "rice_mill_transfers_ledger_transaction_id_fkey"
            columns: ["ledger_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_mill_unloading_entries: {
        Row: {
          bags: number
          batch_no: string | null
          created_at: string
          created_by: string | null
          id: string
          inward_entry_id: string | null
          is_batch_completed: boolean | null
          is_posted: boolean | null
          labour: string | null
          ledger_transaction_id: string | null
          mill: string
          unloading_point: string
          updated_at: string
        }
        Insert: {
          bags: number
          batch_no?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inward_entry_id?: string | null
          is_batch_completed?: boolean | null
          is_posted?: boolean | null
          labour?: string | null
          ledger_transaction_id?: string | null
          mill?: string
          unloading_point: string
          updated_at?: string
        }
        Update: {
          bags?: number
          batch_no?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inward_entry_id?: string | null
          is_batch_completed?: boolean | null
          is_posted?: boolean | null
          labour?: string | null
          ledger_transaction_id?: string | null
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
          {
            foreignKeyName: "rice_mill_unloading_entries_ledger_transaction_id_fkey"
            columns: ["ledger_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_outward_acknowledgements: {
        Row: {
          ack_bags: number | null
          ack_date: string | null
          ack_godown: string | null
          ack_number: string | null
          ack_weight: number | null
          created_at: string | null
          created_by: string | null
          grade: string | null
          id: string
          rice_loading_entry_id: string | null
        }
        Insert: {
          ack_bags?: number | null
          ack_date?: string | null
          ack_godown?: string | null
          ack_number?: string | null
          ack_weight?: number | null
          created_at?: string | null
          created_by?: string | null
          grade?: string | null
          id?: string
          rice_loading_entry_id?: string | null
        }
        Update: {
          ack_bags?: number | null
          ack_date?: string | null
          ack_godown?: string | null
          ack_number?: string | null
          ack_weight?: number | null
          created_at?: string | null
          created_by?: string | null
          grade?: string | null
          id?: string
          rice_loading_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rice_outward_acknowledgements_rice_loading_entry_id_fkey"
            columns: ["rice_loading_entry_id"]
            isOneToOne: false
            referencedRelation: "rice_loading_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      route_summaries: {
        Row: {
          check_in_id: string
          clean_path: Json | null
          processed_at: string | null
          stats: Json | null
          user_id: string
        }
        Insert: {
          check_in_id: string
          clean_path?: Json | null
          processed_at?: string | null
          stats?: Json | null
          user_id: string
        }
        Update: {
          check_in_id?: string
          clean_path?: Json | null
          processed_at?: string | null
          stats?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_summaries_check_in_id_fkey"
            columns: ["check_in_id"]
            isOneToOne: true
            referencedRelation: "duty_status"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          ack_date: string | null
          ack_no: string | null
          base_amount: number | null
          bill_serial_no: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          einvoice_status: string | null
          eway_bill_date: string | null
          eway_bill_no: string | null
          eway_bill_status: string | null
          gst_amount: number | null
          id: string
          irn: string | null
          item_id: string
          loading_place: string
          lorry_no: string | null
          outward_entry_id: string | null
          quantity: number
          rate: number
          sale_date: string
          signed_invoice: string | null
          signed_qrcode: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          ack_date?: string | null
          ack_no?: string | null
          base_amount?: number | null
          bill_serial_no?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          einvoice_status?: string | null
          eway_bill_date?: string | null
          eway_bill_no?: string | null
          eway_bill_status?: string | null
          gst_amount?: number | null
          id?: string
          irn?: string | null
          item_id: string
          loading_place?: string
          lorry_no?: string | null
          outward_entry_id?: string | null
          quantity: number
          rate: number
          sale_date?: string
          signed_invoice?: string | null
          signed_qrcode?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          ack_date?: string | null
          ack_no?: string | null
          base_amount?: number | null
          bill_serial_no?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          einvoice_status?: string | null
          eway_bill_date?: string | null
          eway_bill_no?: string | null
          eway_bill_status?: string | null
          gst_amount?: number | null
          id?: string
          irn?: string | null
          item_id?: string
          loading_place?: string
          lorry_no?: string | null
          outward_entry_id?: string | null
          quantity?: number
          rate?: number
          sale_date?: string
          signed_invoice?: string | null
          signed_qrcode?: string | null
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
      sms_vault: {
        Row: {
          created_at: string | null
          device_id: string | null
          encrypted_payload: string
          id: string
          iv: string
          received_at: string | null
          sender_number: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          encrypted_payload: string
          id?: string
          iv: string
          received_at?: string | null
          sender_number?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          encrypted_payload?: string
          id?: string
          iv?: string
          received_at?: string | null
          sender_number?: string | null
          user_id?: string
        }
        Relationships: []
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
      strategy_config: {
        Row: {
          atr_period: number | null
          id: string
          is_auto_trade_enabled: boolean | null
          mult_bear: number | null
          mult_bull: number | null
          stoploss_pct: number | null
          target1_pct: number | null
          target2_pct: number | null
          timeframe: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          atr_period?: number | null
          id?: string
          is_auto_trade_enabled?: boolean | null
          mult_bear?: number | null
          mult_bull?: number | null
          stoploss_pct?: number | null
          target1_pct?: number | null
          target2_pct?: number | null
          timeframe?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          atr_period?: number | null
          id?: string
          is_auto_trade_enabled?: boolean | null
          mult_bear?: number | null
          mult_bull?: number | null
          stoploss_pct?: number | null
          target1_pct?: number | null
          target2_pct?: number | null
          timeframe?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          opening_balance: number | null
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
          opening_balance?: number | null
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
          opening_balance?: number | null
          phone?: string | null
          pin_code?: string | null
          place_of_supply?: string | null
          state_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      symbols: {
        Row: {
          created_at: string | null
          exchange: string
          id: string
          is_active: boolean | null
          symbol_name: string
          token: string
        }
        Insert: {
          created_at?: string | null
          exchange: string
          id?: string
          is_active?: boolean | null
          symbol_name: string
          token: string
        }
        Update: {
          created_at?: string | null
          exchange?: string
          id?: string
          is_active?: boolean | null
          symbol_name?: string
          token?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      table_metadata: {
        Row: {
          column_default: string | null
          column_name: string
          created_at: string
          data_type: string
          id: number
          is_foreign_key: boolean
          is_not_null: boolean
          is_primary_key: boolean
          schema_name: string
          table_name: string
        }
        Insert: {
          column_default?: string | null
          column_name: string
          created_at?: string
          data_type: string
          id?: number
          is_foreign_key?: boolean
          is_not_null?: boolean
          is_primary_key?: boolean
          schema_name: string
          table_name: string
        }
        Update: {
          column_default?: string | null
          column_name?: string
          created_at?: string
          data_type?: string
          id?: number
          is_foreign_key?: boolean
          is_not_null?: boolean
          is_primary_key?: boolean
          schema_name?: string
          table_name?: string
        }
        Relationships: []
      }
      task_alerts: {
        Row: {
          created_at: string | null
          id: string
          message: string
          seen: boolean | null
          task_id: string | null
          type: Database["public"]["Enums"]["alert_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          seen?: boolean | null
          task_id?: string | null
          type: Database["public"]["Enums"]["alert_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          seen?: boolean | null
          task_id?: string | null
          type?: Database["public"]["Enums"]["alert_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_alerts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          attachment_id: string | null
          created_at: string | null
          id: string
          message: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          attachment_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          attachment_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_group_assignments: {
        Row: {
          created_at: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_group_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_group_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_logs: {
        Row: {
          event: string
          id: string
          remarks: string | null
          task_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          event: string
          id?: string
          remarks?: string | null
          task_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          event?: string
          id?: string
          remarks?: string | null
          task_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_routine_instances: {
        Row: {
          id: string
          routine_id: string
          task_id: string
          triggered_at: string | null
          triggered_for_date: string
        }
        Insert: {
          id?: string
          routine_id: string
          task_id: string
          triggered_at?: string | null
          triggered_for_date: string
        }
        Update: {
          id?: string
          routine_id?: string
          task_id?: string
          triggered_at?: string | null
          triggered_for_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_routine_instances_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "task_routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_routine_instances_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_routines: {
        Row: {
          assigned_by: string
          assigned_to: string | null
          assigned_to_group_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          monthly_dates: number[] | null
          next_trigger_at: string | null
          priority: string | null
          recurrence_type: string
          start_date: string | null
          target_time: string | null
          title: string
          updated_at: string | null
          weekdays: number[] | null
        }
        Insert: {
          assigned_by: string
          assigned_to?: string | null
          assigned_to_group_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          monthly_dates?: number[] | null
          next_trigger_at?: string | null
          priority?: string | null
          recurrence_type: string
          start_date?: string | null
          target_time?: string | null
          title: string
          updated_at?: string | null
          weekdays?: number[] | null
        }
        Update: {
          assigned_by?: string
          assigned_to?: string | null
          assigned_to_group_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          monthly_dates?: number[] | null
          next_trigger_at?: string | null
          priority?: string | null
          recurrence_type?: string
          start_date?: string | null
          target_time?: string | null
          title?: string
          updated_at?: string | null
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "task_routines_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_routines_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_routines_assigned_to_group_id_fkey"
            columns: ["assigned_to_group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      task_transfers: {
        Row: {
          from_user: string | null
          id: string
          reason: string | null
          task_id: string | null
          to_user: string | null
          transferred_at: string | null
        }
        Insert: {
          from_user?: string | null
          id?: string
          reason?: string | null
          task_id?: string | null
          to_user?: string | null
          transferred_at?: string | null
        }
        Update: {
          from_user?: string | null
          id?: string
          reason?: string | null
          task_id?: string | null
          to_user?: string | null
          transferred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_transfers_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_transfers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_transfers_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_updates: {
        Row: {
          created_at: string | null
          id: string
          photo_url: string | null
          remarks: string | null
          status: string | null
          task_id: string
          updated_at: string | null
          user_id: string
          voice_recording_url: string | null
          voice_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo_url?: string | null
          remarks?: string | null
          status?: string | null
          task_id: string
          updated_at?: string | null
          user_id: string
          voice_recording_url?: string | null
          voice_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          photo_url?: string | null
          remarks?: string | null
          status?: string | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
          voice_recording_url?: string | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          arrival_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          assigned_to_group_id: string | null
          completed_at: string | null
          completion_audio_url: string | null
          completion_image_urls: string[] | null
          completion_notes: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          leave_at: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          location_radius: number | null
          notification_sent: boolean | null
          priority: Database["public"]["Enums"]["task_priority_type"] | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["task_status_type"] | null
          title: string
          updated_at: string | null
          voice_recording_url: string | null
        }
        Insert: {
          arrival_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          assigned_to_group_id?: string | null
          completed_at?: string | null
          completion_audio_url?: string | null
          completion_image_urls?: string[] | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          leave_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          location_radius?: number | null
          notification_sent?: boolean | null
          priority?: Database["public"]["Enums"]["task_priority_type"] | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["task_status_type"] | null
          title: string
          updated_at?: string | null
          voice_recording_url?: string | null
        }
        Update: {
          arrival_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          assigned_to_group_id?: string | null
          completed_at?: string | null
          completion_audio_url?: string | null
          completion_image_urls?: string[] | null
          completion_notes?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          leave_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          location_radius?: number | null
          notification_sent?: boolean | null
          priority?: Database["public"]["Enums"]["task_priority_type"] | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["task_status_type"] | null
          title?: string
          updated_at?: string | null
          voice_recording_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_group_id_fkey"
            columns: ["assigned_to_group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
        ]
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
      trade_history: {
        Row: {
          created_at: string | null
          entry_price: number | null
          exit_price: number | null
          id: string
          order_id: string | null
          pnl: number | null
          signal_type: string
          status: string | null
          stop_loss: number | null
          symbol: string
          target1: number | null
          target2: number | null
        }
        Insert: {
          created_at?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          order_id?: string | null
          pnl?: number | null
          signal_type: string
          status?: string | null
          stop_loss?: number | null
          symbol: string
          target1?: number | null
          target2?: number | null
        }
        Update: {
          created_at?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          order_id?: string | null
          pnl?: number | null
          signal_type?: string
          status?: string | null
          stop_loss?: number | null
          symbol?: string
          target1?: number | null
          target2?: number | null
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
          external_reference: string | null
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
          external_reference?: string | null
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
          external_reference?: string | null
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
      transport_items: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          bill_collected: boolean | null
          bill_number: string | null
          bill_photo_url: string | null
          confirmation_date: string | null
          created_at: string | null
          created_by: string | null
          hint: string | null
          id: string
          item_id: string | null
          item_name: string | null
          loading_photo_url: string | null
          loading_place_id: string | null
          lorry_id: string | null
          status: string | null
          token_date: string | null
          token_no: number
          unloading_date: string | null
          unloading_photo_url: string | null
          unloading_place_id: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          bill_collected?: boolean | null
          bill_number?: string | null
          bill_photo_url?: string | null
          confirmation_date?: string | null
          created_at?: string | null
          created_by?: string | null
          hint?: string | null
          id?: string
          item_id?: string | null
          item_name?: string | null
          loading_photo_url?: string | null
          loading_place_id?: string | null
          lorry_id?: string | null
          status?: string | null
          token_date?: string | null
          token_no?: number
          unloading_date?: string | null
          unloading_photo_url?: string | null
          unloading_place_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          bill_collected?: boolean | null
          bill_number?: string | null
          bill_photo_url?: string | null
          confirmation_date?: string | null
          created_at?: string | null
          created_by?: string | null
          hint?: string | null
          id?: string
          item_id?: string | null
          item_name?: string | null
          loading_photo_url?: string | null
          loading_place_id?: string | null
          lorry_id?: string | null
          status?: string | null
          token_date?: string | null
          token_no?: number
          unloading_date?: string | null
          unloading_photo_url?: string | null
          unloading_place_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_loading_place_id_fkey"
            columns: ["loading_place_id"]
            isOneToOne: false
            referencedRelation: "loading_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_lorry_id_fkey"
            columns: ["lorry_id"]
            isOneToOne: false
            referencedRelation: "lorries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_unloading_place_id_fkey"
            columns: ["unloading_place_id"]
            isOneToOne: false
            referencedRelation: "unloading_places"
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
      unified_offline_frk_inward_entries: {
        Row: {
          batch_no: string
          bill_no: string
          created_at: string
          created_by: string | null
          device_id: string
          entry_date: string
          id: string
          mill: string
          quantity: number
          serial_no: string
          synced: boolean | null
          updated_at: string
        }
        Insert: {
          batch_no: string
          bill_no: string
          created_at?: string
          created_by?: string | null
          device_id: string
          entry_date?: string
          id: string
          mill: string
          quantity: number
          serial_no: string
          synced?: boolean | null
          updated_at?: string
        }
        Update: {
          batch_no?: string
          bill_no?: string
          created_at?: string
          created_by?: string | null
          device_id?: string
          entry_date?: string
          id?: string
          mill?: string
          quantity?: number
          serial_no?: string
          synced?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      unified_offline_frk_outward_entries: {
        Row: {
          created_at: string
          created_by: string | null
          device_id: string
          entry_date: string
          id: string
          mill: string
          quantity: number
          rice_loading_bill_no: string
          rice_loading_entry_id: string | null
          synced: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device_id: string
          entry_date?: string
          id: string
          mill: string
          quantity: number
          rice_loading_bill_no: string
          rice_loading_entry_id?: string | null
          synced?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device_id?: string
          entry_date?: string
          id?: string
          mill?: string
          quantity?: number
          rice_loading_bill_no?: string
          rice_loading_entry_id?: string | null
          synced?: boolean | null
          updated_at?: string
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
          gross_weight: number | null
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
          wayment_type: string | null
          wayment_weight: number
          without_empty_excess_resolved: boolean | null
        }
        Insert: {
          bags: number
          challan_photo_url?: string | null
          created_at?: string | null
          device_id: string
          driver: string
          entry_date: string
          grade: string
          gross_weight?: number | null
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
          wayment_type?: string | null
          wayment_weight: number
          without_empty_excess_resolved?: boolean | null
        }
        Update: {
          bags?: number
          challan_photo_url?: string | null
          created_at?: string | null
          device_id?: string
          driver?: string
          entry_date?: string
          grade?: string
          gross_weight?: number | null
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
          wayment_type?: string | null
          wayment_weight?: number
          without_empty_excess_resolved?: boolean | null
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
          gs_sync_timestamp: string | null
          hint: string | null
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
          gs_sync_timestamp?: string | null
          hint?: string | null
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
          gs_sync_timestamp?: string | null
          hint?: string | null
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
      unloading_control_sessions: {
        Row: {
          completed_points: Json
          created_at: string
          created_by: string | null
          id: string
          inward_entry_id: string | null
          labour: string
          mill: string | null
          selected_points: Json
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          completed_points?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          inward_entry_id?: string | null
          labour?: string
          mill?: string | null
          selected_points?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          completed_points?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          inward_entry_id?: string | null
          labour?: string
          mill?: string | null
          selected_points?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unloading_control_sessions_inward_entry_id_fkey"
            columns: ["inward_entry_id"]
            isOneToOne: false
            referencedRelation: "rice_mill_inward_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      unloading_places: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      upi_mappings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          target_id: string
          target_type: string
          updated_at: string | null
          upi_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          target_id: string
          target_type: string
          updated_at?: string | null
          upi_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          target_id?: string
          target_type?: string
          updated_at?: string | null
          upi_id?: string
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
      user_device_state: {
        Row: {
          battery_level: number | null
          is_data_enabled: boolean | null
          is_gps_enabled: boolean | null
          is_on_duty: boolean | null
          last_ping: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          battery_level?: number | null
          is_data_enabled?: boolean | null
          is_gps_enabled?: boolean | null
          is_on_duty?: boolean | null
          last_ping?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          battery_level?: number | null
          is_data_enabled?: boolean | null
          is_gps_enabled?: boolean | null
          is_on_duty?: boolean | null
          last_ping?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_device_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gps_positions: {
        Row: {
          accuracy: number | null
          heading: number | null
          id: string
          last_updated: string | null
          latitude: number
          longitude: number
          speed: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          heading?: number | null
          id?: string
          last_updated?: string | null
          latitude: number
          longitude: number
          speed?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          heading?: number | null
          id?: string
          last_updated?: string | null
          latitude?: number
          longitude?: number
          speed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_group_members: {
        Row: {
          added_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_groups: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_ledger_access: {
        Row: {
          business_contact_id: string | null
          can_use_ledger: boolean
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
          can_use_ledger?: boolean
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
          can_use_ledger?: boolean
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
          can_access: boolean | null
          created_at: string | null
          id: string
          page_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_access?: boolean | null
          created_at?: string | null
          id?: string
          page_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_access?: boolean | null
          created_at?: string | null
          id?: string
          page_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_page_access_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "app_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          dark_mode: boolean | null
          email_notifications: boolean | null
          id: string
          job_transfer_alerts: boolean | null
          location_alerts: boolean | null
          push_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dark_mode?: boolean | null
          email_notifications?: boolean | null
          id?: string
          job_transfer_alerts?: boolean | null
          location_alerts?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dark_mode?: boolean | null
          email_notifications?: boolean | null
          id?: string
          job_transfer_alerts?: boolean | null
          location_alerts?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
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
      user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          login_time: string
          logout_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          login_time?: string
          logout_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          login_time?: string
          logout_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_alerts: {
        Row: {
          alert_type: string | null
          due_date: string | null
          generated_at: string | null
          id: string
          lorry_id: string | null
          status: string | null
        }
        Insert: {
          alert_type?: string | null
          due_date?: string | null
          generated_at?: string | null
          id?: string
          lorry_id?: string | null
          status?: string | null
        }
        Update: {
          alert_type?: string | null
          due_date?: string | null
          generated_at?: string | null
          id?: string
          lorry_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_alerts_lorry_id_fkey"
            columns: ["lorry_id"]
            isOneToOne: false
            referencedRelation: "lorries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_bottlenecks: {
        Row: {
          avg_duration_minutes: number | null
          from_location: string | null
          to_location: string | null
          total_transfers: number | null
          transfer_date: string | null
        }
        Relationships: []
      }
      analytics_cash_runway: {
        Row: {
          avg_daily_burn: number | null
          current_cash_balance: number | null
          estimated_runway_days: number | null
        }
        Relationships: []
      }
      analytics_employee_cash_holding: {
        Row: {
          avg_closing_balance: number | null
          days_holding_cash: number | null
          last_date: string | null
          user_id: string | null
        }
        Relationships: []
      }
      analytics_production_daily: {
        Row: {
          entry_date: string | null
          inward_quantity: number | null
          mill: string | null
          outward_quantity: number | null
        }
        Relationships: []
      }
      analytics_stock_efficiency: {
        Row: {
          day: string | null
          kg_per_machine_hour: number | null
          total_machine_hours: number | null
          total_output_kg: number | null
        }
        Relationships: []
      }
      analytics_task_performance: {
        Row: {
          completed_tasks: number | null
          overdue_tasks: number | null
          total_tasks: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      container_reconciliation_anomalies_v1: {
        Row: {
          anomaly_type: string | null
          batch_id: string | null
          created_at: string | null
          grade: string | null
          location: string | null
          location_type: string | null
          mill: string | null
          weight: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      __codex_plpgsql_smoke: { Args: never; Returns: string }
      __ctx_check: { Args: never; Returns: string }
      admin_cleanup_salary_data: {
        Args: never
        Returns: {
          attendance_deleted: number
          ledgers_deleted: number
          salary_ledgers_deleted: number
          transactions_deleted: number
        }[]
      }
      calculate_audit_opening_balance: {
        Args: { p_date: string; p_user_id: string }
        Returns: number
      }
      calculate_distance: {
        Args: { end_time: string; start_time: string; target_user_id: string }
        Returns: number
      }
      change_user_role: {
        Args: {
          p_admin_user_id: string
          p_new_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: Json
      }
      check_and_fix_receipt_ledger_integrity: { Args: never; Returns: Json }
      check_ledger_integrity: {
        Args: never
        Returns: {
          credit_amount: number
          debit_amount: number
          issue: string
          ledger_id: string
          reference_id: string
          transaction_date: string
          transaction_type: string
        }[]
      }
      cleanup_duplicate_container_contents: { Args: never; Returns: undefined }
      cleanup_old_data: { Args: never; Returns: undefined }
      cleanup_old_offline_data: { Args: never; Returns: Json }
      clear_all_task_data: { Args: never; Returns: Json }
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
      create_credit_note_with_ledger: {
        Args: { p_ledger_data: Json; p_note_data: Json }
        Returns: Json
      }
      create_debit_note_with_ledger: {
        Args: { p_ledger_data: Json; p_note_data: Json }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_app_id?: string
          p_message: string
          p_related_job_id: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_receipt_with_ledger: {
        Args: { p_ledger_data: Json; p_receipt_data: Json }
        Returns: Json
      }
      create_sale_with_ledger: {
        Args: { p_ledger_data: Json; p_sale_data: Json }
        Returns: Json
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
          p_employee_name?: string
        }
        Returns: string
      }
      execute_process_transfer:
        | {
            Args: {
              p_batch_id: string
              p_complete_unloading?: boolean
              p_created_by: string
              p_expected_completion_time: string
              p_expected_duration_minutes: number
              p_from_location: string
              p_from_location_type: string
              p_grade: string
              p_mill: string
              p_process_start_time: string
              p_thotti_no: string
              p_to_location: string
              p_to_location_type: string
              p_weight: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_batch_id: string
              p_complete_unloading?: boolean
              p_created_by: string
              p_entry_datetime?: string
              p_expected_completion_time: string
              p_expected_duration_minutes: number
              p_from_location: string
              p_from_location_type: string
              p_grade: string
              p_mill: string
              p_process_start_time: string
              p_thotti_no: string
              p_to_location: string
              p_to_location_type: string
              p_weight: number
            }
            Returns: Json
          }
      execute_process_transfer_with_datetime: {
        Args: {
          p_batch_id: string
          p_complete_unloading?: boolean
          p_created_by: string
          p_entry_datetime?: string
          p_expected_completion_time: string
          p_expected_duration_minutes: number
          p_from_location: string
          p_from_location_type: string
          p_grade: string
          p_mill: string
          p_process_start_time: string
          p_thotti_no: string
          p_to_location: string
          p_to_location_type: string
          p_weight: number
        }
        Returns: Json
      }
      execute_readonly_sql: { Args: { sql_query: string }; Returns: Json }
      execute_rice_loading_delete: {
        Args: {
          p_deleted_by?: string
          p_entry_id: string
          p_target_storage?: string
        }
        Returns: Json
      }
      execute_rice_loading_entry: {
        Args: {
          p_allotment_month: string
          p_bag_grade: string
          p_bags: number
          p_bill_no: string
          p_bill_photo_url: string
          p_created_by: string
          p_driver: string
          p_godown: string
          p_grade: string
          p_hint?: string
          p_is_frk?: boolean
          p_labour: string
          p_lorry_no: string
          p_mill: string
          p_rice_storage: string
          p_weight: number
        }
        Returns: Json
      }
      execute_rice_loading_entry_with_datetime: {
        Args: {
          p_allotment_month: string
          p_bag_grade: string
          p_bags: number
          p_bill_no: string
          p_bill_photo_url: string
          p_created_by: string
          p_driver: string
          p_entry_datetime?: string
          p_godown: string
          p_grade: string
          p_hint?: string
          p_is_frk?: boolean
          p_labour: string
          p_lorry_no: string
          p_mill: string
          p_rice_storage: string
          p_weight: number
        }
        Returns: Json
      }
      execute_rice_loading_update: {
        Args: {
          p_entry_id: string
          p_is_frk?: boolean
          p_new_bags: number
          p_new_grade?: string
          p_new_hint?: string
          p_new_weight: number
          p_reason: string
          p_updated_by: string
        }
        Returns: Json
      }
      execute_rice_return: {
        Args: {
          p_bags: number
          p_bill_no: string
          p_created_by: string
          p_frk_weight: number
          p_grade: string
          p_location: string
          p_location_type: string
          p_mill: string
          p_rice_weight: number
        }
        Returns: Json
      }
      execute_unloading_item: {
        Args: {
          p_actual_weight: number
          p_bags: number
          p_created_by: string
          p_grade: string
          p_inward_entry_id: string
          p_labour: string
          p_location_type: string
          p_mill: string
          p_unloading_point: string
        }
        Returns: Json
      }
      execute_visual_transfer:
        | {
            Args: {
              p_batch_id: string
              p_batch_update_id?: string
              p_destination_bags?: number
              p_from_location: string
              p_from_location_type: string
              p_grade: string
              p_labour: string
              p_mill: string
              p_notes: string
              p_source_deductions: Json
              p_thotti_no: string
              p_to_location: string
              p_to_location_type: string
              p_total_bags: number
              p_total_weight: number
              p_transferred_by: string
              p_update_batch_location?: boolean
            }
            Returns: Json
          }
        | {
            Args: {
              p_batch_id: string
              p_batch_update_id?: string
              p_destination_bags?: number
              p_destination_entries?: Json
              p_from_location: string
              p_from_location_type: string
              p_grade: string
              p_labour: string
              p_mill: string
              p_notes: string
              p_source_deductions: Json
              p_thotti_no: string
              p_to_location: string
              p_to_location_type: string
              p_total_bags: number
              p_total_weight: number
              p_transferred_by: string
              p_update_batch_location?: boolean
            }
            Returns: Json
          }
      fix_running_balances: { Args: never; Returns: undefined }
      generate_and_reserve_thotti_no: { Args: never; Returns: string }
      generate_batch_no: { Args: never; Returns: string }
      generate_credit_note_no:
        | { Args: never; Returns: string }
        | { Args: { p_mill: string }; Returns: string }
      generate_debit_note_no:
        | { Args: never; Returns: string }
        | { Args: { p_mill: string }; Returns: string }
      generate_payment_no: { Args: never; Returns: string }
      generate_receipt_no: { Args: never; Returns: string }
      generate_thotti_no:
        | { Args: never; Returns: string }
        | { Args: { p_location: string; p_mill: string }; Returns: string }
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
      get_balance_sheet: {
        Args: { p_as_of_date: string }
        Returns: {
          amount: number
          category: string
          particulars: string
        }[]
      }
      get_batch_history_v2: { Args: { p_batch_id: string }; Returns: Json }
      get_batch_list_v2: {
        Args: never
        Returns: {
          batch_no: string
          created_at: string
          current_location: string
          current_location_type: string
          current_weight: number
          grade: string
          id: string
          initial_weight: number
          mill: string
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
      get_container_ledger_v3: {
        Args: {
          p_end_date: string
          p_location: string
          p_mill: string
          p_start_date: string
        }
        Returns: {
          batch_no: string
          form_name: string
          id: string
          lorry_number: string
          notes: string
          reference_id: string
          reference_type: string
          related_info: string
          running_balance: number
          transaction_date: string
          transaction_type: string
          weight_in: number
          weight_out: number
        }[]
      }
      get_current_container_status_v1: {
        Args: { p_mill: string }
        Returns: {
          batch_id: string
          batch_no: string
          expected_completion_time: string
          grade: string
          is_overdue: boolean
          location: string
          location_type: string
          process_start_time: string
          thotti_no: string
          timing: string
          weight: number
        }[]
      }
      get_daily_context: { Args: never; Returns: Json }
      get_email_from_username: { Args: { p_username: string }; Returns: string }
      get_employee_salary_details: {
        Args: { p_date_from: string; p_date_to: string; p_employee_id: string }
        Returns: {
          daily_records: Json
          total_days: number
          total_salary: number
        }[]
      }
      get_failed_transactions_summary: {
        Args: { p_user_id?: string }
        Returns: {
          permanently_failed_count: number
          resolved_count: number
          retrying_count: number
          total_count: number
          transaction_type: string
        }[]
      }
      get_frk_ledger_v2: {
        Args: { p_from_date?: string; p_mill: string; p_to_date?: string }
        Returns: {
          bill_no: string
          created_at: string
          entry_date: string
          inward: number
          mill: string
          outward: number
          type: string
        }[]
      }
      get_inward_report_v2: {
        Args: {
          p_from_date: string
          p_grade: string
          p_loading_point: string
          p_mill: string
          p_to_date: string
        }
        Returns: {
          accounting_mill: string | null
          bags: number
          challan_photo_url: string | null
          created_at: string
          created_by: string | null
          dpc_amount: number | null
          driver: string
          empty_time: string | null
          empty_weight: number | null
          entry_date: string
          entry_unique_id: string
          grade: string
          gross_weight: number | null
          id: string
          is_unloaded: boolean
          load_time: string | null
          loading_point: string | null
          lorry_number: string
          mill: string
          serial_no: string
          token_id: string | null
          updated_at: string
          wayment_photo_url: string | null
          wayment_type: string | null
          wayment_weight: number
          without_empty_excess_resolved: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "rice_mill_inward_entries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_issue_memo_report_v2: {
        Args: never
        Returns: {
          additional_bag_grade_1: string
          additional_bag_grade_2: string
          additional_quantity_1: number
          additional_quantity_2: number
          bag_grade: string
          bags: number
          created_at: string
          entry_unique_id: string
          id: string
          issue_memo_date: string
          issue_memo_no: string
          paddy_inward_entry_id: string
          rice_mill_inward_entries: Json
          weight: number
        }[]
      }
      get_labour_kooli_report_v2: {
        Args: {
          p_from_date: string
          p_labour: string
          p_mill: string
          p_to_date: string
          p_type: string
        }
        Returns: {
          bags: number
          created_at: string
          created_by: string
          details: string
          entry_date: string
          id: string
          labour: string
          mill: string
          source_type: string
          weight: number
        }[]
      }
      get_ledger_opening_balance_v2: {
        Args: { p_date: string; p_ledger_id: string }
        Returns: number
      }
      get_live_lorry_status_v2: { Args: never; Returns: Json }
      get_live_rent_lorry_status_v2: { Args: never; Returns: Json }
      get_live_stock_levels_v2: { Args: { p_mill: string }; Returns: Json }
      get_lorry_movement_history_v2: {
        Args: { p_days?: number; p_lorry_no: string }
        Returns: {
          bags: number
          details: string
          driver: string
          mill: string
          movement_date: string
          movement_type: string
          place: string
          weight: number
        }[]
      }
      get_next_inward_serial: {
        Args: { p_entry_date: string; p_mill: string }
        Returns: number
      }
      get_opening_balance_for_date: {
        Args: { p_date: string; p_user_id: string }
        Returns: number
      }
      get_or_create_batch_for_unloading_point:
        | { Args: { p_mill: string; p_unloading_point: string }; Returns: Json }
        | {
            Args: { p_grade: string; p_mill: string; p_unloading_point: string }
            Returns: Json
          }
      get_pending_bills_v2: { Args: never; Returns: Json }
      get_pending_paddy_inwards_v2: {
        Args: never
        Returns: {
          bags: number
          entry_date: string
          entry_unique_id: string
          grade: string
          id: string
          loading_point: string
          lorry_number: string
          serial_no: string
          wayment_weight: number
        }[]
      }
      get_profit_and_loss: {
        Args: { p_from_date: string; p_to_date: string }
        Returns: {
          amount: number
          category: string
          particulars: string
        }[]
      }
      get_rice_loading_report_v2:
        | {
            Args: {
              p_allotment_month: string
              p_from_date: string
              p_godown: string
              p_grade: string
              p_to_date: string
            }
            Returns: {
              allotment_month: string
              bags: number
              bill_no: string
              bill_photo_url: string
              driver: string
              entry_date: string
              godown: string
              grade: string
              hint: string
              id: string
              lorry_no: string
              mill: string
              rice_outward_acknowledgements: Json
              rice_storage: string
              status: string
              weight: number
            }[]
          }
        | {
            Args: {
              p_allotment_month: string
              p_from_date: string
              p_godown: string
              p_grade: string
              p_mill?: string
              p_to_date: string
            }
            Returns: {
              allotment_month: string
              bags: number
              bill_no: string
              bill_photo_url: string
              driver: string
              entry_date: string
              godown: string
              grade: string
              gs_sync_timestamp: string
              hint: string
              id: string
              lorry_no: string
              mill: string
              rice_outward_acknowledgements: Json
              rice_storage: string
              status: string
              weight: number
            }[]
          }
      get_rice_outward_ack_report_v2:
        | {
            Args: never
            Returns: {
              ack_bags: number
              ack_date: string
              ack_godown: string
              ack_number: string
              ack_weight: number
              created_at: string
              grade: string
              id: string
              rice_loading_entries: Json
              rice_loading_entry_id: string
            }[]
          }
        | {
            Args: {
              p_from_date?: string
              p_godown?: string
              p_grade?: string
              p_mill?: string
              p_to_date?: string
            }
            Returns: {
              ack_bags: number
              ack_date: string
              ack_godown: string
              ack_number: string
              ack_weight: number
              created_at: string
              grade: string
              id: string
              rice_loading_entries: Json
              rice_loading_entry_id: string
            }[]
          }
      get_rice_outward_acknowledgement_report_v2: {
        Args: never
        Returns: {
          ack_bags: number
          ack_date: string
          ack_godown: string
          ack_number: string
          ack_weight: number
          created_at: string
          grade: string
          id: string
          rice_loading_entries: Json
          rice_loading_entry_id: string
        }[]
      }
      get_thotti_batch_history_v2:
        | { Args: { p_mill: string }; Returns: Json }
        | {
            Args: { p_from_date?: string; p_mill: string; p_to_date?: string }
            Returns: Json
          }
      get_total_ledgers_closing_balance: {
        Args: { p_date: string }
        Returns: number
      }
      get_total_users_closing_balance: {
        Args: { p_date: string }
        Returns: number
      }
      get_transfer_container_stock_v2: {
        Args: { p_mill: string }
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
      get_waiting_lorry_list_v2: {
        Args: { status_filter: string }
        Returns: Json
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
      log_failed_transaction: {
        Args: {
          p_attempted_data: Json
          p_error_code?: string
          p_error_message: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: string
      }
      populate_missing_daily_balances: { Args: never; Returns: undefined }
      post_kooli_to_ledger: { Args: { entries: Json }; Returns: undefined }
      process_bulk_transactions: {
        Args: { p_transactions: Json }
        Returns: Json
      }
      process_scheduled_assignments: { Args: never; Returns: undefined }
      process_transaction: {
        Args: {
          p_amount: number
          p_attached_bill?: string
          p_created_by: string
          p_date: string
          p_description: string
          p_external_reference?: string
          p_ledger_id?: string
          p_source_ledger_id?: string
          p_transfer_to_user_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      raise_exception: { Args: { msg: string }; Returns: undefined }
      reassign_thotti_numbers_chronologically: {
        Args: { p_sync_session_id?: string }
        Returns: Json
      }
      rebuild_all_daily_balances: { Args: never; Returns: undefined }
      rebuild_daily_balances_after_date: {
        Args: { p_cutoff_date: string }
        Returns: Json
      }
      recalculate_all_running_balances: { Args: never; Returns: undefined }
      recalculate_customer_ledger_balances: {
        Args: { p_customer_id: string; p_from_date: string }
        Returns: undefined
      }
      recalculate_daily_balances_from_date:
        | {
            Args: { p_from_date: string; p_user_id: string }
            Returns: undefined
          }
        | {
            Args: { p_from_date: string; p_user_ids: string[] }
            Returns: undefined
          }
      recalculate_ledger_balances: {
        Args: { p_from_date?: string; p_ledger_id: string }
        Returns: undefined
      }
      recalculate_running_balances_from_date: {
        Args: { p_from_date: string; p_user_ids: string[] }
        Returns: undefined
      }
      recalculate_user_balances: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      recompute_daily_balance:
        | { Args: { p_date: string; p_user_id: string }; Returns: undefined }
        | { Args: { p_date: string; p_user_id: string }; Returns: undefined }
      reconcile_cashbook_transaction:
        | {
            Args: {
              p_amount: number
              p_created_by: string
              p_date: string
              p_description: string
              p_ledger_id?: string
              p_source_ledger_id?: string
              p_transfer_to_user_id?: string
              p_txn_id: string
              p_type: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_created_by: string
              p_date: string
              p_description: string
              p_ledger_id?: string
              p_source_ledger_id?: string
              p_transfer_to_user_id?: string
              p_txn_id: string
              p_type: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_created_by: string
              p_date: string
              p_description: string
              p_ledger_id: string
              p_transfer_to_user_id: string
              p_txn_id: string
              p_type: string
              p_user_id: string
            }
            Returns: Json
          }
      reconcile_customer_receipt_v2: {
        Args: {
          p_amount: number
          p_bank_recon_data: Json
          p_created_by: string
          p_customer_id: string
          p_customer_name: string
          p_payment_method: string
          p_receipt_date: string
          p_remarks: string
          p_source_ledger_id: string
        }
        Returns: Json
      }
      reconcile_supplier_payment_v2: {
        Args: {
          p_amount: number
          p_bank_recon_data: Json
          p_created_by: string
          p_payment_date: string
          p_payment_method: string
          p_remarks: string
          p_source_ledger_id: string
          p_supplier_id: string
          p_supplier_name: string
        }
        Returns: Json
      }
      reconcile_transaction_v1: {
        Args: {
          p_amount: number
          p_attached_bill?: string
          p_bank_cleaned_narration?: string
          p_bank_closing_balance?: number
          p_bank_credit_amount?: number
          p_bank_debit_amount?: number
          p_bank_orig_narration?: string
          p_bank_ref_num?: string
          p_bank_source_ledger_id?: string
          p_created_by: string
          p_date: string
          p_description: string
          p_ledger_id?: string
          p_reconciliation_type?: string
          p_source_ledger_id?: string
          p_transfer_to_user_id?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      refresh_transaction_cache: {
        Args: { p_date: string; p_user_id: string }
        Returns: undefined
      }
      tm_accept_instruction: {
        Args: { p_instruction_id: string; p_remarks: string; p_user_id: string }
        Returns: Json
      }
      tm_add_gps_task_update: {
        Args: {
          p_gps_task_id: string
          p_photo_url?: string
          p_remarks: string
          p_status: string
          p_user_id: string
          p_voice_url?: string
        }
        Returns: Json
      }
      tm_add_task_update: {
        Args: {
          p_photo_url: string
          p_remarks: string
          p_status: string
          p_task_id: string
          p_user_id: string
          p_voice_url: string
        }
        Returns: Json
      }
      tm_check_pending_tasks: { Args: { p_user_id: string }; Returns: Json }
      tm_complete_gps_task: {
        Args: { p_gps_task_id: string; p_user_id: string }
        Returns: Json
      }
      tm_create_group_gps_task:
        | {
            Args: {
              p_assigned_by: string
              p_description: string
              p_group_id: string
              p_latitude: number
              p_longitude: number
              p_radius: number
              p_target_time: string
              p_title: string
              p_voice_recording_url: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_assigned_by: string
              p_description: string
              p_group_id: string
              p_latitude: number
              p_longitude: number
              p_radius: number
              p_target_time: string
              p_title: string
            }
            Returns: Json
          }
      tm_create_group_instruction:
        | {
            Args: {
              p_assigned_by: string
              p_description: string
              p_group_id: string
              p_title: string
              p_voice_recording_url: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_assigned_by: string
              p_description: string
              p_group_id: string
              p_title: string
              p_voice_recording_url: string
            }
            Returns: Json
          }
      tm_create_group_task: {
        Args: {
          p_assigned_by: string
          p_description: string
          p_group_id: string
          p_priority: string
          p_target_time: string
          p_title: string
          p_voice_recording_url: string
        }
        Returns: Json
      }
      tm_postpone_task: {
        Args: { p_reason?: string; p_task_id: string; p_user_id: string }
        Returns: Json
      }
      tm_register_fcm_token:
        | {
            Args: {
              p_device_info: string
              p_platform: string
              p_token: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_app_id?: string
              p_device_info: string
              p_platform: string
              p_token: string
              p_user_id: string
            }
            Returns: undefined
          }
      tm_transfer_gps_task: {
        Args: {
          p_from_user: string
          p_reason: string
          p_task_id: string
          p_to_user: string
        }
        Returns: Json
      }
      tm_transfer_task: {
        Args: {
          p_from_user: string
          p_reason: string
          p_task_id: string
          p_to_user: string
        }
        Returns: Json
      }
      toggle_task_routine_status: {
        Args: { p_routine_id: string; p_status: boolean }
        Returns: undefined
      }
      undo_transfer: { Args: { transfer_id: string }; Returns: Json }
      undo_unloading_entry: { Args: { p_unloading_id: string }; Returns: Json }
      unpost_kooli_ledger_transaction: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
      update_overdue_status: { Args: never; Returns: undefined }
      update_retry_attempt: {
        Args: { p_success?: boolean; p_transaction_id: string }
        Returns: undefined
      }
      update_sale_with_ledger: {
        Args: {
          p_outward_entry_data: Json
          p_sale_data: Json
          p_sale_id: string
          p_user_id: string
        }
        Returns: Json
      }
      update_supplier_balance: {
        Args: { p_supplier_id: string }
        Returns: undefined
      }
      update_user_device_status: {
        Args: {
          p_battery: number
          p_data: boolean
          p_duty: boolean
          p_gps: boolean
          p_metadata?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      user_has_page_access:
        | { Args: { _page_route: string; _user_id: string }; Returns: boolean }
        | { Args: { _page_route: string; _user_id: string }; Returns: boolean }
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
      validate_undo_operation: { Args: { transfer_id: string }; Returns: Json }
      verify_daily_balance_chain: { Args: never; Returns: Json }
    }
    Enums: {
      alert_type:
        | "task_assigned"
        | "task_reminder"
        | "task_completed"
        | "arrived"
        | "left_without_completion"
        | "task_transferred"
      app_role: "admin" | "moderator" | "user" | "manager" | "employee"
      task_priority_type: "low" | "medium" | "high" | "urgent"
      task_status_type:
        | "assigned"
        | "in_progress"
        | "completed"
        | "transferred"
        | "missed"
        | "postponed"
      user_role_type: "manager" | "supervisor" | "operator"
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
      alert_type: [
        "task_assigned",
        "task_reminder",
        "task_completed",
        "arrived",
        "left_without_completion",
        "task_transferred",
      ],
      app_role: ["admin", "moderator", "user", "manager", "employee"],
      task_priority_type: ["low", "medium", "high", "urgent"],
      task_status_type: [
        "assigned",
        "in_progress",
        "completed",
        "transferred",
        "missed",
        "postponed",
      ],
      user_role_type: ["manager", "supervisor", "operator"],
    },
  },
} as const
