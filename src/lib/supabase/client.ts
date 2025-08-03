// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

// Create client instance
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Also export as createClient for compatibility
export const createClient = () => supabase;

// Auth instance
export const auth = supabase.auth;

// Table constants
export const TABLES = {
  PROFILES: 'profiles',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  BUDGETS: 'budgets',
  INVESTMENTS: 'investments',
  LOANS: 'loans',
  LENDING: 'lending',
  ACCOUNTS: 'accounts',
  NOTIFICATIONS: 'notifications',
} as const;

// Database helper functions
export const db = {
  async findMany<T>(
    table: string,
    options?: {
      filter?: Record<string, any>;
      orderBy?: { column: string; ascending: boolean };
      limit?: number;
    }
  ): Promise<T[]> {
    let query = supabase.from(table).select('*');
    
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending 
      });
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async findOne<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create<T>(table: string, data: any): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async update<T>(table: string, id: string, data: any): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async delete(table: string, id: string): Promise<void> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Real-time subscriptions
export const realtime = {
  subscribe(table: string, userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`${table}_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }
};

// Database types
export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  currency: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  ai_insights_enabled: boolean;
  monthly_budget_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  category_id: string;
  account_id?: string;
  date: string;
  tags?: string[];
  receipt_url?: string;
  location?: string;
  notes?: string;
  is_recurring: boolean;
  recurring_pattern?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  parent_id?: string;
  is_default: boolean;
  budget_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  spent: number;
  currency: string;
  period: 'monthly' | 'weekly' | 'yearly';
  category_ids: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'crypto' | 'mutual_fund' | 'bond' | 'other';
  quantity: number;
  average_price: number;
  current_price: number;
  currency: string;
  platform: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  type: 'personal' | 'home' | 'car' | 'education' | 'business' | 'other';
  principal_amount: number;
  outstanding_amount: number;
  interest_rate: number;
  emi_amount: number;
  tenure_months: number;
  start_date: string;
  end_date: string;
  lender: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lending {
  id: string;
  user_id: string;
  type: 'lent' | 'borrowed';
  amount: number;
  currency: string;
  person_name: string;
  person_contact?: string;
  description: string;
  date: string;
  due_date?: string;
  interest_rate?: number;
  is_returned: boolean;
  returned_amount?: number;
  returned_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'wallet' | 'investment' | 'other';
  bank_name?: string;
  account_number?: string;
  balance: number;
  currency: string;
  is_active: boolean;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  action_url?: string;
  metadata?: any;
  created_at: string;
}