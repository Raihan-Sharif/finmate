import { supabase, TABLES } from '@/lib/supabase/client';
import { Account, AccountInsert, AccountUpdate } from '@/types';

export class AccountService {
  // Get all accounts for a user
  static async getAccounts(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get account by ID
  static async getAccountById(id: string, userId: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // Create new account
  static async createAccount(account: AccountInsert): Promise<Account> {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .insert(account)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Update account
  static async updateAccount(id: string, updates: AccountUpdate, userId: string): Promise<Account> {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Delete (deactivate) account
  static async deleteAccount(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.ACCOUNTS)
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Get account balance summary
  static async getAccountSummary(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .select('id, name, type, balance, currency, include_in_total')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    const summary = {
      totalBalance: 0,
      accountCount: data?.length || 0,
      accountsByType: {} as Record<string, { count: number; balance: number }>,
      accounts: data || []
    };

    data?.forEach(account => {
      if (account.include_in_total) {
        summary.totalBalance += account.balance;
      }

      if (!summary.accountsByType[account.type]) {
        summary.accountsByType[account.type] = { count: 0, balance: 0 };
      }
      summary.accountsByType[account.type].count++;
      summary.accountsByType[account.type].balance += account.balance;
    });

    return summary;
  }

  // Get account transaction history
  static async getAccountTransactions(accountId: string, userId: string, limit = 50) {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        category:categories(name, color)
      `)
      .eq('user_id', userId)
      .or(`account_id.eq.${accountId},transfer_to_account_id.eq.${accountId}`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Update account balance manually (admin override)
  static async updateAccountBalance(id: string, newBalance: number, userId: string): Promise<Account> {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .update({ balance: newBalance })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Get account types summary
  static async getAccountTypesSummary(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .select('type, balance, include_in_total')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    const typesSummary = {
      bank: { count: 0, balance: 0 },
      credit_card: { count: 0, balance: 0 },
      wallet: { count: 0, balance: 0 },
      investment: { count: 0, balance: 0 },
      savings: { count: 0, balance: 0 },
      other: { count: 0, balance: 0 }
    };

    data?.forEach(account => {
      if (typesSummary[account.type as keyof typeof typesSummary]) {
        typesSummary[account.type as keyof typeof typesSummary].count++;
        if (account.include_in_total) {
          typesSummary[account.type as keyof typeof typesSummary].balance += account.balance;
        }
      }
    });

    return typesSummary;
  }

  // Archive old accounts
  static async archiveAccount(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.ACCOUNTS)
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Restore archived account
  static async restoreAccount(id: string, userId: string): Promise<Account> {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Get all accounts including inactive ones (for admin)
  static async getAllAccounts(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export default AccountService;