import { useQuery } from '@tanstack/react-query';
import { 
  InvestmentAnalytics,
  InvestmentDashboardStats
} from '@/types/investments';
import { InvestmentAnalyticsService } from '@/lib/services/investment-analytics';
import { useAuth } from '@/hooks/useAuth';

// Query keys for investment analytics
export const investmentAnalyticsKeys = {
  all: ['investmentAnalytics'] as const,
  dashboard: (userId: string) => [...investmentAnalyticsKeys.all, 'dashboard', userId] as const,
  analytics: (userId: string) => [...investmentAnalyticsKeys.all, 'analytics', userId] as const,
  monthlyTrend: (userId: string, months: number) => 
    [...investmentAnalyticsKeys.all, 'monthlyTrend', userId, months] as const,
  sipAnalysis: (userId: string) => [...investmentAnalyticsKeys.all, 'sipAnalysis', userId] as const,
  performanceMetrics: (userId: string) => 
    [...investmentAnalyticsKeys.all, 'performanceMetrics', userId] as const,
  comparison: (userId: string, investmentIds: string[]) => 
    [...investmentAnalyticsKeys.all, 'comparison', userId, investmentIds] as const,
  riskAnalysis: (userId: string) => [...investmentAnalyticsKeys.all, 'riskAnalysis', userId] as const,
  taxAnalysis: (userId: string) => [...investmentAnalyticsKeys.all, 'taxAnalysis', userId] as const,
};

// Hook to get comprehensive dashboard statistics
export function useInvestmentDashboardStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentAnalyticsKeys.dashboard(user?.id || ''),
    queryFn: () => InvestmentAnalyticsService.getDashboardStats(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for live data
  });
}

