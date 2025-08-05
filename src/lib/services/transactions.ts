import { supabase, TABLES } from '@/lib/supabase/client';
import { Transaction, TransactionInsert, TransactionUpdate, Category, Account } from '@/types';

export class TransactionService {
  // Get all transactions for a user
  static async getTransactions(
    userId: string,
    page = 1,
    limit = 50,
    filters?: {
      type?: 'income' | 'expense' | 'transfer';
      categoryId?: string;
      accountId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    }
  ) {
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        category:categories(*),
        account:accounts(*),
        transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(*)
      `)
      .eq('user_id', userId);

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId);
    }
    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo);
    }
    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,vendor.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      transactions: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    };
  }

  // Get transaction by ID
  static async getTransactionById(id: string, userId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        category:categories(*),
        account:accounts(*),
        transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // Create new transaction
  static async createTransaction(transaction: TransactionInsert): Promise<Transaction> {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .insert(transaction)
      .select(`
        *,
        category:categories(*),
        account:accounts(*),
        transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Update transaction
  static async updateTransaction(id: string, updates: TransactionUpdate, userId: string): Promise<Transaction> {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        category:categories(*),
        account:accounts(*),
        transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Delete transaction
  static async deleteTransaction(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Get transaction statistics
  static async getTransactionStats(userId: string, period?: {
    startDate: string;
    endDate: string;
  }) {
    let query = supabase
      .from(TABLES.TRANSACTIONS)
      .select('type, amount, date')
      .eq('user_id', userId);

    if (period) {
      query = query
        .gte('date', period.startDate)
        .lte('date', period.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      transactionCount: data?.length || 0,
      incomeCount: 0,
      expenseCount: 0,
      transferCount: 0
    };

    data?.forEach(transaction => {
      if (transaction.type === 'income') {
        stats.totalIncome += transaction.amount;
        stats.incomeCount++;
      } else if (transaction.type === 'expense') {
        stats.totalExpenses += transaction.amount;
        stats.expenseCount++;
      } else if (transaction.type === 'transfer') {
        stats.transferCount++;
      }
    });

    stats.netBalance = stats.totalIncome - stats.totalExpenses;

    return stats;
  }

  // Get monthly transaction data for charts
  static async getMonthlyData(userId: string, year: number) {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select('type, amount, date')
      .eq('user_id', userId)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`);

    if (error) throw error;

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i).toLocaleString('default', { month: 'short' }),
      income: 0,
      expenses: 0,
      net: 0
    }));

    data?.forEach(transaction => {
      const month = new Date(transaction.date).getMonth();
      if (transaction.type === 'income') {
        monthlyData[month].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthlyData[month].expenses += transaction.amount;
      }
    });

    monthlyData.forEach(month => {
      month.net = month.income - month.expenses;
    });

    return monthlyData;
  }

  // Get category-wise expenses
  static async getCategoryExpenses(userId: string, period?: {
    startDate: string;
    endDate: string;
  }) {
    let query = supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        amount,
        category:categories(id, name, color)
      `)
      .eq('user_id', userId)
      .eq('type', 'expense');

    if (period) {
      query = query
        .gte('date', period.startDate)
        .lte('date', period.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const categoryMap = new Map();
    let totalExpenses = 0;

    data?.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      const categoryColor = transaction.category?.color || '#6B7280';
      const amount = transaction.amount;

      totalExpenses += amount;

      if (categoryMap.has(categoryName)) {
        categoryMap.get(categoryName).amount += amount;
        categoryMap.get(categoryName).transactions_count++;
      } else {
        categoryMap.set(categoryName, {
          category_name: categoryName,
          amount: amount,
          color: categoryColor,
          transactions_count: 1
        });
      }
    });

    const categoryExpenses = Array.from(categoryMap.values()).map(category => ({
      ...category,
      percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0
    }));

    return categoryExpenses.sort((a, b) => b.amount - a.amount);
  }

  // Get recent transactions
  static async getRecentTransactions(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        id,
        type,
        amount,
        description,
        date,
        vendor,
        category:categories(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category_name: transaction.category?.name,
      transaction_date: transaction.date,
      vendor: transaction.vendor
    })) || [];
  }

  // Bulk import transactions
  static async bulkImportTransactions(transactions: TransactionInsert[]): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .insert(transactions)
      .select(`
        *,
        category:categories(*),
        account:accounts(*)
      `);

    if (error) throw error;
    return data || [];
  }

  // Get recurring transactions
  static async getRecurringTransactions(userId: string) {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        category:categories(*),
        account:accounts(*)
      `)
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export default TransactionService;