'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Zap,
  PieChart,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Target,
  Activity,
  DollarSign,
  RotateCcw
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useUserCurrency } from '@/lib/currency';
import { useTheme } from 'next-themes';

// Investment components
import { InvestmentDashboardStats } from '@/components/investments/InvestmentDashboardStats';
import { PortfolioCard } from '@/components/investments/PortfolioCard';
import { InvestmentCard } from '@/components/investments/InvestmentCard';
import { SIPTemplateCard } from '@/components/investments/SIPTemplateCard';
import { InvestmentTransactionList } from '@/components/investments/InvestmentTransactionList';
import { InvestmentChart } from '@/components/investments/InvestmentChart';
import { CreateInvestmentForm } from '@/components/investments/CreateInvestmentForm';
import { EditInvestmentForm } from '@/components/investments/EditInvestmentForm';
import { CreatePortfolioForm } from '@/components/investments/CreatePortfolioForm';
import { CreateSIPForm } from '@/components/investments/CreateSIPForm';
import { EditSIPForm } from '@/components/investments/EditSIPForm';

// Types
import { CreateInvestmentInput, Investment, UpdateInvestmentInput, InvestmentTemplate, InvestmentPortfolio } from '@/types/investments';

// Hooks
import { 
  useInvestmentDashboard, 
  useInvestmentOverview,
  useInvestmentDashboardStats 
} from '@/hooks/useInvestmentAnalytics';
import { useInvestmentPortfolios, useCreateInvestmentPortfolio, useUpdateInvestmentPortfolio, useDeleteInvestmentPortfolio } from '@/hooks/useInvestmentPortfolios';
import { useInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment } from '@/hooks/useInvestments';
import { useSIPTemplates, useCreateInvestmentTemplate, useUpdateInvestmentTemplate, useDeleteInvestmentTemplate } from '@/hooks/useInvestmentTemplates';
import { useInvestmentTransactions } from '@/hooks/useInvestmentTransactions';

