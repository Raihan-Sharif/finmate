// =============================================
// ENHANCED TRANSACTION SERVICE
// =============================================
// This service extends the regular transaction service to handle
// investment-integrated transactions and provides a unified interface

import { supabase, TABLES } from '@/lib/supabase/client';
import { 
  Transaction, 
  TransactionInsert, 
  TransactionUpdate
} from '@/types';
import { 
  EnhancedTransaction,
  EnhancedTransactionType,
  UnifiedTransaction,
  UnifiedTransactionFilters,
  InvestmentAction,
  ENHANCED_TRANSACTION_TYPES
} from '@/types/investments';
import { TransactionService } from './transactions';
import UnifiedInvestmentTransactionService from './unified-investment-transactions';

export class EnhancedTransactionService extends TransactionService {

  // =============================================
  // ENHANCED TRANSACTION OPERATIONS
  // =============================================

  /**
   * Get all transactions with investment integration support
   */
  static async getEnhancedTransactions(
    userId: string,
    page = 1,
    limit = 50,
    filters?: {
      type?: EnhancedTransactionType | EnhancedTransactionType[];
      categoryId?: string;
      accountId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      is_investment_related?: boolean;
      investment_action?: InvestmentAction | InvestmentAction[];
      investment_id?: string;
    }
  ) {
    const offset = (page - 1) * limit;
    
    // Use unified transactions view for comprehensive data
    let query = supabase
      .from('unified_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        query = query.in('type', filters.type);
      } else {
        query = query.eq('type', filters.type);
      }
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

    if (filters?.is_investment_related !== undefined) {
      query = query.eq('is_investment_related', filters.is_investment_related);
    }

    if (filters?.investment_action) {
      if (Array.isArray(filters.investment_action)) {
        query = query.in('investment_action', filters.investment_action);
      } else {
        query = query.eq('investment_action', filters.investment_action);
      }
    }

    if (filters?.investment_id) {
      query = query.eq('investment_id', filters.investment_id);
    }

    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,vendor.ilike.%${filters.search}%,investment_name.ilike.%${filters.search}%`);
    }

    const { data, count, error } = await query
      .range(offset, offset + limit - 1)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  /**
   * Create a regular transaction (non-investment)
   */
  static async createRegularTransaction(
    transaction: TransactionInsert & {
      is_investment_related?: false;
    },
    userId: string
  ): Promise<EnhancedTransaction> {
    const transactionData = {
      ...transaction,
      user_id: userId,
      is_investment_related: false,
      investment_id: null,
      investment_transaction_id: null,
      investment_action: null
    };

    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .insert(transactionData)
      .select(`
        *,
        category:categories(*),
        account:accounts!transactions_account_id_fkey(*),
        transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(*)
      `)
      .single();

    if (error) throw error;
    return data as EnhancedTransaction;
  }

  /**
   * Update a transaction
   */
  static async updateEnhancedTransaction(
    id: string,
    updates: Partial<TransactionUpdate>,
    userId: string
  ): Promise<EnhancedTransaction> {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        category:categories(*),
        account:accounts!transactions_account_id_fkey(*),
        transfer_to_account:accounts!transactions_transfer_to_account_id_fkey(*)
      `)
      .single();

