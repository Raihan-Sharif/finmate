import { supabase, TABLES } from '@/lib/supabase/client';
import { 
  InvestmentPortfolio, 
  CreateInvestmentPortfolioInput,
  UpdateInvestmentPortfolioInput,
  PortfolioPerformance 
} from '@/types/investments';

export class InvestmentPortfolioService {
  // Get all portfolios for a user with calculated metrics
  static async getPortfolios(userId: string): Promise<InvestmentPortfolio[]> {
    const { data, error } = await supabase
      .from('investment_portfolios')
      .select(`
        *,
        investments:investments(
          id,
          total_invested,
          current_value,
          gain_loss,
          gain_loss_percentage,
          dividend_earned
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate aggregated metrics for each portfolio
    return (data || []).map(portfolio => {
      const investments = portfolio.investments || [];
      const total_invested = investments.reduce((sum: number, inv: any) => sum + (inv.total_invested || 0), 0);
      const current_value = investments.reduce((sum: number, inv: any) => sum + (inv.current_value || 0), 0);
      const total_gain_loss = investments.reduce((sum: number, inv: any) => sum + (inv.gain_loss || 0), 0);
      const total_return_percentage = total_invested > 0 ? (total_gain_loss / total_invested) * 100 : 0;

      return {
        ...portfolio,
        total_invested,
        current_value,
        total_gain_loss,
        total_return_percentage,
        investment_count: investments.length
      };
    });
  }

  // Get portfolio by ID with detailed information
  static async getPortfolioById(id: string, userId: string): Promise<InvestmentPortfolio | null> {
    const { data, error } = await supabase
      .from('investment_portfolios')
      .select(`
        *,
        investments:investments(
          id,
          name,
          symbol,
          type,
          status,
          total_units,
          average_cost,
          current_price,
          total_invested,
          current_value,
          gain_loss,
          gain_loss_percentage,
          dividend_earned,
          platform,
          purchase_date
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Calculate aggregated metrics
    const investments = data.investments || [];
    const total_invested = investments.reduce((sum: number, inv: any) => sum + (inv.total_invested || 0), 0);
    const current_value = investments.reduce((sum: number, inv: any) => sum + (inv.current_value || 0), 0);
    const total_gain_loss = investments.reduce((sum: number, inv: any) => sum + (inv.gain_loss || 0), 0);
    const total_return_percentage = total_invested > 0 ? (total_gain_loss / total_invested) * 100 : 0;

    return {
      ...data,
      total_invested,
      current_value,
      total_gain_loss,
      total_return_percentage,
      investment_count: investments.length
    };
  }

  // Create new portfolio
  static async createPortfolio(
    portfolio: CreateInvestmentPortfolioInput,
    userId: string
  ): Promise<InvestmentPortfolio> {
    const { data, error } = await supabase
      .from('investment_portfolios')
      .insert({
        ...portfolio,
        user_id: userId,
        currency: portfolio.currency || 'BDT',
        color: portfolio.color || '#8B5CF6',
        icon: portfolio.icon || 'trending-up'
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Update portfolio
  static async updatePortfolio(
    id: string,
    updates: UpdateInvestmentPortfolioInput,
    userId: string
  ): Promise<InvestmentPortfolio> {
    const { data, error } = await supabase
      .from('investment_portfolios')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Delete portfolio (soft delete by setting is_active to false)
  static async deletePortfolio(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('investment_portfolios')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Get portfolio performance with detailed analytics
  static async getPortfolioPerformance(
    portfolioId: string,
    userId: string
  ): Promise<PortfolioPerformance | null> {
    const portfolio = await this.getPortfolioById(portfolioId, userId);
    if (!portfolio) return null;

    // Get detailed investment data
    const { data: investments, error } = await supabase
      .from('investments')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('user_id', userId);

    if (error) throw error;

    // Calculate performance metrics
    const total_invested = investments.reduce((sum, inv) => sum + inv.total_invested, 0);
    const current_value = investments.reduce((sum, inv) => sum + inv.current_value, 0);
    const gain_loss = current_value - total_invested;
    const return_percentage = total_invested > 0 ? (gain_loss / total_invested) * 100 : 0;
    const dividend_income = investments.reduce((sum, inv) => sum + inv.dividend_earned, 0);

    // Calculate asset allocation
    const asset_allocation = investments.reduce((acc, inv) => {
      const existing = acc.find((item: any) => item.type === inv.type);
      if (existing) {
        existing.value += inv.current_value;
        existing.count += 1;
      } else {
        acc.push({
          type: inv.type,
          value: inv.current_value,
          percentage: 0, // Will calculate after all investments are processed
          count: 1
        });
      }
      return acc;
    }, [] as Array<{
      type: string;
      value: number;
      percentage: number;
      count: number;
    }>);

    // Calculate percentages
    asset_allocation.forEach((allocation: any) => {
      allocation.percentage = current_value > 0 ? (allocation.value / current_value) * 100 : 0;
    });

    // Get top performing investments
    const top_investments = investments
      .sort((a, b) => b.gain_loss_percentage - a.gain_loss_percentage)
      .slice(0, 5);

    // Get monthly SIP amount from active templates
    const { data: templates } = await supabase
      .from('investment_templates')
      .select('amount_per_investment, frequency')
      .eq('portfolio_id', portfolioId)
      .eq('user_id', userId)
      .eq('is_active', true);

    const monthly_sip_amount = (templates || []).reduce((sum, template) => {
      let monthlyEquivalent = 0;
      switch (template.frequency) {
        case 'daily':
          monthlyEquivalent = template.amount_per_investment * 30;
          break;
        case 'weekly':
          monthlyEquivalent = template.amount_per_investment * 4.33;
          break;
        case 'biweekly':
          monthlyEquivalent = template.amount_per_investment * 2.17;
          break;
        case 'monthly':
          monthlyEquivalent = template.amount_per_investment;
          break;
        case 'quarterly':
          monthlyEquivalent = template.amount_per_investment / 3;
          break;
        case 'yearly':
          monthlyEquivalent = template.amount_per_investment / 12;
          break;
      }
      return sum + monthlyEquivalent;
    }, 0);

    return {
      portfolio,
      total_invested,
      current_value,
      gain_loss,
      return_percentage,
      dividend_income,
      monthly_sip_amount,
      investment_count: investments.length,
      asset_allocation,
      top_investments
    };
  }

  // Get all portfolios with performance data
  static async getAllPortfoliosWithPerformance(userId: string): Promise<PortfolioPerformance[]> {
    const portfolios = await this.getPortfolios(userId);
    
    const portfoliosWithPerformance = await Promise.all(
      portfolios.map(async (portfolio) => {
        const performance = await this.getPortfolioPerformance(portfolio.id, userId);
        return performance!; // We know it exists since we just fetched the portfolio
      })
    );

    return portfoliosWithPerformance;
  }

  // Archive portfolio (different from delete - keeps data but hides from active view)
  static async archivePortfolio(id: string, userId: string): Promise<void> {
    await this.updatePortfolio(id, { is_active: false }, userId);
  }

  // Restore archived portfolio
  static async restorePortfolio(id: string, userId: string): Promise<void> {
    await this.updatePortfolio(id, { is_active: true }, userId);
  }

  // Get portfolio summary for dashboard
  static async getPortfolioSummary(userId: string) {
    const portfolios = await this.getPortfolios(userId);
    
    const summary = {
      total_portfolios: portfolios.length,
      total_invested: portfolios.reduce((sum, p) => sum + (p.total_invested || 0), 0),
      current_value: portfolios.reduce((sum, p) => sum + (p.current_value || 0), 0),
      total_gain_loss: portfolios.reduce((sum, p) => sum + (p.total_gain_loss || 0), 0),
      total_investments: portfolios.reduce((sum, p) => sum + (p.investment_count || 0), 0),
      best_performing_portfolio: portfolios.sort((a, b) => 
        (b.total_return_percentage || 0) - (a.total_return_percentage || 0)
      )[0],
      portfolios
    };

    return {
      ...summary,
      total_return_percentage: summary.total_invested > 0 
        ? (summary.total_gain_loss / summary.total_invested) * 100 
        : 0
    };
  }
}

export default InvestmentPortfolioService;