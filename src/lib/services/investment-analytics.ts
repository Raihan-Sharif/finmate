import { supabase } from '@/lib/supabase/client';
import { 
  InvestmentAnalytics,
  InvestmentDashboardStats,
  PortfolioPerformance
} from '@/types/investments';
import { InvestmentPortfolioService } from './investment-portfolios';
import { InvestmentService } from './investments';
import { InvestmentTransactionService } from './investment-transactions';
import { InvestmentTemplateService } from './investment-templates';

export class InvestmentAnalyticsService {
  // Get comprehensive dashboard statistics
  static async getDashboardStats(userId: string): Promise<InvestmentDashboardStats> {
    // Get all investments and portfolios data in parallel
    const [
      investments,
      portfolios,
      transactions,
      templates
    ] = await Promise.all([
      InvestmentService.getInvestments(userId),
      InvestmentPortfolioService.getPortfolios(userId),
      InvestmentTransactionService.getTransactionAnalytics(userId),
      InvestmentTemplateService.getTemplateStats(userId)
    ]);

    // Calculate basic metrics
    const total_invested = investments.reduce((sum, inv) => sum + inv.total_invested, 0);
    const total_current_value = investments.reduce((sum, inv) => sum + inv.current_value, 0);
    const total_gain_loss = total_current_value - total_invested;
    const total_return_percentage = total_invested > 0 ? (total_gain_loss / total_invested) * 100 : 0;

    // Get dividend income
    const dividend_income = investments.reduce((sum, inv) => sum + inv.dividend_earned, 0);

    // Find top and worst performing investments
    const activeInvestments = investments.filter(inv => inv.status === 'active');
    const top_performing_investment = activeInvestments.sort(
      (a, b) => b.gain_loss_percentage - a.gain_loss_percentage
    )[0];
    const worst_performing_investment = activeInvestments.sort(
      (a, b) => a.gain_loss_percentage - b.gain_loss_percentage
    )[0];

    // Get upcoming template executions
    const upcoming_executions = await InvestmentTemplateService.getUpcomingExecutions(userId, 30);

    return {
      total_portfolios: portfolios.length,
      total_investments: investments.length,
      total_invested,
      total_current_value,
      total_gain_loss,
      total_return_percentage,
      dividend_income,
      active_sips: templates.active_templates,
      monthly_sip_amount: templates.total_monthly_investment,
      top_performing_investment,
      worst_performing_investment,
      upcoming_executions: upcoming_executions.slice(0, 5)
    };
  }

