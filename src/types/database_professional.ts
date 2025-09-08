export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          is_system: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          is_system?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          is_system?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          resource: string
          action: 'create' | 'read' | 'update' | 'delete' | 'manage'
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          resource: string
          action: 'create' | 'read' | 'update' | 'delete' | 'manage'
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          resource?: string
          action?: 'create' | 'read' | 'update' | 'delete' | 'manage'
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_id: string
          granted_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          permission_id: string
          granted_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          permission_id?: string
          granted_by?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role_id: string | null
          currency: string
          timezone: string
          date_format: string
          time_format: string
          language: string
          theme: string
          email_verified: boolean
          phone_number: string | null
          phone_verified: boolean
          two_factor_enabled: boolean
          last_login: string | null
          login_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role_id?: string | null
          currency?: string
          timezone?: string
          date_format?: string
          time_format?: string
          language?: string
          theme?: string
          email_verified?: boolean
          phone_number?: string | null
          phone_verified?: boolean
          two_factor_enabled?: boolean
          last_login?: string | null
          login_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role_id?: string | null
          currency?: string
          timezone?: string
          date_format?: string
          time_format?: string
          language?: string
          theme?: string
          email_verified?: boolean
          phone_number?: string | null
          phone_verified?: boolean
          two_factor_enabled?: boolean
          last_login?: string | null
          login_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          permission_id: string
          granted: boolean
          granted_by: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          permission_id: string
          granted?: boolean
          granted_by?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          permission_id?: string
          granted?: boolean
          granted_by?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          icon: string
          color: string
          type: 'income' | 'expense' | 'transfer'
          is_default: boolean
          is_active: boolean
          parent_id: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          icon?: string
          color?: string
          type: 'income' | 'expense' | 'transfer'
          is_default?: boolean
          is_active?: boolean
          parent_id?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          icon?: string
          color?: string
          type?: 'income' | 'expense' | 'transfer'
          is_default?: boolean
          is_active?: boolean
          parent_id?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          type: 'cash' | 'bank' | 'credit_card' | 'wallet' | 'investment' | 'savings' | 'other'
          balance: number
          currency: string
          account_number: string | null
          bank_name: string | null
          is_active: boolean
          include_in_total: boolean
          is_default: boolean
          display_order: number
          icon: string
          color: string
          balance_type: 'debit' | 'credit'
          credit_limit: number
          interest_rate: number
          minimum_payment: number
          payment_due_day: number
          statement_closing_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          type?: 'cash' | 'bank' | 'credit_card' | 'wallet' | 'investment' | 'savings' | 'other'
          balance?: number
          currency?: string
          account_number?: string | null
          bank_name?: string | null
          is_active?: boolean
          include_in_total?: boolean
          is_default?: boolean
          display_order?: number
          icon?: string
          color?: string
          balance_type?: 'debit' | 'credit'
          credit_limit?: number
          interest_rate?: number
          minimum_payment?: number
          payment_due_day?: number
          statement_closing_day?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          type?: 'cash' | 'bank' | 'credit_card' | 'wallet' | 'investment' | 'savings' | 'other'
          balance?: number
          currency?: string
          account_number?: string | null
          bank_name?: string | null
          is_active?: boolean
          include_in_total?: boolean
          is_default?: boolean
          display_order?: number
          icon?: string
          color?: string
          balance_type?: 'debit' | 'credit'
          credit_limit?: number
          interest_rate?: number
          minimum_payment?: number
          payment_due_day?: number
          statement_closing_day?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string
          notes: string | null
          category_id: string | null
          account_id: string | null
          transfer_to_account_id: string | null
          date: string
          tags: string[] | null
          receipt_url: string | null
          location: string | null
          vendor: string | null
          is_recurring: boolean
          recurring_interval: string | null
          recurring_end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string
          notes?: string | null
          category_id?: string | null
          account_id?: string | null
          transfer_to_account_id?: string | null
          date: string
          tags?: string[] | null
          receipt_url?: string | null
          location?: string | null
          vendor?: string | null
          is_recurring?: boolean
          recurring_interval?: string | null
          recurring_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense' | 'transfer'
          amount?: number
          description?: string
          notes?: string | null
          category_id?: string | null
          account_id?: string | null
          transfer_to_account_id?: string | null
          date?: string
          tags?: string[] | null
          receipt_url?: string | null
          location?: string | null
          vendor?: string | null
          is_recurring?: boolean
          recurring_interval?: string | null
          recurring_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          amount: number
          spent: number
          period: string
          start_date: string
          end_date: string
          category_ids: string[] | null
          alert_percentage: number
          alert_enabled: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          amount: number
          spent?: number
          period?: string
          start_date: string
          end_date: string
          category_ids?: string[] | null
          alert_percentage?: number
          alert_enabled?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          amount?: number
          spent?: number
          period?: string
          start_date?: string
          end_date?: string
          category_ids?: string[] | null
          alert_percentage?: number
          alert_enabled?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          ip_address: string | null
          user_agent: string | null
          device_info: Json | null
          location: Json | null
          is_active: boolean
          expires_at: string
          created_at: string
          last_accessed: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          ip_address?: string | null
          user_agent?: string | null
          device_info?: Json | null
          location?: Json | null
          is_active?: boolean
          expires_at: string
          created_at?: string
          last_accessed?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          ip_address?: string | null
          user_agent?: string | null
          device_info?: Json | null
          location?: Json | null
          is_active?: boolean
          expires_at?: string
          created_at?: string
          last_accessed?: string
        }
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_user_id: string
          action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'role_change' | 'permission_change'
          resource_type: string
          resource_id: string | null
          target_user_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          success: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'role_change' | 'permission_change'
          resource_type: string
          resource_id?: string | null
          target_user_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          action?: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'role_change' | 'permission_change'
          resource_type?: string
          resource_id?: string | null
          target_user_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_permissions: {
        Args: {
          p_user_id: string
        }
        Returns: {
          permission_name: string
          resource: string
          action: string
        }[]
      }
      has_permission: {
        Args: {
          p_user_id: string
          p_resource: string
          p_action: string
        }
        Returns: boolean
      }
      create_default_categories: {
        Args: {
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: 'super_admin' | 'admin' | 'paid_user' | 'user'
      transaction_type: 'income' | 'expense' | 'transfer'
      account_type: 'cash' | 'bank' | 'credit_card' | 'wallet' | 'investment' | 'savings' | 'other'
      permission_action: 'create' | 'read' | 'update' | 'delete' | 'manage'
      audit_action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'role_change' | 'permission_change'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}