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
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          currency: string
          timezone: string
          theme: 'light' | 'dark' | 'system'
          notifications_enabled: boolean
          ai_insights_enabled: boolean
          monthly_budget_limit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          timezone?: string
          theme?: 'light' | 'dark' | 'system'
          notifications_enabled?: boolean
          ai_insights_enabled?: boolean
          monthly_budget_limit?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          timezone?: string
          theme?: 'light' | 'dark' | 'system'
          notifications_enabled?: boolean
          ai_insights_enabled?: boolean
          monthly_budget_limit?: number | null
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
          category_id: string
          account_id: string | null
          date: string
          tags: string[] | null
          receipt_url: string | null
          location: string | null
          notes: string | null
          is_recurring: boolean
          recurring_pattern: string | null
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
          category_id: string
          account_id?: string | null
          date: string
          tags?: string[] | null
          receipt_url?: string | null
          location?: string | null
          notes?: string | null
          is_recurring?: boolean
          recurring_pattern?: string | null
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
          category_id?: string
          account_id?: string | null
          date?: string
          tags?: string[] | null
          receipt_url?: string | null
          location?: string | null
          notes?: string | null
          is_recurring?: boolean
          recurring_pattern?: string | null
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
          category_ids: string[]
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
          category_ids: string[]
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
          category_ids?: string[]
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
          symbol: string
          type: 'stock' | 'crypto' | 'mutual_fund' | 'bond' | 'other'
          quantity: number
          average_price: number
          current_price: number
          currency: string
          platform: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          symbol: string
          type: 'stock' | 'crypto' | 'mutual_fund' | 'bond' | 'other'
          quantity: number
          average_price: number
          current_price: number
          currency?: string
          platform: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          symbol?: string
          type?: 'stock' | 'crypto' | 'mutual_fund' | 'bond' | 'other'
          quantity?: number
          average_price?: number
          current_price?: number
          currency?: string
          platform?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'personal' | 'home' | 'car' | 'education' | 'business' | 'other'
          principal_amount: number
          outstanding_amount: number
          interest_rate: number
          emi_amount: number
          tenure_months: number
          start_date: string
          end_date: string
          lender: string
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'personal' | 'home' | 'car' | 'education' | 'business' | 'other'
          principal_amount: number
          outstanding_amount: number
          interest_rate: number
          emi_amount: number
          tenure_months: number
          start_date: string
          end_date: string
          lender: string
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'personal' | 'home' | 'car' | 'education' | 'business' | 'other'
          principal_amount?: number
          outstanding_amount?: number
          interest_rate?: number
          emi_amount?: number
          tenure_months?: number
          start_date?: string
          end_date?: string
          lender?: string
          currency?: string
          is_active?: boolean
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
          type: 'bank' | 'credit_card' | 'wallet' | 'investment' | 'other'
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
          type: 'lent' | 'borrowed'
          amount: number
          currency: string
          person_name: string
          person_contact: string | null
          description: string
          date: string
          due_date: string | null
          interest_rate: number | null
          is_returned: boolean
          returned_amount: number | null
          returned_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'lent' | 'borrowed'
          amount: number
          currency?: string
          person_name: string
          person_contact?: string | null
          description: string
          date: string
          due_date?: string | null
          interest_rate?: number | null
          is_returned?: boolean
          returned_amount?: number | null
          returned_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'lent' | 'borrowed'
          amount?: number
          currency?: string
          person_name?: string
          person_contact?: string | null
          description?: string
          date?: string
          due_date?: string | null
          interest_rate?: number | null
          is_returned?: boolean
          returned_amount?: number | null
          returned_date?: string | null
          notes?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}