export default function InvestmentDashboardPage() {
  const router = useRouter();
  const t = useTranslations('investments');
  const tCommon = useTranslations('common');
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState<'investment' | 'portfolio' | 'sip' | false>(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [editingSIPTemplate, setEditingSIPTemplate] = useState<InvestmentTemplate | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{type: 'investment' | 'sip' | 'portfolio' | null, item: any}>({type: null, item: null});
  const [refreshKey, setRefreshKey] = useState(0);
  const userCurrency = useUserCurrency();
  const { theme } = useTheme();

  // Optimized data hooks - use individual hooks only when needed to prevent multiple renders
  const dashboard = useInvestmentDashboard();
  
  // Use the new optimized overview hook for charts data
  const overview = useInvestmentOverview(userCurrency, '6m');
  
  console.log('🔥 INVESTMENTS: Overview data:', {
    hasData: overview.hasData,
    isEmpty: overview.isEmpty,
    performanceCount: overview.performance?.length || 0,
    allocationCount: overview.assetAllocation?.length || 0,
    trendCount: overview.monthlyTrend?.length || 0,
    isLoading: overview.isLoading
  });
  
  // Conditionally load data based on active tab to optimize performance  
  const portfoliosQuery = useInvestmentPortfolios();
  const investmentsQuery = useInvestments();
  const sipTemplatesQuery = useSIPTemplates();
  const transactionsQuery = useInvestmentTransactions();
  
  // Extract data and loading states
  const portfolios = portfoliosQuery.data || [];
  const investments = investmentsQuery.data || [];
  const sipTemplates = sipTemplatesQuery.data || [];
  const transactions = transactionsQuery.data || [];
  
  const portfoliosLoading = portfoliosQuery.isLoading;
  const investmentsLoading = investmentsQuery.isLoading;
  const sipsLoading = sipTemplatesQuery.isLoading;
  const transactionsLoading = transactionsQuery.isLoading;
  
  const refetchPortfolios = portfoliosQuery.refetch;
  const refetchInvestments = investmentsQuery.refetch;
  const refetchSIPs = sipTemplatesQuery.refetch;
  const refetchTransactions = transactionsQuery.refetch;
  
  // Memoize expensive computations to prevent unnecessary re-renders
  const memoizedPortfolios = useMemo(() => portfolios, [portfolios]);
  const memoizedInvestments = useMemo(() => investments, [investments]);
  const memoizedSipTemplates = useMemo(() => sipTemplates, [sipTemplates]);
  const memoizedTransactions = useMemo(() => transactions, [transactions]);
  
  const createPortfolioMutation = useCreateInvestmentPortfolio();
  const updatePortfolioMutation = useUpdateInvestmentPortfolio();
  const deletePortfolioMutation = useDeleteInvestmentPortfolio();
  const createInvestmentMutation = useCreateInvestment();
  const updateInvestmentMutation = useUpdateInvestment();
  const deleteInvestmentMutation = useDeleteInvestment();
  const createSIPMutation = useCreateInvestmentTemplate();
  const updateSIPMutation = useUpdateInvestmentTemplate();
  const deleteSIPMutation = useDeleteInvestmentTemplate();

  // Mock data for charts (replace with real data from hooks)
  // Real data from database functions (replacing mock data)
  console.log('✅ INVESTMENTS: Using real analytics data from database functions');

  // Mock dashboard stats
  // Get real dashboard stats from overview hook or fallback
  const dashboardStatsForDisplay = overview.dashboardStats || {
    total_portfolios: memoizedPortfolios?.length || 0,
    total_investments: memoizedInvestments?.length || 0,
    total_invested: 0,
    total_current_value: 0,
    total_gain_loss: 0,
    total_return_percentage: 0,
    dividend_income: 0,
    active_sips: memoizedSipTemplates?.filter(t => t.is_active).length || 0,
    monthly_sip_amount: memoizedSipTemplates
      ?.filter(t => t.is_active)
      .reduce((sum, t) => sum + t.amount_per_investment, 0) || 0,
    upcoming_executions: []
  };

  const handleRefresh = async () => {
    try {
      console.log('🔄 Refreshing all investment data...');
      setRefreshKey(prev => prev + 1);
      await Promise.all([
        refetchPortfolios(),
        refetchInvestments(),
        refetchSIPs(),
        refetchTransactions()
      ]);
      console.log('✅ All investment data refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh investment data:', error);
    }
  };

  const handleEditInvestment = (investment: Investment) => {
    setEditingInvestment(investment);
  };

  const handleDeleteInvestment = async (investment: Investment) => {
    try {
      console.log('Deleting investment:', investment.id, investment.name);
      await deleteInvestmentMutation.mutateAsync(investment.id);
      console.log('Investment deleted successfully');
      // Optionally show success message
    } catch (error) {
      console.error('Failed to delete investment:', error);
      // Optionally show error message
    }
  };

  // Portfolio handlers
  const handleViewPortfolio = (portfolio: InvestmentPortfolio) => {
    console.log('View portfolio:', portfolio);
    // Navigate to portfolio details or show modal
  };

  const handleEditPortfolio = (portfolio: InvestmentPortfolio) => {
    console.log('Edit portfolio:', portfolio);
    router.push(`/dashboard/investments/portfolios/edit/${portfolio.id}`);
  };

  const handleDeletePortfolio = async (portfolio: InvestmentPortfolio) => {
    try {
      console.log('Deleting portfolio:', portfolio.id, portfolio.name);
      await deletePortfolioMutation.mutateAsync(portfolio.id);
      console.log('Portfolio deleted successfully');
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
    }
  };

  const QuickActions = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex flex-wrap gap-3"
    >
      <Button
        onClick={() => setShowCreateForm('investment')}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t('dashboard.quickActions.newInvestment')}
      </Button>
      <Button 
        variant="outline" 
        className="hover:bg-white/70"
        onClick={() => setShowCreateForm('portfolio')}
      >
        <Plus className="h-4 w-4 mr-2" />
        {t('dashboard.quickActions.createPortfolio')}
      </Button>
      <Button 
        variant="outline" 
        className="hover:bg-white/70"
        onClick={() => {
          console.log('=== SIP BUTTON CLICKED ===');
          console.log('Current state BEFORE:', showCreateForm);
          setShowCreateForm('sip');
          console.log('State set to: sip');
          console.log('=========================');
        }}
      >
        <Zap className="h-4 w-4 mr-2" />
        {t('dashboard.quickActions.setupSip')}
      </Button>
      <Button 
        variant="ghost" 
        onClick={handleRefresh}
        disabled={portfoliosLoading || investmentsLoading || sipsLoading || transactionsLoading}
      >
        <RefreshCw className={cn(
          "h-4 w-4 mr-2 transition-transform duration-300",
          (portfoliosLoading || investmentsLoading || sipsLoading || transactionsLoading) && "animate-spin"
        )} />
        {t('dashboard.quickActions.refresh')}
      </Button>
      <Button variant="ghost">
        <Download className="h-4 w-4 mr-2" />
        {t('dashboard.quickActions.export')}
      </Button>
    </motion.div>
  );

  if (showCreateForm === 'investment') {
    return (
      <div className="container mx-auto px-4 py-8">
        <CreateInvestmentForm
          portfolios={memoizedPortfolios.map(p => ({ id: p.id, name: p.name, currency: p.currency }))}
          onSubmit={async (data) => {
            try {
              console.log('Submitting investment data:', data);
              
              // Validate required fields that are now part of the schema-compliant data
              if (!data.total_units || data.total_units <= 0) {
                throw new Error('Total units must be greater than 0');
              }
              if (!data.average_cost || data.average_cost <= 0) {
                throw new Error('Average cost must be greater than 0');
              }
              if (!data.current_price || data.current_price <= 0) {
                throw new Error('Current price must be greater than 0');
              }
              if (!data.purchase_date) {
                throw new Error('Purchase date is required');
              }

              // The form now sends properly formatted CreateInvestmentInput data
              // No transformation needed as the form handles it
              const investmentInput = data;
              
              console.log('Transformed investment input:', investmentInput);
              
              const result = await createInvestmentMutation.mutateAsync(investmentInput);
              console.log('Investment creation result:', result);
              setShowCreateForm(false);
            } catch (error: any) {
              console.error('Failed to create investment:', error);
              console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint
              });
            }
          }}
          onCancel={() => setShowCreateForm(false)}
          isLoading={createInvestmentMutation.isPending}
        />
      </div>
    );
  }

  if (showCreateForm === 'portfolio') {
    return (
      <div className="container mx-auto px-4 py-8">
        <CreatePortfolioForm
          onSubmit={async (data) => {
            try {
              console.log('Submitting portfolio data:', data);
              const result = await createPortfolioMutation.mutateAsync(data);
              console.log('Portfolio creation result:', result);
              setShowCreateForm(false);
            } catch (error: any) {
              console.error('Failed to create portfolio:', error);
              console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
                stack: error?.stack
              });
            }
          }}
          onCancel={() => setShowCreateForm(false)}
          isLoading={createPortfolioMutation.isPending}
        />
      </div>
    );
  }

  // FRESH START: Debug what's happening with SIP form
  console.log('=== COMPONENT RENDER ===');
  console.log('showCreateForm state:', showCreateForm);
  console.log('portfolios count:', portfolios.length);
  console.log('======================');
  
  if (showCreateForm === 'sip') {
    console.log('🚨 SIP FORM SHOULD RENDER NOW!');
    console.log('Portfolios data:', portfolios.map(p => ({id: p.id, name: p.name})));
    console.log('createSIPMutation status:', createSIPMutation.isPending);
    console.log('🚨 About to return SIP form component...');
    
    if (memoizedPortfolios.length === 0) {
      console.log('No portfolios available for SIP creation');
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2>{t('forms.investment.noPortfolioAvailable')}</h2>
            <p>{t('forms.investment.createPortfolioFirst')}</p>
            <button onClick={() => setShowCreateForm('portfolio')}>{t('portfolios.createPortfolio')}</button>
            <button onClick={() => setShowCreateForm(false)}>{tCommon('back')}</button>
          </div>
        </div>
      );
    }

    try {
      return (
        <div className="container mx-auto px-4 py-8">
          <CreateSIPForm
            portfolios={memoizedPortfolios.map(p => ({ id: p.id, name: p.name, currency: p.currency }))}
            onSubmit={async (data) => {
              try {
                console.log('Main Dashboard: Submitting SIP data:', data);
                const result = await createSIPMutation.mutateAsync(data);
                console.log('Main Dashboard: SIP creation result:', result);
                setShowCreateForm(false);
              } catch (error: any) {
                console.error('Main Dashboard: Failed to create SIP:', error);
                console.error('Main Dashboard: Error details:', {
                  message: error?.message,
                  code: error?.code,
                  details: error?.details,
                  hint: error?.hint
                });
              }
            }}
            onCancel={() => setShowCreateForm(false)}
            isLoading={createSIPMutation.isPending}
          />
        </div>
      );
    } catch (error) {
      console.error('Error rendering CreateSIPForm:', error);
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2>{t('forms.sip.loadFailed')}</h2>
            <p>{t('forms.sip.loadFailed')}: {String(error)}</p>
            <button onClick={() => setShowCreateForm(false)}>{tCommon('back')}</button>
          </div>
        </div>
      );
    }
  }

  // Edit Investment Form
  if (editingInvestment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EditInvestmentForm
          investment={editingInvestment}
          onSubmit={async (id, updates) => {
            try {
              console.log('Updating investment:', id, updates);
              await updateInvestmentMutation.mutateAsync({ id, updates });
              console.log('Investment updated successfully');
              setEditingInvestment(null);
            } catch (error) {
              console.error('Failed to update investment:', error);
            }
          }}
          onCancel={() => setEditingInvestment(null)}
          isLoading={updateInvestmentMutation.isPending}
        />
      </div>
    );
  }


  // SIP edit is now handled by dedicated page route
  // No modal needed anymore

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className={cn(
            "text-3xl font-bold mb-2",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>{t('dashboard.title')}</h1>
          <p className={cn(
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          )}>{t('dashboard.subtitle')}</p>
        </div>
        <QuickActions />
      </motion.div>

      {/* Dashboard Stats with Real Data */}
      <InvestmentDashboardStats
        stats={dashboardStatsForDisplay}
        currency={userCurrency}
        isLoading={overview.isLoadingDashboard || dashboard.isLoading}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <TabsList className={cn(
            "grid w-full grid-cols-5 backdrop-blur-sm border",
            theme === 'dark'
              ? 'bg-gray-800/50 border-gray-700'
              : 'bg-white/50 border-gray-200'
          )}>
            <TabsTrigger 
              value="overview" 
              className={cn(
                "transition-colors",
                theme === 'dark'
                  ? 'data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:text-white'
                  : 'data-[state=active]:bg-white data-[state=active]:shadow-md'
              )}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('overview.title')}
            </TabsTrigger>
            <TabsTrigger 
              value="portfolios" 
              className={cn(
                "transition-colors",
                theme === 'dark'
                  ? 'data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:text-white'
                  : 'data-[state=active]:bg-white data-[state=active]:shadow-md'
              )}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              {t('portfolios.title')}
            </TabsTrigger>
            <TabsTrigger 
              value="investments" 
              className={cn(
                "transition-colors",
                theme === 'dark'
                  ? 'data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:text-white'
                  : 'data-[state=active]:bg-white data-[state=active]:shadow-md'
              )}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('individual.title')}
            </TabsTrigger>
            <TabsTrigger 
              value="sips" 
              className={cn(
                "transition-colors",
                theme === 'dark'
                  ? 'data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:text-white'
                  : 'data-[state=active]:bg-white data-[state=active]:shadow-md'
              )}
            >
              <Zap className="h-4 w-4 mr-2" />
              {t('sips.title')}
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className={cn(
                "transition-colors",
                theme === 'dark'
                  ? 'data-[state=active]:bg-gray-700 data-[state=active]:shadow-md data-[state=active]:text-white'
                  : 'data-[state=active]:bg-white data-[state=active]:shadow-md'
              )}
            >
              <Activity className="h-4 w-4 mr-2" />
              {t('transactions.title')}
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Overview Tab with Real Database-Driven Charts */}
        <TabsContent value="overview" className="space-y-8 mt-8">
          {overview.isLoading ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={cn(
                  "h-[350px] animate-pulse rounded-lg",
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                )} />
                <div className={cn(
                  "h-[350px] animate-pulse rounded-lg", 
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                )} />
              </div>
              <div className={cn(
                "h-[300px] animate-pulse rounded-lg",
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              )} />
            </div>
          ) : overview.hasErrors ? (
            <div className="text-center py-12">
              <div className={cn(
                "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              )}>
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className={cn(
                "text-lg font-medium mb-2",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>{t('overview.failedToLoad')}</h3>
              <p className={cn(
                "mb-4",
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>{t('overview.errorMessage')}</p>
              <Button onClick={() => overview.refetchAll()} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('overview.retry')}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Performance Chart with Real Data */}
                <InvestmentChart
                  chartType="performance"
                  performanceData={overview.performance}
                  currency={userCurrency}
                  height={350}
                  isLoading={overview.isLoadingAnalytics}
                />
                
                {/* Asset Allocation Chart with Real Data */}
                <InvestmentChart
                  chartType="allocation"
                  assetAllocation={overview.assetAllocation}
                  currency={userCurrency}
                  height={350}
                  isLoading={overview.isLoadingAnalytics}
                />
              </div>

              {/* Monthly Trend with Real Data */}
              <InvestmentChart
                chartType="trend"
                monthlyTrend={overview.monthlyTrend}
                currency={userCurrency}
                height={300}
                isLoading={overview.isLoadingAnalytics}
              />
            </div>
          )}

          {/* Recent Activity */}
          <Card className={cn(
            "border-0 backdrop-blur-md shadow-lg",
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-800 via-gray-800/95 to-gray-900/90'
              : 'bg-gradient-to-br from-white via-white/95 to-white/90'
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "flex items-center space-x-2",
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                <Activity className="h-5 w-5" />
                <span>{t('overview.recentActivity')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {memoizedTransactions.length > 0 ? (
                  memoizedTransactions.slice(0, 5).map((transaction, index) => {
                    const transactionType = transaction.transaction_type || transaction.type || 'buy';
                    const isBuy = transactionType === 'buy';
                    const isDividend = transactionType === 'dividend';
                    const isSell = transactionType === 'sell';
                    const displayAmount = transaction.net_amount || transaction.total_amount || transaction.amount || 0;
                    const investmentName = transaction.investment_name || 'Investment Transaction';
                    const transactionDate = transaction.transaction_date || transaction.created_at;
                    
                    return (
                      <motion.div
                        key={transaction.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:shadow-md",
                          theme === 'dark' 
                            ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70' 
                            : 'bg-gray-50/50 border-gray-100/50 hover:bg-white/70'
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
                            isDividend 
                              ? theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
                              : isBuy
                              ? theme === 'dark' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
                              : theme === 'dark' ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'
                          )}>
                            {isDividend ? (
                              <DollarSign className="h-4 w-4" />
                            ) : isBuy ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className={cn(
                              "font-medium text-sm",
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            )}>{investmentName}</p>
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-2">
                                <p className={cn(
                                  "text-xs",
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                  {transactionDate ? new Date(transactionDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric', 
                                    year: 'numeric'
                                  }) : 'No date'}
                                </p>
                                {transaction.portfolio_name && (
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs px-2 py-0.5",
                                      theme === 'dark' 
                                        ? 'bg-purple-900/30 text-purple-300 border-purple-600' 
                                        : 'bg-purple-100 text-purple-700 border-purple-300'
                                    )}
                                  >
                                    {transaction.portfolio_name}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {transaction.units && !isNaN(transaction.units) && (
                                  <p className={cn(
                                    "text-xs",
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  )}>
                                    {Number(transaction.units).toFixed(2)} units
                                  </p>
                                )}
                                {transaction.price_per_unit && !isNaN(transaction.price_per_unit) && (
                                  <p className={cn(
                                    "text-xs",
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  )}>
                                    @ {formatCurrency(transaction.price_per_unit, transaction.currency || userCurrency)}
                                  </p>
                                )}
                                {transaction.platform && (
                                  <p className={cn(
                                    "text-xs px-2 py-0.5 rounded",
                                    theme === 'dark' 
                                      ? 'bg-gray-700 text-gray-300' 
                                      : 'bg-gray-200 text-gray-600'
                                  )}>
                                    {transaction.platform}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-semibold text-sm",
                            isDividend 
                              ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                              : isBuy
                              ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                              : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                          )}>
                            {formatCurrency(Math.abs(displayAmount), transaction.currency || userCurrency)}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs border-current",
                              isDividend 
                                ? "text-blue-600 border-blue-200"
                                : isBuy
                                ? "text-green-600 border-green-200"
                                : "text-red-600 border-red-200"
                            )}
                          >
                            {transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className={cn(
                    "text-center py-8",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )}>
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('overview.noRecentTransactions')}</p>
                    <p className="text-xs mt-1">{t('overview.startInvesting')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolios Tab */}
        <TabsContent value="portfolios" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {memoizedPortfolios.map((portfolio, index) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PortfolioCard
                  portfolio={portfolio}
                  onView={handleViewPortfolio}
                  onEdit={handleEditPortfolio}
                  onDelete={(portfolio) => {
                    console.log('Delete triggered for portfolio:', portfolio.name);
                    setDeleteConfirmation({type: 'portfolio', item: portfolio});
                  }}
                />
              </motion.div>
            ))}
            
            {memoizedPortfolios.length === 0 && !portfoliosLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <Briefcase className={cn(
                  "h-12 w-12 mx-auto mb-4",
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )} />
                <h3 className={cn(
                  "text-lg font-medium mb-2",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>{t('portfolios.noPortfolios')}</h3>
                <p className={cn(
                  "mb-4",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>{t('portfolios.createFirst')}</p>
                <Button 
                  onClick={() => setShowCreateForm('portfolio')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('portfolios.createPortfolio')}
                </Button>
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {memoizedInvestments.map((investment, index) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <InvestmentCard
                  investment={investment}
                  onView={(i) => console.log('View investment:', i)}
                  onEdit={handleEditInvestment}
                  onDelete={(investment) => {
                    console.log('Delete triggered for:', investment.name);
                    setDeleteConfirmation({type: 'investment', item: investment});
                  }}
                  onConfirmDelete={handleDeleteInvestment}
                  isDeleting={deleteInvestmentMutation.isPending}
                />
              </motion.div>
            ))}
            
            {memoizedInvestments.length === 0 && !investmentsLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <TrendingUp className={cn(
                  "h-12 w-12 mx-auto mb-4",
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )} />
                <h3 className={cn(
                  "text-lg font-medium mb-2",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>{t('individual.noInvestments')}</h3>
                <p className={cn(
                  "mb-4",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>{t('individual.startJourney')}</p>
                <Button 
                  onClick={() => setShowCreateForm('investment')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('individual.addInvestment')}
                </Button>
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* SIPs Tab */}
        <TabsContent value="sips" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {memoizedSipTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <SIPTemplateCard
                  template={template}
                  onView={(t) => {
                    console.log('View SIP:', t);
                    // Navigate to SIP details view
                  }}
                  onEdit={(t) => {
                    console.log('Edit SIP:', t);
                    router.push(`/dashboard/investments/sips/edit/${t.id}`);
                  }}
                  onDelete={(t) => {
                    console.log('Delete SIP:', t);
                    setDeleteConfirmation({type: 'sip', item: t});
                  }}
                  onToggleStatus={async (t) => {
                    try {
                      console.log('Toggle SIP status:', t);
                      await updateSIPMutation.mutateAsync({ 
                        id: t.id, 
                        updates: { is_active: !t.is_active } 
                      });
                    } catch (error: any) {
                      console.error('Failed to toggle SIP status:', error);
                    }
                  }}
                />
              </motion.div>
            ))}
            
            {memoizedSipTemplates.length === 0 && !sipsLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <Zap className={cn(
                  "h-12 w-12 mx-auto mb-4",
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )} />
                <h3 className={cn(
                  "text-lg font-medium mb-2",
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>{t('sips.noSips')}</h3>
                <p className={cn(
                  "mb-4",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>{t('sips.setupPlans')}</p>
                <Button 
                  onClick={() => setShowCreateForm('sip')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {t('sips.createSip')}
                </Button>
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-8">
          <InvestmentTransactionList
            transactions={memoizedTransactions}
            onView={(t) => console.log('View transaction:', t)}
            onEdit={(t) => console.log('Edit transaction:', t)}
            onDelete={(t) => console.log('Delete transaction:', t)}
            isLoading={transactionsLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.type && (
        <AlertDialog
          open={deleteConfirmation.type !== null}
          onOpenChange={() => setDeleteConfirmation({type: null, item: null})}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteConfirmation.type === 'sip' 
                  ? (deleteConfirmation.item?.is_active ? t('sips.pauseSip') + '?' : t('sips.deleteSip') + '?')
                  : deleteConfirmation.type === 'portfolio'
                  ? t('portfolios.deletePortfolio') + '?'
                  : t('individual.deleteInvestment') + '?'
                }
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteConfirmation.type === 'sip'
                  ? deleteConfirmation.item?.is_active 
                    ? t('sips.confirmPause')
                    : t('sips.confirmDelete')
                  : deleteConfirmation.type === 'portfolio'
                  ? t('portfolios.confirmDelete')
                  : t('individual.confirmDelete')
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  try {
                    if (deleteConfirmation.type === 'sip') {
                      // For SIP, we pause it instead of deleting
                      await updateSIPMutation.mutateAsync({ 
                        id: deleteConfirmation.item.id, 
                        updates: { is_active: false } 
                      });
                      console.log('SIP template paused successfully');
                    } else if (deleteConfirmation.type === 'investment') {
                      await deleteInvestmentMutation.mutateAsync(deleteConfirmation.item.id);
                      console.log('Investment deleted successfully');
                    } else if (deleteConfirmation.type === 'portfolio') {
                      await deletePortfolioMutation.mutateAsync(deleteConfirmation.item.id);
                      console.log('Portfolio deleted successfully');
                    }
                    setDeleteConfirmation({type: null, item: null});
                  } catch (error) {
                    console.error(`Failed to ${deleteConfirmation.type === 'sip' ? 'pause' : 'delete'} ${deleteConfirmation.type}:`, error);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
                disabled={updateSIPMutation.isPending || deleteInvestmentMutation.isPending || deletePortfolioMutation.isPending}
              >
                {updateSIPMutation.isPending || deleteInvestmentMutation.isPending || deletePortfolioMutation.isPending
                  ? (deleteConfirmation.type === 'sip' ? t('sips.pauseSip') + '...' : tCommon('delete') + '...') 
                  : (deleteConfirmation.type === 'sip' ? t('sips.pauseSip') : tCommon('delete'))
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}