  // Get comprehensive investment analytics
  static async getInvestmentAnalytics(userId: string): Promise<InvestmentAnalytics> {
    // Get portfolio performance data
    const portfolio_performance = await InvestmentPortfolioService.getAllPortfoliosWithPerformance(userId);
    
    // Get all investments for asset allocation analysis
    const investments = await InvestmentService.getInvestments(userId);
    
    // Calculate overall asset allocation
    const asset_allocation = investments.reduce((acc, inv) => {
      const existing = acc.find(item => item.type === inv.type);
      if (existing) {
        existing.value += inv.current_value;
        existing.count += 1;
      } else {
        acc.push({
          type: inv.type,
          value: inv.current_value,
          percentage: 0,
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

    // Calculate asset allocation percentages
    const total_value = asset_allocation.reduce((sum, allocation) => sum + allocation.value, 0);
    asset_allocation.forEach(allocation => {
      allocation.percentage = total_value > 0 ? (allocation.value / total_value) * 100 : 0;
    });

    // Get monthly investment trends
    const monthly_investment_trend = await this.getMonthlyInvestmentTrend(userId);

    // Get SIP analysis
    const sip_analysis = await this.getSIPAnalysis(userId);

    // Get performance metrics
    const performance_metrics = await this.getPerformanceMetrics(userId);

    return {
      portfolio_performance,
      asset_allocation,
      monthly_investment_trend,
      sip_analysis,
      performance_metrics
    };
  }

  // Get monthly investment trend data
  static async getMonthlyInvestmentTrend(
    userId: string,
    months: number = 12
  ): Promise<Array<{
    month: string;
    invested: number;
    value: number;
    gain_loss: number;
  }>> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get monthly snapshots or calculate from transactions
    const { data: transactions, error } = await supabase
      .from('investment_transactions')
      .select('transaction_date, type, net_amount, investment_id')
      .eq('user_id', userId)
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .order('transaction_date', { ascending: true });

    if (error) throw error;

    // Group transactions by month
    const monthlyData: Record<string, {
      invested: number;
      dividends: number;
      sales: number;
    }> = {};

    transactions?.forEach(transaction => {
      const month = transaction.transaction_date.substring(0, 7); // YYYY-MM
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          invested: 0,
          dividends: 0,
          sales: 0
        };
      }

      if (transaction.type === 'buy') {
        monthlyData[month].invested += transaction.net_amount;
      } else if (transaction.type === 'dividend') {
        monthlyData[month].dividends += transaction.net_amount;
      } else if (transaction.type === 'sell') {
        monthlyData[month].sales += transaction.net_amount;
      }
    });

    // Convert to array format with cumulative calculations
    const trend: Array<{
      month: string;
      invested: number;
      value: number;
      gain_loss: number;
    }> = [];

    let cumulativeInvested = 0;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Generate data for each month
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      const monthDisplay = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      const monthData = monthlyData[monthKey] || { invested: 0, dividends: 0, sales: 0 };
      cumulativeInvested += monthData.invested - monthData.sales;

      // For current value, we'd need historical price data
      // For now, use a simplified calculation
      const currentValue = cumulativeInvested * 1.08; // Assume 8% average growth

      trend.push({
        month: monthDisplay,
        invested: monthData.invested,
        value: currentValue,
        gain_loss: currentValue - cumulativeInvested
      });
    }

    return trend;
  }

  // Get SIP analysis data
  static async getSIPAnalysis(userId: string) {
    const templates = await InvestmentTemplateService.getTemplates(userId);
    const sipTemplates = templates.filter(t => 
      t.template_type === 'sip' || t.investment_type === 'sip'
    );

    // Calculate monthly SIP amount
    const monthly_amount = sipTemplates.reduce((sum, template) => {
      if (!template.is_active) return sum;
      
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

    // Calculate average cost benefit (simplified)
    const average_cost_benefit = sipTemplates.length > 0 
      ? sipTemplates.reduce((sum, t) => sum + (t.total_executed * 0.15), 0) / sipTemplates.length
      : 0;

    // Get upcoming SIPs
    const upcoming_sips = await InvestmentTemplateService.getUpcomingExecutions(userId, 7);

    return {
      total_sips: sipTemplates.filter(t => t.is_active).length,
      monthly_amount,
      average_cost_benefit,
      upcoming_sips: upcoming_sips.slice(0, 5)
    };
  }

  // Get performance metrics
  static async getPerformanceMetrics(userId: string) {
    const investments = await InvestmentService.getInvestments(userId);
    const activeInvestments = investments.filter(inv => inv.status === 'active');

    if (activeInvestments.length === 0) {
      return {
        best_performer: null,
        worst_performer: null,
        highest_dividend: null,
        most_volatile: null
      };
    }

    // Sort investments for different metrics
    const sortedByReturn = [...activeInvestments].sort(
      (a, b) => b.gain_loss_percentage - a.gain_loss_percentage
    );
    
    const sortedByDividend = [...activeInvestments].sort(
      (a, b) => b.dividend_earned - a.dividend_earned
    );

    // For volatility, we'd need historical price data
    // For now, use a simplified calculation based on gain/loss variance
    const avgReturn = activeInvestments.reduce((sum, inv) => sum + inv.gain_loss_percentage, 0) / activeInvestments.length;
    const sortedByVolatility = [...activeInvestments].sort((a, b) => {
      const aVariance = Math.abs(a.gain_loss_percentage - avgReturn);
      const bVariance = Math.abs(b.gain_loss_percentage - avgReturn);
      return bVariance - aVariance;
    });

    return {
      best_performer: sortedByReturn[0],
      worst_performer: sortedByReturn[sortedByReturn.length - 1],
      highest_dividend: sortedByDividend[0],
      most_volatile: sortedByVolatility[0]
    };
  }

  // Get investment performance comparison
  static async getInvestmentComparison(
    userId: string,
    investmentIds: string[]
  ): Promise<Array<{
    investment: any;
    performance_data: Array<{ date: string; value: number }>;
  }>> {
    const comparisons = await Promise.all(
      investmentIds.map(async (id) => {
        const investment = await InvestmentService.getInvestmentById(id, userId);
        if (!investment) return null;

        const performance_data = await InvestmentService.getInvestmentPerformance(id, userId, 90);
        
        return {
          investment,
          performance_data
        };
      })
    );

    return comparisons.filter(Boolean) as any[];
  }

  // Get risk analysis
  static async getRiskAnalysis(userId: string) {
    const portfolios = await InvestmentPortfolioService.getPortfolios(userId);
    const investments = await InvestmentService.getInvestments(userId);

    const riskAnalysis = {
      portfolio_risk_distribution: portfolios.reduce((acc, portfolio) => {
        const portfolioInvestments = investments.filter(inv => inv.portfolio_id === portfolio.id);
        const portfolioValue = portfolioInvestments.reduce((sum, inv) => sum + inv.current_value, 0);
        
        acc[portfolio.risk_level] = (acc[portfolio.risk_level] || 0) + portfolioValue;
        return acc;
      }, {} as Record<string, number>),
      
      asset_risk_score: this.calculateAssetRiskScore(investments),
      
      diversification_score: this.calculateDiversificationScore(investments),
      
      recommendations: this.generateRiskRecommendations(investments, portfolios)
    };

    return riskAnalysis;
  }

  // Calculate asset risk score (simplified)
  private static calculateAssetRiskScore(investments: any[]): number {
    const riskWeights: Record<string, number> = {
      'crypto': 0.9,
      'stock': 0.7,
      'mutual_fund': 0.5,
      'gold': 0.4,
      'bond': 0.3,
      'fd': 0.1,
      'dps': 0.1,
      'shanchay_potro': 0.1
    };

    const totalValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
    if (totalValue === 0) return 0;

    const weightedRisk = investments.reduce((sum, inv) => {
      const weight = riskWeights[inv.type] || 0.5;
      const valueWeight = inv.current_value / totalValue;
      return sum + (weight * valueWeight);
    }, 0);

    return Math.round(weightedRisk * 100);
  }

  // Calculate diversification score
  private static calculateDiversificationScore(investments: any[]): number {
    if (investments.length === 0) return 0;

    const typeDistribution: Record<string, number> = {};
    const totalValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);

    investments.forEach(inv => {
      typeDistribution[inv.type] = (typeDistribution[inv.type] || 0) + inv.current_value;
    });

    // Calculate concentration (opposite of diversification)
    const concentrationScore = Object.values(typeDistribution).reduce((sum, value) => {
      const percentage = value / totalValue;
      return sum + (percentage * percentage);
    }, 0);

    // Convert to diversification score (0-100)
    return Math.round((1 - concentrationScore) * 100);
  }

  // Generate risk recommendations
  private static generateRiskRecommendations(investments: any[], portfolios: any[]): string[] {
    const recommendations: string[] = [];
    
    const totalValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
    const typeDistribution: Record<string, number> = {};
    
    investments.forEach(inv => {
      typeDistribution[inv.type] = (typeDistribution[inv.type] || 0) + inv.current_value;
    });

    // Check for over-concentration
    Object.entries(typeDistribution).forEach(([type, value]) => {
      const percentage = (value / totalValue) * 100;
      if (percentage > 40) {
        recommendations.push(`Consider reducing ${type} allocation (currently ${percentage.toFixed(1)}%)`);
      }
    });

    // Check for under-diversification
    if (Object.keys(typeDistribution).length < 3) {
      recommendations.push('Consider diversifying across more asset types');
    }

    // Check for emergency fund
    const safeAssets = ['fd', 'dps', 'shanchay_potro'];
    const safeAssetsValue = safeAssets.reduce((sum, type) => sum + (typeDistribution[type] || 0), 0);
    const safeAssetsPercentage = (safeAssetsValue / totalValue) * 100;
    
    if (safeAssetsPercentage < 10) {
      recommendations.push('Consider allocating 10-20% to safe assets (FD, DPS) for emergency fund');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  // Get tax implications (simplified for Bangladesh context)
  static async getTaxAnalysis(userId: string) {
    const transactions = await InvestmentTransactionService.getTransactions(userId, {
      date_range: {
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
        end: new Date().toISOString().split('T')[0]
      }
    });

    const sellTransactions = transactions.filter(t => t.type === 'sell');
    const dividendTransactions = transactions.filter(t => t.type === 'dividend');

    const capital_gains = sellTransactions.reduce((sum, t) => {
      // Simplified capital gains calculation
      // In practice, this would require matching with buy transactions for proper cost basis
      return sum + (t.net_amount * 0.15); // Assume 15% gain
    }, 0);

    const dividend_income = dividendTransactions.reduce((sum, t) => sum + t.net_amount, 0);

    return {
      capital_gains,
      dividend_income,
      estimated_tax_liability: (capital_gains * 0.15) + (dividend_income * 0.20), // Simplified tax rates
      tax_saving_investments: 0, // Would calculate from specific investment types
      recommendations: [
        'Consider tax-saving mutual funds for Section 80C benefits',
        'Review capital gains timing for tax optimization',
        'Maintain investment records for accurate tax filing'
      ]
    };
  }
}

export default InvestmentAnalyticsService;