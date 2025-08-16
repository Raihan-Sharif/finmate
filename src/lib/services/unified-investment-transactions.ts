// =============================================
// UNIFIED INVESTMENT-TRANSACTION SERVICE
// =============================================
// This service handles the unified investment-transaction system where
// investment operations automatically create corresponding cash flow transactions

import { supabase } from '@/lib/supabase/client';
import { 
  EnhancedTransaction,
  InvestmentTransaction,
  UnifiedTransaction,
  InvestmentPurchaseRequest,
  InvestmentSaleRequest,
  InvestmentDividendRequest,
  InvestmentFlowOperation,
  CreateInvestmentTransactionResponse,
  GetUnifiedTransactionsResponse,
  UnifiedTransactionFilters,
  InvestmentServiceResponse,
  InvestmentSummaryWithTransactions,
  EnhancedPortfolioPerformance,
  INVESTMENT_ACTIONS,
  ENHANCED_TRANSACTION_TYPES,
  InvestmentAction,
  EnhancedTransactionType
} from '@/types/investments';

export class UnifiedInvestmentTransactionService {

  // =============================================
  // CORE INVESTMENT TRANSACTION OPERATIONS
  // =============================================

  /**
   * Purchase Investment - Creates investment transaction and corresponding expense transaction
   */
  static async purchaseInvestment(
    request: InvestmentPurchaseRequest,
    userId: string
  ): Promise<CreateInvestmentTransactionResponse> {
    try {
      // Calculate totals
      const total_amount = request.units * request.price_per_unit;
      const total_charges = (request.brokerage_fee || 0) + 
                           (request.tax_amount || 0) + 
                           (request.other_charges || 0);
      const net_amount = total_amount + total_charges; // Total cost including fees

      // Create investment transaction (this will trigger main transaction creation automatically)
      const { data: investmentTransaction, error } = await supabase
        .from('investment_transactions')
        .insert({
          user_id: userId,
          investment_id: request.investment_id,
          type: 'buy',
          units: request.units,
          price_per_unit: request.price_per_unit,
          total_amount,
          brokerage_fee: request.brokerage_fee || 0,
          tax_amount: request.tax_amount || 0,
          other_charges: request.other_charges || 0,
          net_amount,
          transaction_date: request.transaction_date,
          settlement_date: request.settlement_date,
          notes: request.notes,
          exchange: request.exchange,
          currency: 'BDT'
        })
        .select(`
          *,
          investment:investments(id, name, symbol, type),
          main_transaction:transactions(*)
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          investment_transaction: investmentTransaction,
          main_transaction: investmentTransaction.main_transaction as EnhancedTransaction
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_FAILED',
          message: error.message || 'Failed to create investment purchase',
          details: error
        }
      };
    }
  }

  /**
   * Sell Investment - Creates investment transaction and corresponding income transaction
   */
  static async sellInvestment(
    request: InvestmentSaleRequest,
    userId: string
  ): Promise<CreateInvestmentTransactionResponse> {
    try {
      // First check if user has enough units
      const { data: investment } = await supabase
        .from('investments')
        .select('total_units')
        .eq('id', request.investment_id)
        .eq('user_id', userId)
        .single();

      if (!investment || investment.total_units < request.units) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_UNITS',
            message: `Insufficient units. Available: ${investment?.total_units || 0}, Requested: ${request.units}`,
            details: { available: investment?.total_units, requested: request.units }
          }
        };
      }

      // Calculate totals
      const total_amount = request.units * request.price_per_unit;
      const total_charges = (request.brokerage_fee || 0) + 
                           (request.tax_amount || 0) + 
                           (request.other_charges || 0);
      const net_amount = total_amount - total_charges; // Net proceeds after fees

      // Create investment transaction
      const { data: investmentTransaction, error } = await supabase
        .from('investment_transactions')
        .insert({
          user_id: userId,
          investment_id: request.investment_id,
          type: 'sell',
          units: request.units,
          price_per_unit: request.price_per_unit,
          total_amount,
          brokerage_fee: request.brokerage_fee || 0,
          tax_amount: request.tax_amount || 0,
          other_charges: request.other_charges || 0,
          net_amount,
          transaction_date: request.transaction_date,
          settlement_date: request.settlement_date,
          notes: request.notes,
          exchange: request.exchange,
          currency: 'BDT'
        })
        .select(`
          *,
          investment:investments(id, name, symbol, type),
          main_transaction:transactions(*)
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          investment_transaction: investmentTransaction,
          main_transaction: investmentTransaction.main_transaction as EnhancedTransaction
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_FAILED',
          message: error.message || 'Failed to create investment sale',
          details: error
        }
      };
    }
  }

  /**
   * Record Dividend - Creates dividend transaction and corresponding income transaction
   */
  static async recordDividend(
    request: InvestmentDividendRequest,
    userId: string
  ): Promise<CreateInvestmentTransactionResponse> {
    try {
      // Get current units if not provided
      let total_units = request.total_units;
      if (!total_units) {
        const { data: investment } = await supabase
          .from('investments')
          .select('total_units')
          .eq('id', request.investment_id)
          .eq('user_id', userId)
          .single();

        total_units = investment?.total_units || 0;
      }

      const total_amount = (total_units || 0) * request.dividend_per_unit;
      const net_amount = total_amount - (request.tax_amount || 0);

      // Create investment transaction
      const { data: investmentTransaction, error } = await supabase
        .from('investment_transactions')
        .insert({
          user_id: userId,
          investment_id: request.investment_id,
          type: 'dividend',
          units: total_units,
          price_per_unit: request.dividend_per_unit,
          total_amount,
          tax_amount: request.tax_amount || 0,
          other_charges: 0,
          brokerage_fee: 0,
          net_amount,
          transaction_date: request.transaction_date,
          notes: request.notes,
          currency: 'BDT'
        })
        .select(`
          *,
          investment:investments(id, name, symbol, type),
          main_transaction:transactions(*)
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          investment_transaction: investmentTransaction,
          main_transaction: investmentTransaction.main_transaction as EnhancedTransaction
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_FAILED',
          message: error.message || 'Failed to record dividend',
          details: error
        }
      };
    }
  }

  // =============================================
  // UNIFIED TRANSACTION QUERIES
  // =============================================

  /**
   * Get unified transactions view (combines regular transactions and investment transactions)
   */
  static async getUnifiedTransactions(
    filters: UnifiedTransactionFilters
  ): Promise<GetUnifiedTransactionsResponse> {
    try {
      let query = supabase
        .from('unified_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', filters.user_id);

      // Apply filters
      if (filters.type) {
        if (Array.isArray(filters.type)) {
          query = query.in('type', filters.type);
        } else {
          query = query.eq('type', filters.type);
        }
      }

      if (filters.is_investment_related !== undefined) {
        query = query.eq('is_investment_related', filters.is_investment_related);
      }

      if (filters.investment_action) {
        if (Array.isArray(filters.investment_action)) {
          query = query.in('investment_action', filters.investment_action);
        } else {
          query = query.eq('investment_action', filters.investment_action);
        }
      }

      if (filters.investment_id) {
        query = query.eq('investment_id', filters.investment_id);
      }

      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.date_from) {
        query = query.gte('date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('date', filters.date_to);
      }

      if (filters.amount_min) {
        query = query.gte('amount', filters.amount_min);
      }

      if (filters.amount_max) {
        query = query.lte('amount', filters.amount_max);
      }

      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,investment_name.ilike.%${filters.search}%,vendor.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      // Apply ordering
      const orderBy = filters.order_by || 'date';
      const orderDirection = filters.order_direction || 'desc';
      
      if (orderBy === 'date') {
        query = query.order('date', { ascending: orderDirection === 'asc' });
        query = query.order('created_at', { ascending: orderDirection === 'asc' });
      } else {
        query = query.order(orderBy, { ascending: orderDirection === 'asc' });
      }

      const { data, count, error } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: {
          transactions: data || [],
          total_count: count || 0,
          has_more: (count || 0) > offset + limit
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_FAILED',
          message: error.message || 'Failed to fetch unified transactions',
          details: error
        }
      };
    }
  }

  /**
   * Get investment-only transactions
   */
  static async getInvestmentTransactions(
    userId: string,
    filters?: {
      investment_id?: string;
      action?: InvestmentAction | InvestmentAction[];
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<GetUnifiedTransactionsResponse> {
    const unifiedFilters: UnifiedTransactionFilters = {
      user_id: userId,
      is_investment_related: true,
      ...(filters?.investment_id && { investment_id: filters.investment_id }),
      ...(filters?.action && { investment_action: filters.action }),
      ...(filters?.date_from && { date_from: filters.date_from }),
      ...(filters?.date_to && { date_to: filters.date_to }),
      ...(filters?.limit && { limit: filters.limit }),
      ...(filters?.offset && { offset: filters.offset })
    };

    return this.getUnifiedTransactions(unifiedFilters);
  }

  /**
   * Get cash flow transactions (non-investment)
   */
  static async getCashFlowTransactions(
    userId: string,
    filters?: {
      type?: 'income' | 'expense' | 'transfer';
      account_id?: string;
      category_id?: string;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<GetUnifiedTransactionsResponse> {
    const unifiedFilters: UnifiedTransactionFilters = {
      user_id: userId,
      is_investment_related: false,
      ...(filters?.type && { type: filters.type as EnhancedTransactionType }),
      ...(filters?.account_id && { account_id: filters.account_id }),
      ...(filters?.category_id && { category_id: filters.category_id }),
      ...(filters?.date_from && { date_from: filters.date_from }),
      ...(filters?.date_to && { date_to: filters.date_to }),
      ...(filters?.limit && { limit: filters.limit }),
      ...(filters?.offset && { offset: filters.offset })
    };

    return this.getUnifiedTransactions(unifiedFilters);
  }

  // =============================================
  // INVESTMENT ANALYTICS WITH TRANSACTION INTEGRATION
  // =============================================

  /**
   * Get investment summary with transaction breakdown
   */
  static async getInvestmentSummary(
    investmentId: string,
    userId: string
  ): Promise<InvestmentServiceResponse<InvestmentSummaryWithTransactions>> {
    try {
      // Get investment details
      const { data: investment, error: investmentError } = await supabase
        .from('investments')
        .select('*')
        .eq('id', investmentId)
        .eq('user_id', userId)
        .single();

      if (investmentError) throw investmentError;

      // Get all transactions for this investment
      const transactionsResponse = await this.getInvestmentTransactions(userId, {
        investment_id: investmentId,
        limit: 1000 // Get all transactions
      });

      if (!transactionsResponse.success || !transactionsResponse.data) {
        throw new Error('Failed to fetch investment transactions');
      }

      const transactions = transactionsResponse.data.transactions;

      // Calculate transaction summary
      const purchases = transactions.filter(t => t.investment_action === 'buy');
      const sales = transactions.filter(t => t.investment_action === 'sell');
      const dividends = transactions.filter(t => t.investment_action === 'dividend');

      const total_purchases = purchases.reduce((sum, t) => sum + t.amount, 0);
      const total_sales = sales.reduce((sum, t) => sum + t.amount, 0);
      const total_dividends = dividends.reduce((sum, t) => sum + t.amount, 0);
      const total_fees = transactions.reduce((sum, t) => 
        sum + (t.brokerage_fee || 0) + (t.tax_amount || 0) + (t.other_charges || 0), 0);

      const net_invested = total_purchases - total_sales;
      const realized_pnl = total_sales - purchases
        .filter(p => sales.some(s => s.date >= p.date))
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate unrealized P&L
      const unrealized_pnl = investment.current_value - investment.total_invested;
      const unrealized_pnl_percentage = investment.total_invested > 0 
        ? (unrealized_pnl / investment.total_invested) * 100 
        : 0;

      return {
        success: true,
        data: {
          investment: {
            id: investment.id,
            name: investment.name,
            symbol: investment.symbol,
            type: investment.type,
            status: investment.status,
            total_units: investment.total_units,
            average_cost: investment.average_cost,
            current_price: investment.current_price,
            total_invested: investment.total_invested,
            current_value: investment.current_value,
            unrealized_pnl,
            unrealized_pnl_percentage
          },
          transactions: {
            total_purchases,
            total_sales,
            total_dividends,
            total_fees,
            net_invested,
            realized_pnl
          },
          recent_transactions: transactions.slice(0, 10) // Get 10 most recent
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_FAILED',
          message: error.message || 'Failed to get investment summary',
          details: error
        }
      };
    }
  }

  /**
   * Get portfolio performance with transaction analysis
   */
  static async getPortfolioPerformance(
    portfolioId: string,
    userId: string
  ): Promise<InvestmentServiceResponse<EnhancedPortfolioPerformance>> {
    try {
      // Get all investments in portfolio
      const { data: investments, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .eq('user_id', userId);

      if (investmentsError) throw investmentsError;

      // Get summaries for each investment
      const investment_summaries: InvestmentSummaryWithTransactions[] = [];
      
      for (const investment of investments || []) {
        const summaryResponse = await this.getInvestmentSummary(investment.id, userId);
        if (summaryResponse.success && summaryResponse.data) {
          investment_summaries.push(summaryResponse.data);
        }
      }

      // Calculate portfolio totals
      const total_invested = investment_summaries.reduce((sum, inv) => 
        sum + inv.investment.total_invested, 0);
      const current_value = investment_summaries.reduce((sum, inv) => 
        sum + inv.investment.current_value, 0);
      const unrealized_pnl = investment_summaries.reduce((sum, inv) => 
        sum + inv.investment.unrealized_pnl, 0);
      const realized_pnl = investment_summaries.reduce((sum, inv) => 
        sum + inv.transactions.realized_pnl, 0);
      const total_dividends = investment_summaries.reduce((sum, inv) => 
        sum + inv.transactions.total_dividends, 0);
      const total_fees = investment_summaries.reduce((sum, inv) => 
        sum + inv.transactions.total_fees, 0);

      const total_pnl = unrealized_pnl + realized_pnl;
      const total_pnl_percentage = total_invested > 0 ? (total_pnl / total_invested) * 100 : 0;

      // Get monthly performance data
      const monthly_performance = await this.getMonthlyPortfolioPerformance(portfolioId, userId);

      return {
        success: true,
        data: {
          portfolio_id: portfolioId,
          total_invested,
          current_value,
          unrealized_pnl,
          realized_pnl,
          total_pnl,
          total_pnl_percentage,
          total_dividends,
          total_fees,
          investment_summaries,
          monthly_performance
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_FAILED',
          message: error.message || 'Failed to get portfolio performance',
          details: error
        }
      };
    }
  }

  /**
   * Get monthly portfolio performance breakdown
   */
  private static async getMonthlyPortfolioPerformance(
    portfolioId: string,
    userId: string
  ): Promise<Array<{
    month: string;
    invested: number;
    returns: number;
    dividends: number;
    net_flow: number;
  }>> {
    try {
      // Get all transactions for portfolio investments
      const { data: transactions } = await supabase
        .from('unified_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_investment_related', true)
        .not('investment_id', 'is', null)
        .order('date');

      if (!transactions) return [];

      // Group by month
      const monthlyData: Record<string, {
        month: string;
        invested: number;
        returns: number;
        dividends: number;
        net_flow: number;
      }> = {};

      transactions.forEach(transaction => {
        const month = transaction.date.substring(0, 7); // YYYY-MM
        
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            invested: 0,
            returns: 0,
            dividends: 0,
            net_flow: 0
          };
        }

        switch (transaction.investment_action) {
          case 'buy':
            monthlyData[month].invested += transaction.amount;
            monthlyData[month].net_flow -= transaction.amount;
            break;
          case 'sell':
            monthlyData[month].returns += transaction.amount;
            monthlyData[month].net_flow += transaction.amount;
            break;
          case 'dividend':
            monthlyData[month].dividends += transaction.amount;
            monthlyData[month].net_flow += transaction.amount;
            break;
        }
      });

      return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    } catch (error) {
      console.error('Error getting monthly performance:', error);
      return [];
    }
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  /**
   * Get transaction by ID (unified view)
   */
  static async getTransactionById(
    transactionId: string,
    userId: string
  ): Promise<InvestmentServiceResponse<UnifiedTransaction>> {
    try {
      const { data, error } = await supabase
        .from('unified_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: {
              code: 'TRANSACTION_FAILED',
              message: 'Transaction not found'
            }
          };
        }
        throw error;
      }

      return {
        success: true,
        data
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_FAILED',
          message: error.message || 'Failed to get transaction',
          details: error
        }
      };
    }
  }

  /**
   * Delete investment transaction and its linked main transaction
   */
  static async deleteInvestmentTransaction(
    investmentTransactionId: string,
    userId: string
  ): Promise<InvestmentServiceResponse<void>> {
    try {
      // The database trigger will automatically delete the linked main transaction
      const { error } = await supabase
        .from('investment_transactions')
        .delete()
        .eq('id', investmentTransactionId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_FAILED',
          message: error.message || 'Failed to delete investment transaction',
          details: error
        }
      };
    }
  }

  /**
   * Get cash flow impact of investments
   */
  static async getInvestmentCashFlowImpact(
    userId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<InvestmentServiceResponse<{
    total_invested: number;
    total_returns: number;
    total_dividends: number;
    net_cash_flow: number;
    monthly_breakdown: Array<{
      month: string;
      invested: number;
      returns: number;
      dividends: number;
      net_flow: number;
    }>;
  }>> {
    try {
      const filters: UnifiedTransactionFilters = {
        user_id: userId,
        is_investment_related: true,
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
        limit: 10000 // Get all investment transactions
      };

      const response = await this.getUnifiedTransactions(filters);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch investment transactions');
      }

      const transactions = response.data.transactions;

      // Calculate totals
      const purchases = transactions.filter(t => t.investment_action === 'buy');
      const sales = transactions.filter(t => t.investment_action === 'sell');
      const dividends = transactions.filter(t => t.investment_action === 'dividend');

      const total_invested = purchases.reduce((sum, t) => sum + t.amount, 0);
      const total_returns = sales.reduce((sum, t) => sum + t.amount, 0);
      const total_dividends = dividends.reduce((sum, t) => sum + t.amount, 0);
      const net_cash_flow = total_returns + total_dividends - total_invested;

      // Monthly breakdown
      const monthlyBreakdown: Record<string, {
        month: string;
        invested: number;
        returns: number;
        dividends: number;
        net_flow: number;
      }> = {};

      transactions.forEach(transaction => {
        const month = transaction.date.substring(0, 7);
        
        if (!monthlyBreakdown[month]) {
          monthlyBreakdown[month] = {
            month,
            invested: 0,
            returns: 0,
            dividends: 0,
            net_flow: 0
          };
        }

        switch (transaction.investment_action) {
          case 'buy':
            monthlyBreakdown[month].invested += transaction.amount;
            monthlyBreakdown[month].net_flow -= transaction.amount;
            break;
          case 'sell':
            monthlyBreakdown[month].returns += transaction.amount;
            monthlyBreakdown[month].net_flow += transaction.amount;
            break;
          case 'dividend':
            monthlyBreakdown[month].dividends += transaction.amount;
            monthlyBreakdown[month].net_flow += transaction.amount;
            break;
        }
      });

      const monthly_breakdown = Object.values(monthlyBreakdown)
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        success: true,
        data: {
          total_invested,
          total_returns,
          total_dividends,
          net_cash_flow,
          monthly_breakdown
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSACTION_FAILED',
          message: error.message || 'Failed to get investment cash flow impact',
          details: error
        }
      };
    }
  }
}

export default UnifiedInvestmentTransactionService;