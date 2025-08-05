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
          description: string | null
          is_system_role: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_system_role?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_system_role?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          name: string
          description: string | null
          resource: string
          action: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          resource: string
          action: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          resource?: string
          action?: string
          created_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_id: string
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          permission_id: string
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          permission_id?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          role_id: string | null
          full_name: string | null
          avatar_url: string | null
          currency: string
          timezone: string
          theme: 'light' | 'dark' | 'system'
          notifications_enabled: boolean
          ai_insights_enabled: boolean
          monthly_budget_limit: number | null
          ai_api_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          timezone?: string
          theme?: 'light' | 'dark' | 'system'
          notifications_enabled?: boolean
          ai_insights_enabled?: boolean
          monthly_budget_limit?: number | null
          ai_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          timezone?: string
          theme?: 'light' | 'dark' | 'system'
          notifications_enabled?: boolean
          ai_insights_enabled?: boolean
          monthly_budget_limit?: number | null
          ai_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          currency: string
          description: string
          category_id: string | null
          account_id: string | null
          date: string
          tags: string[] | null
          receipt_url: string | null
          location: string | null
          notes: string | null
          is_recurring: boolean
          recurring_pattern: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          currency?: string
          description: string
          category_id?: string | null
          account_id?: string | null
          date: string
          tags?: string[] | null
          receipt_url?: string | null
          location?: string | null
          notes?: string | null
          is_recurring?: boolean
          recurring_pattern?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          currency?: string
          description?: string
          category_id?: string | null
          account_id?: string | null
          date?: string
          tags?: string[] | null
          receipt_url?: string | null
          location?: string | null
          notes?: string | null
          is_recurring?: boolean
          recurring_pattern?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          type: 'income' | 'expense'
          parent_id: string | null
          is_default: boolean
          budget_limit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          color?: string
          type: 'income' | 'expense'
          parent_id?: string | null
          is_default?: boolean
          budget_limit?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          color?: string
          type?: 'income' | 'expense'
          parent_id?: string | null
          is_default?: boolean
          budget_limit?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          spent: number
          currency: string
          period: 'monthly' | 'weekly' | 'yearly'
          category_ids: string[] | null
          start_date: string
          end_date: string
          is_active: boolean
          alert_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          spent?: number
          currency?: string
          period?: 'monthly' | 'weekly' | 'yearly'
          category_ids?: string[] | null
          start_date: string
          end_date: string
          is_active?: boolean
          alert_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          spent?: number
          currency?: string
          period?: 'monthly' | 'weekly' | 'yearly'
          category_ids?: string[] | null
          start_date?: string
          end_date?: string
          is_active?: boolean
          alert_threshold?: number
          created_at?: string
          updated_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'stock' | 'mutual_fund' | 'crypto' | 'bond' | 'fd' | 'other'
          symbol: string | null
          units: number
          purchase_price: number
          current_price: number
          currency: string
          purchase_date: string
          platform: string | null
          notes: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: 'stock' | 'mutual_fund' | 'crypto' | 'bond' | 'fd' | 'other'
          symbol?: string | null
          units: number
          purchase_price: number
          current_price: number
          currency?: string
          purchase_date: string
          platform?: string | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'stock' | 'mutual_fund' | 'crypto' | 'bond' | 'fd' | 'other'
          symbol?: string | null
          units?: number
          purchase_price?: number
          current_price?: number
          currency?: string
          purchase_date?: string
          platform?: string | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          user_id: string
          lender: string
          principal_amount: number
          outstanding_amount: number
          interest_rate: number
          emi_amount: number
          tenure_months: number
          start_date: string
          next_due_date: string
          currency: string
          type: 'personal' | 'home' | 'car' | 'education' | 'business' | 'other'
          status: 'active' | 'closed' | 'defaulted'
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lender: string
          principal_amount: number
          outstanding_amount: number
          interest_rate: number
          emi_amount: number
          tenure_months: number
          start_date: string
          next_due_date: string
          currency?: string
          type?: 'personal' | 'home' | 'car' | 'education' | 'business' | 'other'
          status?: 'active' | 'closed' | 'defaulted'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lender?: string
          principal_amount?: number
          outstanding_amount?: number
          interest_rate?: number
          emi_amount?: number
          tenure_months?: number
          start_date?: string
          next_due_date?: string
          currency?: string
          type?: 'personal' | 'home' | 'car' | 'education' | 'business' | 'other'
          status?: 'active' | 'closed' | 'defaulted'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'bank' | 'credit_card' | 'wallet' | 'investment' | 'other'
          bank_name: string | null
          account_number: string | null
          balance: number
          currency: string
          is_active: boolean
          color: string
          icon: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: 'bank' | 'credit_card' | 'wallet' | 'investment' | 'other'
          bank_name?: string | null
          account_number?: string | null
          balance?: number
          currency?: string
          is_active?: boolean
          color?: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'bank' | 'credit_card' | 'wallet' | 'investment' | 'other'
          bank_name?: string | null
          account_number?: string | null
          balance?: number
          currency?: string
          is_active?: boolean
          color?: string
          icon?: string
          created_at?: string
          updated_at?: string
        }
      }
      lending: {
        Row: {
          id: string
          user_id: string
          person_name: string
          person_contact: string | null
          amount: number
          currency: string
          type: 'lent' | 'borrowed'
          date: string
          due_date: string | null
          interest_rate: number | null
          status: 'pending' | 'partial' | 'paid' | 'overdue'
          description: string | null
          paid_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          person_name: string
          person_contact?: string | null
          amount: number
          currency?: string
          type: 'lent' | 'borrowed'
          date: string
          due_date?: string | null
          interest_rate?: number | null
          status?: 'pending' | 'partial' | 'paid' | 'overdue'
          description?: string | null
          paid_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          person_name?: string
          person_contact?: string | null
          amount?: number
          currency?: string
          type?: 'lent' | 'borrowed'
          date?: string
          due_date?: string | null
          interest_rate?: number | null
          status?: 'pending' | 'partial' | 'paid' | 'overdue'
          description?: string | null
          paid_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'warning' | 'error' | 'success'
          is_read: boolean
          action_url: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'warning' | 'error' | 'success'
          is_read?: boolean
          action_url?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'warning' | 'error' | 'success'
          is_read?: boolean
          action_url?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      emi_payments: {
        Row: {
          id: string
          user_id: string
          loan_id: string
          payment_date: string
          amount: number
          principal_amount: number
          interest_amount: number
          outstanding_balance: number
          is_paid: boolean
          paid_date: string | null
          payment_method: string | null
          transaction_reference: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          loan_id: string
          payment_date: string
          amount: number
          principal_amount: number
          interest_amount: number
          outstanding_balance: number
          is_paid?: boolean
          paid_date?: string | null
          payment_method?: string | null
          transaction_reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          loan_id?: string
          payment_date?: string
          amount?: number
          principal_amount?: number
          interest_amount?: number
          outstanding_balance?: number
          is_paid?: boolean
          paid_date?: string | null
          payment_method?: string | null
          transaction_reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_template: Json
          frequency: string
          interval_value: number
          start_date: string
          end_date: string | null
          last_executed: string | null
          next_execution: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_template: Json
          frequency: string
          interval_value?: number
          start_date: string
          end_date?: string | null
          last_executed?: string | null
          next_execution: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_template?: Json
          frequency?: string
          interval_value?: number
          start_date?: string
          end_date?: string | null
          last_executed?: string | null
          next_execution?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string
          confidence_score: number | null
          is_dismissed: boolean
          metadata: Json | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content: string
          confidence_score?: number | null
          is_dismissed?: boolean
          metadata?: Json | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string
          confidence_score?: number | null
          is_dismissed?: boolean
          metadata?: Json | null
          expires_at?: string | null
          created_at?: string
        }
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_user_id: string
          action: string
          resource_type: string
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          action: string
          resource_type: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_permission: {
        Args: {
          user_uuid: string
          permission_name: string
        }
        Returns: boolean
      }
      get_user_role: {
        Args: {
          user_uuid: string
        }
        Returns: string
      }
    }
    Enums: {
      transaction_type: 'income' | 'expense'
      account_type: 'bank' | 'credit_card' | 'wallet' | 'investment' | 'other'
      investment_type: 'stock' | 'mutual_fund' | 'crypto' | 'bond' | 'fd' | 'other'
      loan_type: 'personal' | 'home' | 'car' | 'education' | 'business' | 'other'
      loan_status: 'active' | 'closed' | 'defaulted'
      lending_type: 'lent' | 'borrowed'
      lending_status: 'pending' | 'partial' | 'paid' | 'overdue'
      budget_period: 'weekly' | 'monthly' | 'yearly'
      notification_type: 'info' | 'warning' | 'error' | 'success'
      theme_type: 'light' | 'dark' | 'system'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}