    if (error) throw error;
    return data as EnhancedTransaction;
  }

  /**
   * Get transaction by ID with investment data
   */
  static async getEnhancedTransactionById(
    id: string,
    userId: string
  ): Promise<UnifiedTransaction | null> {
    const { data, error } = await supabase
      .from('unified_transactions')
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

  /**
   * Delete a transaction (handles both regular and investment transactions)
   */
  static async deleteEnhancedTransaction(
    id: string,
    userId: string
  ): Promise<void> {
    // First check if this is an investment-related transaction
    const transaction = await this.getEnhancedTransactionById(id, userId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.is_investment_related && transaction.investment_transaction_id) {
      // Delete the investment transaction (which will cascade to main transaction)
      await UnifiedInvestmentTransactionService.deleteInvestmentTransaction(
        transaction.investment_transaction_id,
        userId
      );
    } else {
      // Delete regular transaction
      const { error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    }
  }

  // =============================================
  // INVESTMENT-SPECIFIC TRANSACTION QUERIES
  // =============================================

  /**
   * Get only investment-related transactions
   */
  static async getInvestmentTransactions(
    userId: string,
    page = 1,
    limit = 50,
    filters?: {
      investment_id?: string;
      investment_action?: InvestmentAction | InvestmentAction[];
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    }
  ) {
    return this.getEnhancedTransactions(userId, page, limit, {
      ...filters,
      is_investment_related: true
    });
  }

  /**
   * Get only cash flow transactions (non-investment)
   */
  static async getCashFlowTransactions(
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
    return this.getEnhancedTransactions(userId, page, limit, {
      ...filters,
      is_investment_related: false
    });
  }

  /**
   * Get transactions for a specific investment
   */
  static async getTransactionsForInvestment(
    investmentId: string,
    userId: string,
    page = 1,
    limit = 50
  ) {
    return this.getEnhancedTransactions(userId, page, limit, {
      investment_id: investmentId,
      is_investment_related: true
    });
  }

  // =============================================
  // ANALYTICS AND AGGREGATIONS
  // =============================================

  /**
   * Get transaction summary with investment breakdown
   */
  static async getTransactionSummary(
    userId: string,
    dateFrom?: string,
    dateTo?: string
  ) {
    let query = supabase
      .from('unified_transactions')
      .select('type, amount, is_investment_related, investment_action')
      .eq('user_id', userId);

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    const transactions = data || [];

    // Calculate regular transaction totals
    const regularTransactions = transactions.filter(t => !t.is_investment_related);
    const regular_income = regularTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const regular_expenses = regularTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate investment transaction totals
    const investmentTransactions = transactions.filter(t => t.is_investment_related);
    const investment_purchases = investmentTransactions
      .filter(t => t.investment_action === 'buy')
      .reduce((sum, t) => sum + t.amount, 0);
    const investment_sales = investmentTransactions
      .filter(t => t.investment_action === 'sell')
      .reduce((sum, t) => sum + t.amount, 0);
    const investment_dividends = investmentTransactions
      .filter(t => t.investment_action === 'dividend')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate overall totals
    const total_income = regular_income + investment_sales + investment_dividends;
    const total_expenses = regular_expenses + investment_purchases;
    const net_cash_flow = total_income - total_expenses;

    return {
      regular_transactions: {
        income: regular_income,
        expenses: regular_expenses,
        net: regular_income - regular_expenses,
        count: regularTransactions.length
      },
      investment_transactions: {
        purchases: investment_purchases,
        sales: investment_sales,
        dividends: investment_dividends,
        net_invested: investment_purchases - investment_sales,
        count: investmentTransactions.length
      },
      overall: {
        total_income,
        total_expenses,
        net_cash_flow,
        total_transactions: transactions.length
      }
    };
  }

  /**
   * Get monthly transaction breakdown with investment analysis
   */
  static async getMonthlyTransactionBreakdown(
    userId: string,
    year?: number
  ) {
    let query = supabase
      .from('unified_transactions')
      .select('date, type, amount, is_investment_related, investment_action')
      .eq('user_id', userId);

    if (year) {
      query = query
        .gte('date', `${year}-01-01`)
        .lt('date', `${year + 1}-01-01`);
    }

    const { data, error } = await query.order('date');
    if (error) throw error;

    const transactions = data || [];

    // Group by month
    const monthlyData: Record<string, {
      month: string;
      regular_income: number;
      regular_expenses: number;
      investment_purchases: number;
      investment_sales: number;
      investment_dividends: number;
      total_income: number;
      total_expenses: number;
      net_cash_flow: number;
      transaction_count: number;
    }> = {};

    transactions.forEach(transaction => {
      const month = transaction.date.substring(0, 7); // YYYY-MM

      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          regular_income: 0,
          regular_expenses: 0,
          investment_purchases: 0,
          investment_sales: 0,
          investment_dividends: 0,
          total_income: 0,
          total_expenses: 0,
          net_cash_flow: 0,
          transaction_count: 0
        };
      }

      monthlyData[month].transaction_count += 1;

      if (transaction.is_investment_related) {
        switch (transaction.investment_action) {
          case 'buy':
            monthlyData[month].investment_purchases += transaction.amount;
            monthlyData[month].total_expenses += transaction.amount;
            break;
          case 'sell':
            monthlyData[month].investment_sales += transaction.amount;
            monthlyData[month].total_income += transaction.amount;
            break;
          case 'dividend':
            monthlyData[month].investment_dividends += transaction.amount;
            monthlyData[month].total_income += transaction.amount;
            break;
        }
      } else {
        switch (transaction.type) {
          case 'income':
            monthlyData[month].regular_income += transaction.amount;
            monthlyData[month].total_income += transaction.amount;
            break;
          case 'expense':
            monthlyData[month].regular_expenses += transaction.amount;
            monthlyData[month].total_expenses += transaction.amount;
            break;
        }
      }

      monthlyData[month].net_cash_flow = 
        monthlyData[month].total_income - monthlyData[month].total_expenses;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Get top categories with investment classification
   */
  static async getTopCategoriesWithInvestments(
    userId: string,
    limit = 10,
    dateFrom?: string,
    dateTo?: string
  ) {
    let query = supabase
      .from('unified_transactions')
      .select('category_id, category_name, category_icon, amount, is_investment_related, investment_action')
      .eq('user_id', userId)
      .not('category_id', 'is', null);

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    const transactions = data || [];

    // Group by category
    const categoryData: Record<string, {
      category_id: string;
      category_name: string;
      category_icon?: string;
      total_amount: number;
      regular_amount: number;
      investment_amount: number;
      transaction_count: number;
      is_primarily_investment: boolean;
    }> = {};

    transactions.forEach(transaction => {
      const categoryId = transaction.category_id!;

      if (!categoryData[categoryId]) {
        categoryData[categoryId] = {
          category_id: categoryId,
          category_name: transaction.category_name || 'Unknown',
          category_icon: transaction.category_icon,
          total_amount: 0,
          regular_amount: 0,
          investment_amount: 0,
          transaction_count: 0,
          is_primarily_investment: false
        };
      }

      categoryData[categoryId].total_amount += transaction.amount;
      categoryData[categoryId].transaction_count += 1;

      if (transaction.is_investment_related) {
        categoryData[categoryId].investment_amount += transaction.amount;
      } else {
        categoryData[categoryId].regular_amount += transaction.amount;
      }
    });

    // Calculate investment percentage and sort
    const categories = Object.values(categoryData)
      .map(category => ({
        ...category,
        is_primarily_investment: category.investment_amount > category.regular_amount
      }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, limit);

    return categories;
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  /**
   * Get recent transactions with investment context
   */
  static async getRecentTransactionsWithContext(
    userId: string,
    limit = 10
  ): Promise<UnifiedTransaction[]> {
    const { data, error } = await supabase
      .from('unified_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Search transactions across all types with investment data
   */
  static async searchTransactions(
    userId: string,
    searchTerm: string,
    limit = 20
  ): Promise<UnifiedTransaction[]> {
    const { data, error } = await supabase
      .from('unified_transactions')
      .select('*')
      .eq('user_id', userId)
      .or(`description.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%,vendor.ilike.%${searchTerm}%,investment_name.ilike.%${searchTerm}%,investment_symbol.ilike.%${searchTerm}%`)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get transaction type distribution
   */
  static async getTransactionTypeDistribution(
    userId: string,
    dateFrom?: string,
    dateTo?: string
  ) {
    let query = supabase
      .from('unified_transactions')
      .select('type, is_investment_related, investment_action, amount')
      .eq('user_id', userId);

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    const transactions = data || [];

    const distribution = {
      income: {
        regular: { count: 0, amount: 0 },
        investment_sales: { count: 0, amount: 0 },
        investment_dividends: { count: 0, amount: 0 }
      },
      expense: {
        regular: { count: 0, amount: 0 },
        investment_purchases: { count: 0, amount: 0 }
      },
      transfer: { count: 0, amount: 0 }
    };

    transactions.forEach(transaction => {
      if (transaction.is_investment_related) {
        switch (transaction.investment_action) {
          case 'buy':
            distribution.expense.investment_purchases.count += 1;
            distribution.expense.investment_purchases.amount += transaction.amount;
            break;
          case 'sell':
            distribution.income.investment_sales.count += 1;
            distribution.income.investment_sales.amount += transaction.amount;
            break;
          case 'dividend':
            distribution.income.investment_dividends.count += 1;
            distribution.income.investment_dividends.amount += transaction.amount;
            break;
        }
      } else {
        switch (transaction.type) {
          case 'income':
            distribution.income.regular.count += 1;
            distribution.income.regular.amount += transaction.amount;
            break;
          case 'expense':
            distribution.expense.regular.count += 1;
            distribution.expense.regular.amount += transaction.amount;
            break;
          case 'transfer':
            distribution.transfer.count += 1;
            distribution.transfer.amount += transaction.amount;
            break;
        }
      }
    });

    return distribution;
  }
}

export default EnhancedTransactionService;