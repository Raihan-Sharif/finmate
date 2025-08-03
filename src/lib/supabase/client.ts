import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase client
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Budget, 'id' | 'created_at'>>;
      };
      investments: {
        Row: Investment;
        Insert: Omit<Investment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Investment, 'id' | 'created_at'>>;
      };
      loans: {
        Row: Loan;
        Insert: Omit<Loan, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Loan, 'id' | 'created_at'>>;
      };
      lending: {
        Row: Lending;
        Insert: Omit<Lending, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Lending, 'id' | 'created_at'>>;
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Account, 'id' | 'created_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
    };
  };
}

// Type definitions
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
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  category_ids?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: 'stock' | 'mutual_fund' | 'crypto' | 'bond' | 'fd' | 'other';
  symbol?: string;
  units: number;
  purchase_price: number;
  current_price: number;
  currency: string;
  purchase_date: string;
  platform?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  lender: string;
  principal_amount: number;
  outstanding_amount: number;
  interest_rate: number;
  emi_amount: number;
  tenure_months: number;
  start_date: string;
  next_due_date: string;
  currency: string;
  type: 'personal' | 'home' | 'car' | 'education' | 'business' | 'other';
  status: 'active' | 'closed' | 'defaulted';
  created_at: string;
  updated_at: string;
}

export interface Lending {
  id: string;
  user_id: string;
  person_name: string;
  person_contact?: string;
  amount: number;
  currency: string;
  type: 'lent' | 'borrowed';
  date: string;
  due_date?: string;
  interest_rate?: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  description?: string;
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

// Helper functions for database operations
export const dbHelpers = {
  // Generic fetch with error handling
  async fetchWithError<T>(
    promise: Promise<{ data: T | null; error: any }>
  ): Promise<T> {
    const { data, error } = await promise;
    if (error) {
      console.error('Database error:', error);
      throw new Error(error.message || 'Database operation failed');
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data;
  },

  // Format date for database
  formatDate(date: Date): string {
    return date.toISOString();
  },

  // Parse date from database
  parseDate(dateString: string): Date {
    return new Date(dateString);
  },

  // Validate currency
  isValidCurrency(currency: string): boolean {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'BDT', 'JPY', 'CAD', 'AUD'];
    return validCurrencies.includes(currency);
  },

  // Format amount for database (ensure 2 decimal places)
  formatAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  },
};

// Real-time subscription helpers
export const subscriptions = {
  // Subscribe to user's transactions
  subscribeToTransactions(
    userId: string,
    callback: (payload: any) => void
  ) {
    const client = createClient();
    return client
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to user's budgets
  subscribeToBudgets(
    userId: string,
    callback: (payload: any) => void
  ) {
    const client = createClient();
    return client
      .channel('budgets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to user's notifications
  subscribeToNotifications(
    userId: string,
    callback: (payload: any) => void
  ) {
    const client = createClient();
    return client
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },
};