// Hook to get comprehensive investment analytics
export function useInvestmentAnalytics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentAnalyticsKeys.analytics(user?.id || ''),
    queryFn: () => InvestmentAnalyticsService.getInvestmentAnalytics(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get monthly investment trend data
export function useMonthlyInvestmentTrend(months: number = 12) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentAnalyticsKeys.monthlyTrend(user?.id || '', months),
    queryFn: () => InvestmentAnalyticsService.getMonthlyInvestmentTrend(user?.id || '', months),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to get SIP analysis
export function useSIPAnalysis() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentAnalyticsKeys.sipAnalysis(user?.id || ''),
    queryFn: () => InvestmentAnalyticsService.getSIPAnalysis(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get performance metrics
export function usePerformanceMetrics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentAnalyticsKeys.performanceMetrics(user?.id || ''),
    queryFn: () => InvestmentAnalyticsService.getPerformanceMetrics(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get investment performance comparison
export function useInvestmentComparison(investmentIds: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentAnalyticsKeys.comparison(user?.id || '', investmentIds),
    queryFn: () => InvestmentAnalyticsService.getInvestmentComparison(user?.id || '', investmentIds),
    enabled: !!user?.id && investmentIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to get risk analysis
export function useRiskAnalysis() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentAnalyticsKeys.riskAnalysis(user?.id || ''),
    queryFn: () => InvestmentAnalyticsService.getRiskAnalysis(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to get tax analysis
export function useTaxAnalysis() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: investmentAnalyticsKeys.taxAnalysis(user?.id || ''),
    queryFn: () => InvestmentAnalyticsService.getTaxAnalysis(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Combined hook for investment dashboard with all necessary data
export function useInvestmentDashboard() {
  const dashboardStats = useInvestmentDashboardStats();
  const analytics = useInvestmentAnalytics();
  const monthlyTrend = useMonthlyInvestmentTrend(6); // Last 6 months
  const performanceMetrics = usePerformanceMetrics();
  const sipAnalysis = useSIPAnalysis();

  const dashboardData = {
    // Basic stats
    totalPortfolios: dashboardStats.data?.total_portfolios || 0,
    totalInvestments: dashboardStats.data?.total_investments || 0,
    totalInvested: dashboardStats.data?.total_invested || 0,
    totalCurrentValue: dashboardStats.data?.total_current_value || 0,
    totalGainLoss: dashboardStats.data?.total_gain_loss || 0,
    totalReturnPercentage: dashboardStats.data?.total_return_percentage || 0,
    dividendIncome: dashboardStats.data?.dividend_income || 0,
    
    // SIP data
    activeSIPs: dashboardStats.data?.active_sips || 0,
    monthlySIPAmount: dashboardStats.data?.monthly_sip_amount || 0,
    
    // Performance insights
    topPerformer: dashboardStats.data?.top_performing_investment,
    worstPerformer: dashboardStats.data?.worst_performing_investment,
    upcomingExecutions: dashboardStats.data?.upcoming_executions || [],
    
    // Charts data
    monthlyTrend: monthlyTrend.data || [],
    assetAllocation: analytics.data?.asset_allocation || [],
    portfolioPerformance: analytics.data?.portfolio_performance || [],
    
    // SIP insights
    sipAnalysis: sipAnalysis.data,
    
    // Performance metrics
    performanceMetrics: performanceMetrics.data,
    
    // Loading states
    isLoading: dashboardStats.isLoading || analytics.isLoading || monthlyTrend.isLoading,
    error: dashboardStats.error || analytics.error || monthlyTrend.error,
    
    // Individual query states for granular loading
    loadingStates: {
      stats: dashboardStats.isLoading,
      analytics: analytics.isLoading,
      trend: monthlyTrend.isLoading,
      performance: performanceMetrics.isLoading,
      sip: sipAnalysis.isLoading,
    }
  };

  return dashboardData;
}

// Hook for portfolio analytics page
export function usePortfolioAnalytics() {
  const analytics = useInvestmentAnalytics();
  const riskAnalysis = useRiskAnalysis();
  const monthlyTrend = useMonthlyInvestmentTrend(12);

  return {
    portfolioPerformance: analytics.data?.portfolio_performance || [],
    assetAllocation: analytics.data?.asset_allocation || [],
    monthlyTrend: monthlyTrend.data || [],
    riskAnalysis: riskAnalysis.data,
    isLoading: analytics.isLoading || riskAnalysis.isLoading || monthlyTrend.isLoading,
    error: analytics.error || riskAnalysis.error || monthlyTrend.error
  };
}

// Hook for SIP analytics page
export function useSIPAnalyticsPage() {
  const sipAnalysis = useSIPAnalysis();
  const monthlyTrend = useMonthlyInvestmentTrend(12);
  const analytics = useInvestmentAnalytics();

  const sipData = {
    analysis: sipAnalysis.data,
    monthlyTrend: monthlyTrend.data || [],
    sipPerformance: analytics.data?.sip_analysis,
    isLoading: sipAnalysis.isLoading || monthlyTrend.isLoading || analytics.isLoading,
    error: sipAnalysis.error || monthlyTrend.error || analytics.error
  };

  return sipData;
}

// Hook for performance comparison page
export function usePerformanceComparison(investmentIds: string[]) {
  const comparison = useInvestmentComparison(investmentIds);
  const performanceMetrics = usePerformanceMetrics();

  return {
    comparisonData: comparison.data || [],
    performanceMetrics: performanceMetrics.data,
    isLoading: comparison.isLoading || performanceMetrics.isLoading,
    error: comparison.error || performanceMetrics.error,
    hasData: !!comparison.data && comparison.data.length > 0
  };
}

// Hook for tax planning page
export function useTaxPlanning() {
  const taxAnalysis = useTaxAnalysis();
  const analytics = useInvestmentAnalytics();

  return {
    taxAnalysis: taxAnalysis.data,
    capitalGains: taxAnalysis.data?.capital_gains || 0,
    dividendIncome: taxAnalysis.data?.dividend_income || 0,
    estimatedTaxLiability: taxAnalysis.data?.estimated_tax_liability || 0,
    recommendations: taxAnalysis.data?.recommendations || [],
    totalCurrentValue: analytics.data?.portfolio_performance?.reduce(
      (sum, p) => sum + p.current_value, 0
    ) || 0,
    isLoading: taxAnalysis.isLoading || analytics.isLoading,
    error: taxAnalysis.error || analytics.error
  };
}

// Hook for risk management page
export function useRiskManagement() {
  const riskAnalysis = useRiskAnalysis();
  const analytics = useInvestmentAnalytics();

  return {
    riskAnalysis: riskAnalysis.data,
    assetAllocation: analytics.data?.asset_allocation || [],
    portfolioRisk: riskAnalysis.data?.portfolio_risk_distribution || {},
    assetRiskScore: riskAnalysis.data?.asset_risk_score || 0,
    diversificationScore: riskAnalysis.data?.diversification_score || 0,
    recommendations: riskAnalysis.data?.recommendations || [],
    isLoading: riskAnalysis.isLoading || analytics.isLoading,
    error: riskAnalysis.error || analytics.error
  };
}

// Utility hook for formatted analytics data
export function useFormattedAnalytics() {
  const dashboard = useInvestmentDashboard();
  
  // Format currency values
  const formatCurrency = (amount: number, currency: string = 'BDT') => {
    const symbols: Record<string, string> = {
      BDT: '৳',
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹'
    };
    
    return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
  };

  // Format percentage
  const formatPercentage = (percentage: number, decimals: number = 2) => {
    return `${percentage.toFixed(decimals)}%`;
  };

  // Calculate performance indicators
  const getPerformanceIndicator = (percentage: number) => {
    if (percentage > 10) return { status: 'excellent', color: '#10B981' };
    if (percentage > 5) return { status: 'good', color: '#3B82F6' };
    if (percentage > 0) return { status: 'positive', color: '#6B7280' };
    if (percentage > -5) return { status: 'slight-loss', color: '#F59E0B' };
    return { status: 'loss', color: '#EF4444' };
  };

  return {
    ...dashboard,
    formatCurrency,
    formatPercentage,
    getPerformanceIndicator,
    formattedTotalInvested: formatCurrency(dashboard.totalInvested),
    formattedCurrentValue: formatCurrency(dashboard.totalCurrentValue),
    formattedGainLoss: formatCurrency(dashboard.totalGainLoss),
    formattedReturnPercentage: formatPercentage(dashboard.totalReturnPercentage),
    performanceIndicator: getPerformanceIndicator(dashboard.totalReturnPercentage)
  };
}