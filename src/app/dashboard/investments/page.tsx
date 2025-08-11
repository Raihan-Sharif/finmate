'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
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
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { CreateInvestmentInput, Investment, UpdateInvestmentInput, InvestmentTemplate } from '@/types/investments';

// Hooks
import { useInvestmentDashboard } from '@/hooks/useInvestmentAnalytics';
import { useInvestmentPortfolios, useCreateInvestmentPortfolio } from '@/hooks/useInvestmentPortfolios';
import { useInvestments, useCreateInvestment, useUpdateInvestment, useDeleteInvestment } from '@/hooks/useInvestments';
import { useSIPTemplates, useCreateInvestmentTemplate, useUpdateInvestmentTemplate, useDeleteInvestmentTemplate } from '@/hooks/useInvestmentTemplates';
import { useInvestmentTransactions } from '@/hooks/useInvestmentTransactions';

export default function InvestmentDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState<'investment' | 'portfolio' | 'sip' | false>(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [editingSIPTemplate, setEditingSIPTemplate] = useState<InvestmentTemplate | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{type: 'investment' | 'sip' | null, item: any}>({type: null, item: null});
  const [refreshKey, setRefreshKey] = useState(0);
  const userCurrency = useUserCurrency();
  const { theme } = useTheme();

  // Data hooks
  const dashboard = useInvestmentDashboard();
  const { data: portfolios = [], isLoading: portfoliosLoading, refetch: refetchPortfolios } = useInvestmentPortfolios();
  const { data: investments = [], isLoading: investmentsLoading, refetch: refetchInvestments } = useInvestments();
  const { data: sipTemplates = [], isLoading: sipsLoading, refetch: refetchSIPs } = useSIPTemplates();
  const { data: transactions = [], isLoading: transactionsLoading, refetch: refetchTransactions } = useInvestmentTransactions();
  const createPortfolioMutation = useCreateInvestmentPortfolio();
  const createInvestmentMutation = useCreateInvestment();
  const updateInvestmentMutation = useUpdateInvestment();
  const deleteInvestmentMutation = useDeleteInvestment();
  const createSIPMutation = useCreateInvestmentTemplate();
  const updateSIPMutation = useUpdateInvestmentTemplate();
  const deleteSIPMutation = useDeleteInvestmentTemplate();

  // Mock data for charts (replace with real data from hooks)
  const mockPerformanceData = [
    { date: '2024-01', value: 50000, invested: 45000, gain_loss: 5000 },
    { date: '2024-02', value: 52000, invested: 47000, gain_loss: 5000 },
    { date: '2024-03', value: 48000, invested: 49000, gain_loss: -1000 },
    { date: '2024-04', value: 55000, invested: 51000, gain_loss: 4000 },
    { date: '2024-05', value: 58000, invested: 53000, gain_loss: 5000 },
    { date: '2024-06', value: 62000, invested: 55000, gain_loss: 7000 }
  ];

  const mockAssetAllocation = [
    { name: 'Stocks', value: 35000, percentage: 56.5, color: '#3B82F6', type: 'equity' },
    { name: 'Bonds', value: 15000, percentage: 24.2, color: '#10B981', type: 'fixed_income' },
    { name: 'Real Estate', value: 8000, percentage: 12.9, color: '#F59E0B', type: 'real_estate' },
    { name: 'Gold', value: 4000, percentage: 6.4, color: '#EF4444', type: 'commodity' }
  ];

  const mockMonthlyTrend = [
    { month: 'Jan', invested: 45000, current_value: 50000, gain_loss: 5000, return_percentage: 11.1 },
    { month: 'Feb', invested: 47000, current_value: 52000, gain_loss: 5000, return_percentage: 10.6 },
    { month: 'Mar', invested: 49000, current_value: 48000, gain_loss: -1000, return_percentage: -2.0 },
    { month: 'Apr', invested: 51000, current_value: 55000, gain_loss: 4000, return_percentage: 7.8 },
    { month: 'May', invested: 53000, current_value: 58000, gain_loss: 5000, return_percentage: 9.4 },
    { month: 'Jun', invested: 55000, current_value: 62000, gain_loss: 7000, return_percentage: 12.7 }
  ];

  // Mock dashboard stats
  const mockDashboardStats = {
    total_portfolios: 3,
    total_investments: 8,
    total_invested: 55000,
    total_current_value: 62000,
    total_gain_loss: 7000,
    total_return_percentage: 12.73,
    dividend_income: 2500,
    active_sips: 4,
    monthly_sip_amount: 8000,
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
        New Investment
      </Button>
      <Button 
        variant="outline" 
        className="hover:bg-white/70"
        onClick={() => setShowCreateForm('portfolio')}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Portfolio
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
        Setup SIP
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
        Refresh
      </Button>
      <Button variant="ghost">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </motion.div>
  );

  if (showCreateForm === 'investment') {
    return (
      <div className="container mx-auto px-4 py-8">
        <CreateInvestmentForm
          portfolios={portfolios.map(p => ({ id: p.id, name: p.name, currency: p.currency }))}
          onSubmit={async (data) => {
            try {
              console.log('Submitting investment data:', data);
              
              // Validate required fields
              if (!data.initial_amount || data.initial_amount <= 0) {
                throw new Error('Initial amount must be greater than 0');
              }
              if (!data.current_price || data.current_price <= 0) {
                throw new Error('Current price must be greater than 0');
              }

              // Transform CreateInvestmentRequest to CreateInvestmentInput
              const investmentInput: CreateInvestmentInput = {
                portfolio_id: data.portfolio_id,
                name: data.name,
                type: data.type,
                total_units: Number((data.initial_amount / data.current_price).toFixed(4)), // Calculate units from amount and price
                average_cost: Number(data.current_price.toFixed(2)),
                current_price: Number(data.current_price.toFixed(2)),
                currency: data.currency || 'BDT',
                purchase_date: new Date().toISOString().split('T')[0]!, // Today's date
                // Optional fields with defaults
                symbol: data.symbol || '',
                tags: data.tags || [],
                notes: data.notes || '',
                // Platform & Account Details
                ...(data.platform && { platform: data.platform }),
                ...(data.account_number && { account_number: data.account_number }),
                ...(data.folio_number && { folio_number: data.folio_number }),
                ...(data.exchange && { exchange: data.exchange }),
                // Investment Specific Details  
                ...(data.maturity_date && { maturity_date: data.maturity_date }),
                ...(data.interest_rate && { interest_rate: data.interest_rate }),
                // Target Information
                ...(data.target_date && { maturity_date: data.target_date }),
                ...(data.target_amount && { metadata: { target_amount: data.target_amount } })
              };
              
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
    
    if (portfolios.length === 0) {
      console.log('No portfolios available for SIP creation');
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2>No Portfolios Available</h2>
            <p>Please create a portfolio first before setting up a SIP.</p>
            <button onClick={() => setShowCreateForm('portfolio')}>Create Portfolio</button>
            <button onClick={() => setShowCreateForm(false)}>Go Back</button>
          </div>
        </div>
      );
    }

    try {
      return (
        <div className="container mx-auto px-4 py-8">
          <CreateSIPForm
            portfolios={portfolios.map(p => ({ id: p.id, name: p.name, currency: p.currency }))}
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
            <h2>Error Loading SIP Form</h2>
            <p>There was an error loading the SIP creation form: {String(error)}</p>
            <button onClick={() => setShowCreateForm(false)}>Go Back</button>
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

  // Show edit SIP form if editing a SIP template
  if (editingSIPTemplate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EditSIPForm
          template={editingSIPTemplate}
          portfolios={portfolios.map(p => ({ id: p.id, name: p.name, currency: p.currency }))}
          onSubmit={async (data) => {
            try {
              console.log('Updating SIP template:', editingSIPTemplate.id, data);
              await updateSIPMutation.mutateAsync({ 
                id: editingSIPTemplate.id, 
                updates: data 
              });
              console.log('SIP template updated successfully');
              setEditingSIPTemplate(null);
            } catch (error) {
              console.error('Failed to update SIP template:', error);
            }
          }}
          onCancel={() => setEditingSIPTemplate(null)}
          isLoading={updateSIPMutation.isPending}
        />
      </div>
    );
  }

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
          )}>Investment Dashboard</h1>
          <p className={cn(
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          )}>Track and manage your investment portfolio</p>
        </div>
        <QuickActions />
      </motion.div>

      {/* Dashboard Stats */}
      <InvestmentDashboardStats
        stats={mockDashboardStats}
        currency={userCurrency}
        isLoading={dashboard.isLoading}
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
              Overview
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
              Portfolios
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
              Investments
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
              SIPs
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
              Transactions
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Chart */}
            <InvestmentChart
              chartType="performance"
              performanceData={mockPerformanceData}
              currency={userCurrency}
              height={350}
            />
            
            {/* Asset Allocation Chart */}
            <InvestmentChart
              chartType="allocation"
              assetAllocation={mockAssetAllocation}
              currency={userCurrency}
              height={350}
            />
          </div>

          {/* Monthly Trend */}
          <InvestmentChart
            chartType="trend"
            monthlyTrend={mockMonthlyTrend}
            currency={userCurrency}
            height={300}
          />

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
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50/50'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                      )}>
                        <TrendingUp className={cn(
                          "h-4 w-4",
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        )} />
                      </div>
                      <div>
                        <p className={cn(
                          "font-medium",
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>{transaction.investment_name}</p>
                        <p className={cn(
                          "text-sm",
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        )}>
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-semibold",
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      )}>
                        +{transaction.amount} {transaction.currency}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.transaction_type}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolios Tab */}
        <TabsContent value="portfolios" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {portfolios.map((portfolio, index) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PortfolioCard
                  portfolio={portfolio}
                  onView={(p) => console.log('View portfolio:', p)}
                  onEdit={(p) => console.log('Edit portfolio:', p)}
                  onDelete={(p) => console.log('Delete portfolio:', p)}
                />
              </motion.div>
            ))}
            
            {portfolios.length === 0 && !portfoliosLoading && (
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
                )}>No portfolios yet</h3>
                <p className={cn(
                  "mb-4",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>Create your first investment portfolio</p>
                <Button 
                  onClick={() => setShowCreateForm('portfolio')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Portfolio
                </Button>
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {investments.map((investment, index) => (
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
            
            {investments.length === 0 && !investmentsLoading && (
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
                )}>No investments yet</h3>
                <p className={cn(
                  "mb-4",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>Start your investment journey</p>
                <Button 
                  onClick={() => setShowCreateForm('investment')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Investment
                </Button>
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* SIPs Tab */}
        <TabsContent value="sips" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sipTemplates.map((template, index) => (
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
                    setEditingSIPTemplate(t);
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
            
            {sipTemplates.length === 0 && !sipsLoading && (
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
                )}>No SIP plans yet</h3>
                <p className={cn(
                  "mb-4",
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>Set up systematic investment plans</p>
                <Button 
                  onClick={() => setShowCreateForm('sip')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Create SIP
                </Button>
              </motion.div>
            )}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-8">
          <InvestmentTransactionList
            transactions={transactions}
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
                  ? (deleteConfirmation.item?.is_active ? 'Pause SIP Plan?' : 'Remove SIP Plan?')
                  : 'Delete Investment?'
                }
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteConfirmation.type === 'sip'
                  ? deleteConfirmation.item?.is_active 
                    ? `Are you sure you want to pause "${deleteConfirmation.item?.name}"? You can resume it later.`
                    : `Are you sure you want to remove "${deleteConfirmation.item?.name}"? This will make it inactive.`
                  : `Are you sure you want to delete "${deleteConfirmation.item?.name}"? This action cannot be undone.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
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
                    }
                    setDeleteConfirmation({type: null, item: null});
                  } catch (error) {
                    console.error(`Failed to ${deleteConfirmation.type === 'sip' ? 'pause' : 'delete'} ${deleteConfirmation.type}:`, error);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
                disabled={updateSIPMutation.isPending || deleteInvestmentMutation.isPending}
              >
                {updateSIPMutation.isPending || deleteInvestmentMutation.isPending 
                  ? (deleteConfirmation.type === 'sip' ? 'Pausing...' : 'Deleting...') 
                  : (deleteConfirmation.type === 'sip' ? 'Pause' : 'Delete')
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}