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
      attendance_profiles: {
        Row: {
          created_at: string
          department: string | null
          employee_id: string | null
          face_embeddings: Json | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_id?: string | null
          face_embeddings?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_id?: string | null
          face_embeddings?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          confidence_score: number | null
          created_at: string
          date: string
          id: string
          profile_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          confidence_score?: number | null
          created_at?: string
          date?: string
          id?: string
          profile_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          confidence_score?: number | null
          created_at?: string
          date?: string
          id?: string
          profile_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "attendance_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          id: string
          is_active: boolean
          name_english: string
          name_tamil: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description_english?: string | null
          description_tamil?: string | null
          id?: string
          is_active?: boolean
          name_english: string
          name_tamil?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description_english?: string | null
          description_tamil?: string | null
          id?: string
          is_active?: boolean
          name_english?: string
          name_tamil?: string | null
          unit?: string
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
          load_weight_updated_at: string | null
          load_weight_updated_by: string | null
          loading_place: string
          lorry_no: string
          net_weight: number | null
          remarks: string | null
          serial_no: number
          updated_at: string
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
          load_weight_updated_at?: string | null
          load_weight_updated_by?: string | null
          loading_place?: string
          lorry_no: string
          net_weight?: number | null
          remarks?: string | null
          serial_no?: number
          updated_at?: string
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
          load_weight_updated_at?: string | null
          load_weight_updated_by?: string | null
          loading_place?: string
          lorry_no?: string
          net_weight?: number | null
          remarks?: string | null
          serial_no?: number
          updated_at?: string
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
      sales: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          item_id: string
          outward_entry_id: string
          quantity: number
          rate: number
          sale_date: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          item_id: string
          outward_entry_id: string
          quantity: number
          rate: number
          sale_date?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          item_id?: string
          outward_entry_id?: string
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
      fix_running_balances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_receipt_no: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_cached_balance: {
        Args: { p_balance_type: string; p_date?: string; p_user_id: string }
        Returns: number
      }
      get_closing_balance_for_date: {
        Args: { p_date: string; p_user_id: string }
        Returns: number
      }
      get_opening_balance_for_date: {
        Args: { p_date: string; p_user_id: string }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
      validate_balance_consistency: {
        Args: { p_user_id?: string }
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
