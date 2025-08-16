import { supabase, TABLES } from '@/lib/supabase/client';
import { 
  InvestmentTransaction, 
  CreateInvestmentTransactionInput,
  InvestmentTransactionType
} from '@/types/investments';

export class InvestmentTransactionService {
  // Get all investment transactions for a user
  static async getTransactions(
    userId: string,
    filters?: {
      investment_id?: string;
      portfolio_id?: string;
      type?: InvestmentTransactionType | InvestmentTransactionType[];
      date_range?: { start: string; end: string };
      platform?: string;
    }
  ): Promise<InvestmentTransaction[]> {
    let query = supabase
      .from('investment_transactions')
      .select(`
        *,
        investment:investments(
          id,
          name,
          symbol,
          type
        ),
        portfolio:investment_portfolios(
          id,
          name,
          color
        )
      `)
      .eq('user_id', userId);

    // Apply filters
    if (filters?.investment_id) {
      query = query.eq('investment_id', filters.investment_id);
    }

    if (filters?.portfolio_id) {
      query = query.eq('portfolio_id', filters.portfolio_id);
    }

    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        query = query.in('type', filters.type);
      } else {
        query = query.eq('type', filters.type);
      }
    }

    if (filters?.date_range) {
      query = query
        .gte('transaction_date', filters.date_range.start)
        .lte('transaction_date', filters.date_range.end);
    }

    if (filters?.platform) {
      query = query.ilike('platform', `%${filters.platform}%`);
    }

    const { data, error } = await query.order('transaction_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Get transaction by ID
  static async getTransactionById(
    id: string, 
    userId: string
  ): Promise<InvestmentTransaction | null> {
    const { data, error } = await supabase
      .from('investment_transactions')
      .select(`
        *,
        investment:investments(
          id,
          name,
          symbol,
          type,
          platform
        ),
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
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
  static async createTransaction(
    transaction: CreateInvestmentTransactionInput,
    userId: string
  ): Promise<InvestmentTransaction> {
    // Calculate net amount after fees
    const total_charges = (transaction.brokerage_fee || 0) + 
                         (transaction.tax_amount || 0) + 
                         (transaction.other_charges || 0);
    const total_amount = transaction.units * transaction.price_per_unit;
    const net_amount = total_amount - total_charges;

    const { data, error } = await supabase
      .from('investment_transactions')
      .insert({
        ...transaction,
        user_id: userId,
        total_amount,
        brokerage_fee: transaction.brokerage_fee || 0,
        tax_amount: transaction.tax_amount || 0,
        other_charges: transaction.other_charges || 0,
        net_amount,
        currency: transaction.currency || 'BDT'
      })
      .select(`
        *,
        investment:investments(
          id,
          name,
          symbol,
          type
        ),
        portfolio:investment_portfolios(
          id,
          name,
          color
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Update transaction
  static async updateTransaction(
    id: string,
    updates: Partial<CreateInvestmentTransactionInput>,
    userId: string
  ): Promise<InvestmentTransaction> {
    // Recalculate amounts if relevant fields are updated
    let updateData = { ...updates };
    
    if (updates.units || updates.price_per_unit || 
        updates.brokerage_fee !== undefined || 
        updates.tax_amount !== undefined || 
        updates.other_charges !== undefined) {
      
      const current = await this.getTransactionById(id, userId);
      if (!current) throw new Error('Transaction not found');

      const units = updates.units ?? current.units;
      const price_per_unit = updates.price_per_unit ?? current.price_per_unit;
      const brokerage_fee = updates.brokerage_fee ?? current.brokerage_fee;
      const tax_amount = updates.tax_amount ?? current.tax_amount;
      const other_charges = updates.other_charges ?? current.other_charges;

      const total_amount = units * price_per_unit;
      const total_charges = (brokerage_fee || 0) + (tax_amount || 0) + (other_charges || 0);
      const net_amount = total_amount - total_charges;

      // Keep calculated amounts for use but don't include in update
      // The database will handle calculated fields through triggers
    }

    const { data, error } = await supabase
      .from('investment_transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        investment:investments(
          id,
          name,
          symbol,
          type
        ),
        portfolio:investment_portfolios(
          id,
          name,
          color
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Delete transaction
  static async deleteTransaction(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('investment_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Get transactions for specific investment
  static async getInvestmentTransactions(
    investmentId: string, 
    userId: string
  ): Promise<InvestmentTransaction[]> {
    return this.getTransactions(userId, { investment_id: investmentId });
  }

  // Get transactions for specific portfolio
  static async getPortfolioTransactions(
    portfolioId: string, 
    userId: string
  ): Promise<InvestmentTransaction[]> {
    return this.getTransactions(userId, { portfolio_id: portfolioId });
  }

  // Get recent transactions
  static async getRecentTransactions(
    userId: string, 
    limit: number = 10
  ): Promise<InvestmentTransaction[]> {
    const { data, error } = await supabase
      .from('investment_transactions')
      .select(`
        *,
        investment:investments(
          id,
          name,
          symbol,
          type
        ),
        portfolio:investment_portfolios(
          id,
          name,
          color
        )
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get transactions by type
  static async getTransactionsByType(
    userId: string, 
    type: InvestmentTransactionType
  ): Promise<InvestmentTransaction[]> {
    return this.getTransactions(userId, { type });
  }

  // Get buy transactions (for cost calculation)
  static async getBuyTransactions(
    investmentId: string, 
    userId: string
  ): Promise<InvestmentTransaction[]> {
    return this.getTransactions(userId, { 
      investment_id: investmentId, 
      type: 'buy' 
    });
  }

  // Get sell transactions
  static async getSellTransactions(
    investmentId: string, 
    userId: string
  ): Promise<InvestmentTransaction[]> {
    return this.getTransactions(userId, { 
      investment_id: investmentId, 
      type: 'sell' 
    });
  }

  // Get dividend transactions
  static async getDividendTransactions(
    investmentId: string, 
    userId: string
  ): Promise<InvestmentTransaction[]> {
    return this.getTransactions(userId, { 
      investment_id: investmentId, 
      type: 'dividend' 
    });
  }

  // Calculate investment cost basis
  static async getInvestmentCostBasis(
    investmentId: string, 
    userId: string
  ): Promise<{
    total_units_bought: number;
    total_amount_invested: number;
    average_cost: number;
    total_units_sold: number;
    total_sale_amount: number;
    current_units: number;
    total_dividends: number;
  }> {
    const transactions = await this.getInvestmentTransactions(investmentId, userId);
    
    const buyTransactions = transactions.filter(t => t.type === 'buy');
    const sellTransactions = transactions.filter(t => t.type === 'sell');
    const dividendTransactions = transactions.filter(t => t.type === 'dividend');

    const total_units_bought = buyTransactions.reduce((sum, t) => sum + t.units, 0);
    const total_amount_invested = buyTransactions.reduce((sum, t) => sum + t.net_amount, 0);
    const average_cost = total_units_bought > 0 ? total_amount_invested / total_units_bought : 0;
    
    const total_units_sold = sellTransactions.reduce((sum, t) => sum + t.units, 0);
    const total_sale_amount = sellTransactions.reduce((sum, t) => sum + t.net_amount, 0);
    const current_units = total_units_bought - total_units_sold;
    
    const total_dividends = dividendTransactions.reduce((sum, t) => sum + t.net_amount, 0);

    return {
      total_units_bought,
      total_amount_invested,
      average_cost,
      total_units_sold,
      total_sale_amount,
      current_units,
      total_dividends
    };
  }

  // Get transaction analytics
  static async getTransactionAnalytics(userId: string) {
    const transactions = await this.getTransactions(userId);
    
    const analytics = {
      total_transactions: transactions.length,
      total_invested: transactions
        .filter(t => t.type === 'buy')
        .reduce((sum, t) => sum + t.net_amount, 0),
      total_sold: transactions
        .filter(t => t.type === 'sell')
        .reduce((sum, t) => sum + t.net_amount, 0),
      total_dividends: transactions
        .filter(t => t.type === 'dividend')
        .reduce((sum, t) => sum + t.net_amount, 0),
      total_charges: transactions.reduce((sum, t) => 
        sum + (t.brokerage_fee || 0) + (t.tax_amount || 0) + (t.other_charges || 0), 0),
      by_type: transactions.reduce((acc, t) => {
        if (!acc[t.type]) {
          acc[t.type] = {
            count: 0,
            total_amount: 0,
            total_units: 0
          };
        }
        acc[t.type].count += 1;
        acc[t.type].total_amount += t.net_amount;
        acc[t.type].total_units += t.units;
        return acc;
      }, {} as Record<string, any>),
      by_month: transactions.reduce((acc, t) => {
        const month = t.transaction_date.substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = {
            buy_amount: 0,
            sell_amount: 0,
            dividend_amount: 0,
            transaction_count: 0
          };
        }
        acc[month].transaction_count += 1;
        if (t.type === 'buy') acc[month].buy_amount += t.net_amount;
        if (t.type === 'sell') acc[month].sell_amount += t.net_amount;
        if (t.type === 'dividend') acc[month].dividend_amount += t.net_amount;
        return acc;
      }, {} as Record<string, any>)
    };

    return analytics;
  }

  // Get transactions for date range with pagination
  static async getTransactionsPaginated(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      start_date?: string;
      end_date?: string;
      type?: InvestmentTransactionType;
      investment_id?: string;
    }
  ) {
    let query = supabase
      .from('investment_transactions')
      .select(`
        *,
        investment:investments(
          id,
          name,
          symbol,
          type
        ),
        portfolio:investment_portfolios(
          id,
          name,
          color
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (filters?.start_date) {
      query = query.gte('transaction_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('transaction_date', filters.end_date);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.investment_id) {
      query = query.eq('investment_id', filters.investment_id);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .range(from, to)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  // Bulk create transactions (for import functionality)
  static async bulkCreateTransactions(
    transactions: CreateInvestmentTransactionInput[],
    userId: string
  ): Promise<InvestmentTransaction[]> {
    const transactionsWithCalculatedFields = transactions.map(transaction => {
      const total_charges = (transaction.brokerage_fee || 0) + 
                           (transaction.tax_amount || 0) + 
                           (transaction.other_charges || 0);
      const total_amount = transaction.units * transaction.price_per_unit;
      const net_amount = total_amount - total_charges;

      return {
        ...transaction,
        user_id: userId,
        total_amount,
        brokerage_fee: transaction.brokerage_fee || 0,
        tax_amount: transaction.tax_amount || 0,
        other_charges: transaction.other_charges || 0,
        net_amount,
        currency: transaction.currency || 'BDT'
      };
    });

    const { data, error } = await supabase
      .from('investment_transactions')
      .insert(transactionsWithCalculatedFields)
      .select(`
        *,
        investment:investments(
          id,
          name,
          symbol,
          type
        ),
        portfolio:investment_portfolios(
          id,
          name,
          color
        )
      `);

    if (error) throw error;
    return data || [];
  }
}

export default InvestmentTransactionService;