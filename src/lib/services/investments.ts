import { supabase, TABLES } from '@/lib/supabase/client';
import { 
  Investment, 
  CreateInvestmentInput,
  UpdateInvestmentInput,
  InvestmentFilters,
  InvestmentSortOptions
} from '@/types/investments';

export class InvestmentService {
  // Get all investments for a user with optional filtering
  static async getInvestments(
    userId: string, 
    filters?: InvestmentFilters,
    sort?: InvestmentSortOptions
  ): Promise<Investment[]> {
    let query = supabase
      .from('investments')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId);

    // Apply filters
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

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.symbol) {
      query = query.ilike('symbol', `%${filters.symbol}%`);
    }

    if (filters?.platform) {
      query = query.ilike('platform', `%${filters.platform}%`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters?.date_range) {
      query = query
        .gte('purchase_date', filters.date_range.start)
        .lte('purchase_date', filters.date_range.end);
    }

    if (filters?.amount_range) {
      query = query
        .gte('current_value', filters.amount_range.min)
        .lte('current_value', filters.amount_range.max);
    }

    if (filters?.return_range) {
      query = query
        .gte('gain_loss_percentage', filters.return_range.min)
        .lte('gain_loss_percentage', filters.return_range.max);
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  // Get investment by ID with detailed information
  static async getInvestmentById(id: string, userId: string): Promise<Investment | null> {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon,
          risk_level
        ),
        recent_transactions:investment_transactions(
          id,
          type,
          units,
          price_per_unit,
          total_amount,
          net_amount,
          transaction_date,
          platform
        ),
        price_history:investment_price_history(
          date,
          close_price,
          volume
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .order('date', { ascending: false, foreignTable: 'investment_price_history' })
      .limit(30, { foreignTable: 'investment_price_history' })
      .order('transaction_date', { ascending: false, foreignTable: 'investment_transactions' })
      .limit(10, { foreignTable: 'investment_transactions' })
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // Create new investment
  static async createInvestment(
    investment: CreateInvestmentInput,
    userId: string
  ): Promise<Investment> {
    console.log('🔥 SERVICE: Received investment data:', investment);
    console.log('🔥 SERVICE: User ID:', userId);
    console.log('🔥 SERVICE: average_cost value:', investment.average_cost, typeof investment.average_cost);
    console.log('🔥 SERVICE: current_price value:', investment.current_price, typeof investment.current_price);
    console.log('🔥 SERVICE: total_units value:', investment.total_units, typeof investment.total_units);
    
    // Calculate initial values
    const total_invested = investment.total_units * investment.average_cost;
    const current_value = investment.total_units * investment.current_price;
    
    console.log('🔥 SERVICE: Calculated total_invested:', total_invested);
    console.log('🔥 SERVICE: Calculated current_value:', current_value);

    const insertData = {
      user_id: userId,
      portfolio_id: investment.portfolio_id,
      name: investment.name,
      symbol: investment.symbol,
      type: investment.type,
      total_units: investment.total_units,
      average_cost: investment.average_cost,
      current_price: investment.current_price,
      total_invested,
      current_value,
      platform: investment.platform,
      account_number: investment.account_number,
      folio_number: investment.folio_number,
      maturity_date: investment.maturity_date,
      interest_rate: investment.interest_rate,
      currency: investment.currency || 'BDT',
      exchange: investment.exchange,
      tags: investment.tags,
      notes: investment.notes,
      documents: investment.documents,
      metadata: investment.metadata,
      purchase_date: investment.purchase_date
    };
    
    console.log('🔥 SERVICE: EXACT data being inserted to DB:', insertData);
    console.log('🔥 SERVICE: average_cost in insert object:', insertData.average_cost);

    console.log('🔥 SERVICE: About to insert to database...');
    
    try {
      const { data, error } = await supabase
        .from('investments')
        .insert(insertData)
        .select(`
          *,
          portfolio:investment_portfolios(
            id,
            name,
            color,
            icon
          )
        `)
        .single();

      console.log('🔥 SERVICE: Database response received');
      console.log('🔥 SERVICE: Error:', error);
      console.log('🔥 SERVICE: Data:', data);

      if (error) {
        console.error('🔥 SERVICE: Database insert failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Investment creation failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('Investment creation failed: No data returned from database');
      }

      // Create initial buy transaction
      console.log('🔥 SERVICE: Creating initial transaction...');
      const transactionResult = await supabase
        .from('investment_transactions')
        .insert({
          user_id: userId,
          investment_id: data.id,
          portfolio_id: data.portfolio_id,
          type: 'buy',
          units: investment.total_units,
          price_per_unit: investment.average_cost,
          total_amount: total_invested,
          net_amount: total_invested,
          transaction_date: investment.purchase_date,
          platform: investment.platform,
          currency: investment.currency || 'BDT',
          notes: 'Initial investment'
        });
        
      console.log('🔥 SERVICE: Transaction result:', transactionResult);
      console.log('🔥 SERVICE: Transaction error:', transactionResult.error);
      
      if (transactionResult.error) {
        console.error('🔥 SERVICE: Transaction insert failed:', {
          message: transactionResult.error.message,
          details: transactionResult.error.details,
          hint: transactionResult.error.hint,
          code: transactionResult.error.code
        });
        // Don't throw here - investment was created successfully
        console.warn('🔥 SERVICE: Investment created but initial transaction failed');
      }

      console.log('🔥 SERVICE: Investment creation completed successfully');
      return data;
    } catch (error) {
      console.error('🔥 SERVICE: Unexpected error during investment creation:', error);
      throw error;
    }
  }

  // Update investment
  static async updateInvestment(
    id: string,
    updates: UpdateInvestmentInput,
    userId: string
  ): Promise<Investment> {
    const { data, error } = await supabase
      .from('investments')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Update investment price
  static async updatePrice(
    id: string,
    newPrice: number,
    userId: string
  ): Promise<Investment> {
    const investment = await this.getInvestmentById(id, userId);
    if (!investment) throw new Error('Investment not found');

    // Update the investment with new price
    const updatedInvestment = await this.updateInvestment(id, {
      current_price: newPrice
    }, userId);

    // Add price history record
    await supabase
      .from('investment_price_history')
      .insert({
        investment_id: id,
        symbol: investment.symbol || investment.name,
        date: new Date().toISOString().split('T')[0],
        close_price: newPrice,
        currency: investment.currency,
        source: 'manual'
      });

    return updatedInvestment;
  }

  // Delete investment (soft delete by setting status to closed)
  static async deleteInvestment(id: string, userId: string): Promise<void> {
    await this.updateInvestment(id, { status: 'closed' }, userId);
  }

  // Get investment performance over time
  static async getInvestmentPerformance(
    id: string,
    userId: string,
    days: number = 90
  ): Promise<Array<{ date: string; price: number; value: number }>> {
    const investment = await this.getInvestmentById(id, userId);
    if (!investment) throw new Error('Investment not found');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('investment_price_history')
      .select('date, close_price')
      .eq('investment_id', id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map(record => ({
      date: record.date,
      price: record.close_price,
      value: record.close_price * investment.total_units
    }));
  }

  // Get investment analytics
  static async getInvestmentAnalytics(userId: string) {
    const investments = await this.getInvestments(userId);
    
    const analytics = {
      total_investments: investments.length,
      total_invested: investments.reduce((sum, inv) => sum + inv.total_invested, 0),
      current_value: investments.reduce((sum, inv) => sum + inv.current_value, 0),
      total_gain_loss: investments.reduce((sum, inv) => sum + inv.gain_loss, 0),
      dividend_income: investments.reduce((sum, inv) => sum + inv.dividend_earned, 0),
      best_performer: investments.sort((a, b) => b.gain_loss_percentage - a.gain_loss_percentage)[0],
      worst_performer: investments.sort((a, b) => a.gain_loss_percentage - b.gain_loss_percentage)[0],
      by_type: investments.reduce((acc, inv) => {
        if (!acc[inv.type]) {
          acc[inv.type] = {
            count: 0,
            total_invested: 0,
            current_value: 0,
            gain_loss: 0
          };
        }
        acc[inv.type].count += 1;
        acc[inv.type].total_invested += inv.total_invested;
        acc[inv.type].current_value += inv.current_value;
        acc[inv.type].gain_loss += inv.gain_loss;
        return acc;
      }, {} as Record<string, any>),
      by_status: investments.reduce((acc, inv) => {
        if (!acc[inv.status]) {
          acc[inv.status] = {
            count: 0,
            total_invested: 0,
            current_value: 0
          };
        }
        acc[inv.status].count += 1;
        acc[inv.status].total_invested += inv.total_invested;
        acc[inv.status].current_value += inv.current_value;
        return acc;
      }, {} as Record<string, any>)
    };

    return {
      ...analytics,
      total_return_percentage: analytics.total_invested > 0 
        ? (analytics.total_gain_loss / analytics.total_invested) * 100 
        : 0
    };
  }

  // Get investments by type
  static async getInvestmentsByType(userId: string, type: string): Promise<Investment[]> {
    return this.getInvestments(userId, { type: type as any });
  }

  // Get active investments
  static async getActiveInvestments(userId: string): Promise<Investment[]> {
    return this.getInvestments(userId, { status: 'active' });
  }

  // Search investments
  static async searchInvestments(
    userId: string, 
    query: string
  ): Promise<Investment[]> {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .or(`name.ilike.%${query}%,symbol.ilike.%${query}%,platform.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get top performing investments
  static async getTopPerformers(userId: string, limit: number = 5): Promise<Investment[]> {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('gain_loss_percentage', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Get recent investments
  static async getRecentInvestments(userId: string, limit: number = 10): Promise<Investment[]> {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        portfolio:investment_portfolios(
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Bulk update prices (for batch price updates)
  static async bulkUpdatePrices(
    updates: Array<{ id: string; price: number }>,
    userId: string
  ): Promise<void> {
    const promises = updates.map(update => 
      this.updatePrice(update.id, update.price, userId)
    );
    
    await Promise.all(promises);
  }

  // Get investment statistics
  static async getInvestmentStats(userId: string) {
    const { data, error } = await supabase
      .from('investments')
      .select('type, status, gain_loss_percentage, dividend_earned')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total_count: data?.length || 0,
      active_count: data?.filter(i => i.status === 'active').length || 0,
      profitable_count: data?.filter(i => i.gain_loss_percentage > 0).length || 0,
      loss_count: data?.filter(i => i.gain_loss_percentage < 0).length || 0,
      avg_return: data?.length > 0 
        ? data.reduce((sum, i) => sum + i.gain_loss_percentage, 0) / data.length 
        : 0,
      total_dividend: data?.reduce((sum, i) => sum + i.dividend_earned, 0) || 0,
      by_type: data?.reduce((acc, inv) => {
        acc[inv.type] = (acc[inv.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      profitability_rate: data?.length > 0 
        ? (data.filter(i => i.gain_loss_percentage > 0).length / data.length) * 100 
        : 0
    };

    return stats;
  }
}

export default InvestmentService;