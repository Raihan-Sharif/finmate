'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { useEnhancedDashboard } from '@/hooks/useEnhancedDashboard';
import { useAppStore } from '@/lib/stores/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PiggyBank, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Plus,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Banknote,
  Building,
  Clock,
  Zap,
  Shield,
  Sparkles,
  TrendingDownIcon,
  TrendingUpIcon,
  RefreshCw,
  Filter,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  BarChart,
  Bar
} from 'recharts';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { user, profile } = useAuth();
  const { canCreateTransactions } = usePermissions();
  const { formatAmount, getCurrencySymbol } = useAppStore();
  const {
    stats,
    monthlyData,
    categoryExpenses,
    recentTransactions,
    upcomingReminders,
    accounts,
    budgetAlerts,
    monthlyGoals,
    loading,
    error,
    refreshData,
    setPeriod,
    currentPeriod
  } = useEnhancedDashboard();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const periodOptions = [
    { value: '7d', label: t('periods.last7Days') },
    { value: '30d', label: t('periods.last30Days') },
    { value: '90d', label: t('periods.last3Months') },
    { value: '6m', label: t('periods.last6Months') },
    { value: '1y', label: t('periods.lastYear') },
    { value: 'ytd', label: t('periods.yearToDate') },
    { value: 'all', label: t('periods.allTime') }
  ];

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  };

  const getHealthFactors = (score: number) => {
    const factors = [];
    const budgetUsage = stats.budget_used_percentage;
    const savingsRate = stats.total_income > 0 ? ((stats.total_income - stats.total_expenses) / stats.total_income) * 100 : 0;

    if (budgetUsage <= 80) factors.push(t('health.excellentBudgetControl'));
    else if (budgetUsage <= 100) factors.push(t('health.closeToBudgetLimit'));
    else factors.push(t('health.overBudget'));

    if (savingsRate >= 20) factors.push(t('health.greatSavingsRate'));
    else if (savingsRate >= 10) factors.push(t('health.goodSavingsRate'));
    else if (savingsRate >= 0) factors.push(t('health.lowSavingsRate'));
    else factors.push(t('health.spendingMoreThanEarning'));

    if (stats.investment_value > 0) factors.push(t('health.activeInvestor'));
    else factors.push(t('health.noInvestments'));

    if (stats.pending_emis === 0) factors.push(t('health.noPendingEmis'));
    else factors.push(t('health.hasPendingPayments'));

    return factors;
  };

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    await refreshData(newPeriod);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:bg-zinc-950">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">{t('overview.loadingDashboard')}</p>
        </motion.div>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:bg-zinc-950">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">{t('overview.somethingWentWrong')}</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <Button onClick={handleRefresh} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('overview.tryAgain')}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:bg-zinc-950 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="p-6 space-y-8">
        {/* Enhanced Header with Controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('greeting.' + (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'))}, {profile?.full_name || tCommon('user')}! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('overview.financialOverview')} • {getCurrencySymbol()} {periodOptions.find(p => p.value === currentPeriod)?.label}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={currentPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px] bg-card/50 dark:bg-zinc-800/60 border-border/50 dark:border-zinc-700/40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="bg-card/50 dark:bg-zinc-800/60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            {canCreateTransactions() && (
              <Link href="/dashboard/transactions/new">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('overview.quickAdd')}
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Quick Actions Bar */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <motion.div variants={fadeInUp}>
            <Link href="/dashboard/transactions/new">
              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-blue-50 to-cyan-50 dark:bg-gradient-to-r dark:from-blue-950/60 dark:to-cyan-950/60 border border-blue-200/60 dark:border-blue-800/30 hover:scale-105 hover:border-blue-300/80 dark:hover:from-blue-900/70 dark:hover:to-cyan-900/70 dark:hover:border-blue-700/50 backdrop-blur-sm dark:shadow-xl dark:shadow-black/30">
                <CardContent className="p-4 text-center">
                  <Plus className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('overview.addTransaction')}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Link href="/dashboard/budget/new">
              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-green-50 to-emerald-50 dark:bg-gradient-to-r dark:from-green-950/60 dark:to-emerald-950/60 border border-green-200/60 dark:border-green-800/30 hover:scale-105 hover:border-green-300/80 dark:hover:from-green-900/70 dark:hover:to-emerald-900/70 dark:hover:border-green-700/50 backdrop-blur-sm dark:shadow-xl dark:shadow-black/30">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">{t('overview.createBudget')}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Link href="/dashboard/credit">
              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-orange-50 to-amber-50 dark:bg-gradient-to-r dark:from-orange-950/60 dark:to-amber-950/60 border border-orange-200/60 dark:border-orange-800/30 hover:scale-105 hover:border-orange-300/80 dark:hover:from-orange-900/70 dark:hover:to-amber-900/70 dark:hover:border-orange-700/50 backdrop-blur-sm dark:shadow-xl dark:shadow-black/30">
                <CardContent className="p-4 text-center">
                  <CreditCard className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">{t('overview.manageLoans')}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Link href="/dashboard/investments">
              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-purple-50 to-pink-50 dark:bg-gradient-to-r dark:from-purple-950/60 dark:to-pink-950/60 border border-purple-200/60 dark:border-purple-800/30 hover:scale-105 hover:border-purple-300/80 dark:hover:from-purple-900/70 dark:hover:to-pink-900/70 dark:hover:border-purple-700/50 backdrop-blur-sm dark:shadow-xl dark:shadow-black/30">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('overview.investments')}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        {/* Enhanced Stats Cards with Real Data */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-blue-950/40 dark:to-indigo-950/40 border border-slate-200/80 dark:border-blue-800/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm dark:shadow-xl dark:shadow-black/40 hover:dark:from-zinc-800/90 hover:dark:via-blue-900/50 hover:dark:to-indigo-900/50 hover:dark:border-blue-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                  {t('stats.accountBalance')}
                  <Info className="h-3 w-3 ml-1 opacity-60" />
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="text-blue-600 dark:text-blue-400 h-6 w-6 p-0"
                  >
                    {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  {balanceVisible ? formatAmount(stats.total_account_balance) : '••••••'}
                </div>
                <p className="text-xs text-slate-600/80 dark:text-slate-400/80 flex items-center mt-1">
                  <Banknote className="h-3 w-3 mr-1" />
                  {stats.total_accounts} {t('stats.accounts')} • {t('stats.live')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-green-950/40 dark:to-teal-950/40 border border-emerald-200/80 dark:border-green-800/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm dark:shadow-xl dark:shadow-black/40 hover:dark:from-zinc-800/90 hover:dark:via-green-900/50 hover:dark:to-teal-900/50 hover:dark:border-green-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('stats.income')}</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  +{formatAmount(stats.total_income)}
                </div>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                  {periodOptions.find(p => p.value === currentPeriod)?.label.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-red-950/40 dark:to-pink-950/40 border border-rose-200/80 dark:border-red-800/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm dark:shadow-xl dark:shadow-black/40 hover:dark:from-zinc-800/90 hover:dark:via-red-900/50 hover:dark:to-pink-900/50 hover:dark:border-red-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-rose-700 dark:text-rose-300">{t('stats.expenses')}</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
                  -{formatAmount(stats.total_expenses)}
                </div>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
                  {periodOptions.find(p => p.value === currentPeriod)?.label.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-violet-950/40 dark:to-fuchsia-950/40 border border-violet-200/80 dark:border-violet-800/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm dark:shadow-xl dark:shadow-black/40 hover:dark:from-zinc-800/90 hover:dark:via-violet-900/50 hover:dark:to-fuchsia-900/50 hover:dark:border-violet-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t('stats.netBalance')}</CardTitle>
                {stats.net_balance >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stats.net_balance >= 0 ? 'bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent'}`}>
                  {stats.net_balance >= 0 ? '+' : ''}{formatAmount(stats.net_balance)}
                </div>
                <p className={`text-xs flex items-center ${stats.net_balance >= 0 ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-rose-600/80 dark:text-rose-400/80'}`}>
                  <PiggyBank className="h-3 w-3 mr-1" />
                  {stats.total_income > 0 ? ((stats.net_balance / stats.total_income) * 100).toFixed(1) : '0'}% {t('stats.savingsRate')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

        </motion.div>

        {/* Secondary Financial Stats */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-amber-950/40 dark:to-orange-950/40 border border-amber-200/80 dark:border-amber-800/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm dark:shadow-xl dark:shadow-black/40 hover:dark:from-zinc-800/90 hover:dark:via-amber-900/50 hover:dark:to-orange-900/50 hover:dark:border-amber-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-amber-700 dark:text-amber-300">{t('stats.investmentPortfolio')}</CardTitle>
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {formatAmount(stats.total_investment_value)}
                    </div>
                    <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                      {t('stats.totalInvestmentValue')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('stats.activeInvestments')}</p>
                      <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">{stats.total_investments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('stats.returns')}</p>
                      <p className={`text-lg font-semibold ${stats.investment_return >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.investment_return >= 0 ? '+' : ''}{stats.investment_return.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-cyan-950/40 dark:to-blue-950/40 border border-cyan-200/80 dark:border-cyan-800/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm dark:shadow-xl dark:shadow-black/40 hover:dark:from-zinc-800/90 hover:dark:via-cyan-900/50 hover:dark:to-blue-900/50 hover:dark:border-cyan-700/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-cyan-700 dark:text-cyan-300">{t('stats.loanCredit')}</CardTitle>
                <CreditCard className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                      {formatAmount(stats.total_loan_amount)}
                    </div>
                    <p className="text-sm text-cyan-600/80 dark:text-cyan-400/80 mt-1">
                      {t('stats.outstandingLoans')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('stats.activeLoans')}</p>
                      <p className="text-lg font-semibold text-cyan-700 dark:text-cyan-300">{stats.total_loans}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('stats.pendingEmis')}</p>
                      <p className={`text-lg font-semibold ${stats.pending_emis > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {stats.pending_emis}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Subscription Management Card */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <SubscriptionCard />
        </motion.div>

        {/* Smart Financial Alerts */}
        {(stats.pending_emis > 0 || stats.overdue_lendings > 0 || budgetAlerts.length > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border border-amber-200/70 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/80 via-orange-50/80 to-red-50/80 dark:bg-gradient-to-br dark:from-zinc-900/70 dark:via-amber-950/50 dark:to-red-950/50 shadow-xl backdrop-blur-sm dark:shadow-xl dark:shadow-black/40">
              <CardHeader>
                <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
                  {t('alerts.smartFinancialAlerts')}
                  <Badge variant="outline" className="ml-2 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-200 bg-amber-100/50 dark:bg-amber-900/30">
                    {(stats.pending_emis || 0) + (stats.overdue_lendings || 0) + budgetAlerts.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  {t('alerts.immediateAttention')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.pending_emis > 0 && (
                    <div className="p-4 bg-white/80 dark:bg-zinc-800/60 rounded-xl border border-amber-200/60 dark:border-amber-700/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm dark:hover:bg-zinc-700/70 hover:dark:border-amber-600/40">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <p className="font-semibold text-amber-800 dark:text-amber-200">{t('alerts.pendingEmis')}</p>
                      </div>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending_emis}</p>
                      <Link href="/dashboard/credit/loans">
                        <Button size="sm" variant="outline" className="mt-2 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                          {t('alerts.manageLoans')}
                        </Button>
                      </Link>
                    </div>
                  )}
                  
                  {stats.overdue_lendings > 0 && (
                    <div className="p-4 bg-white/80 dark:bg-zinc-800/60 rounded-xl border border-amber-200/60 dark:border-amber-700/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm dark:hover:bg-zinc-700/70 hover:dark:border-amber-600/40">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <p className="font-semibold text-amber-800 dark:text-amber-200">{t('alerts.overdueLendings')}</p>
                      </div>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.overdue_lendings}</p>
                      <Link href="/dashboard/credit/personal-lending">
                        <Button size="sm" variant="outline" className="mt-2 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                          {t('alerts.reviewLendings')}
                        </Button>
                      </Link>
                    </div>
                  )}
                  
                  {budgetAlerts.map(alert => (
                    <div key={alert.id} className="p-4 bg-white/80 dark:bg-zinc-800/60 rounded-xl border border-amber-200/60 dark:border-amber-700/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm dark:hover:bg-zinc-700/70 hover:dark:border-amber-600/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">{alert.name}</p>
                        </div>
                        <Badge variant={alert.is_over_budget ? "destructive" : "outline"} className="text-xs bg-amber-100 dark:bg-amber-900/30">
                          {alert.percentage_used.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {formatAmount(alert.spent_amount)} of {formatAmount(alert.amount)}
                        </p>
                        <Progress value={Math.min(100, alert.percentage_used)} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Enhanced Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dynamic Monthly Trends with Real Data */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-blue-950/40 dark:to-purple-950/40 border border-blue-200/80 dark:border-blue-800/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm dark:shadow-xl dark:shadow-black/40 hover:dark:from-zinc-800/90 hover:dark:via-blue-900/50 hover:dark:to-purple-900/50 hover:dark:border-blue-700/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">{t('analytics.monthlyTrends')}</span>
                  </div>
                  <Badge variant="outline" className="bg-indigo-100/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600">
                    {t('analytics.dynamicData')} • {periodOptions.find(p => p.value === currentPeriod)?.label}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-indigo-700/80 dark:text-indigo-300/80">
                  {t('analytics.incomeVsExpenses')} • {t('analytics.allAmountsIn')} {getCurrencySymbol()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => formatAmount(value).replace(/[^\d.,]/g, '')}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        formatAmount(Number(value)), 
                        name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : name === 'budget' ? 'Budget' : name
                      ]}
                      labelClassName="text-foreground"
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      name={t('stats.income')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                      name={t('stats.expenses')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="budget" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                      name={tCommon('budget')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Breakdown with Real Data */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-purple-950/40 dark:to-pink-950/40 border border-purple-200/80 dark:border-purple-800/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm dark:shadow-xl dark:shadow-black/40 hover:dark:from-zinc-800/90 hover:dark:via-purple-900/50 hover:dark:to-pink-900/50 hover:dark:border-purple-700/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-fuchsia-600 dark:text-fuchsia-400" />
                    <span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent font-bold">{t('analytics.categoryBreakdown')}</span>
                  </div>
                  <Badge variant="outline" className="bg-purple-100/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600">
                    {t('analytics.topCategories')} {categoryExpenses.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-purple-700/80 dark:text-purple-300/80">
                  {periodOptions.find(p => p.value === currentPeriod)?.label} {t('analytics.expensesByCategory')} • {getCurrencySymbol()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryExpenses.length > 0 ? (
                  <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4">
                    <div className="w-56 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={categoryExpenses}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="amount"
                          >
                            {categoryExpenses.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [formatAmount(Number(value)), 'Amount']}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3 max-h-56 overflow-y-auto">
                      {categoryExpenses.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 dark:bg-zinc-800/50 hover:bg-muted/40 dark:hover:bg-zinc-700/60 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: category.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium truncate block">
                                {category.category_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {category.transactions_count} transactions
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-medium">{formatAmount(category.amount)}</p>
                            <p className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <PieChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">{tCommon('noExpensesFound')}</h3>
                    <p className="mb-4">{tCommon('startAddingExpenses')}</p>
                    <Link href="/dashboard/transactions/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        {tCommon('addExpense')}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Financial Health Score with Real Calculation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="shadow-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:bg-gradient-to-br dark:from-zinc-900/70 dark:via-green-950/50 dark:to-teal-950/50 border border-green-200/80 dark:border-green-800/30 dark:shadow-xl dark:shadow-black/40">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800 dark:text-green-300">
                  <Shield className="h-5 w-5 mr-2" />
                  {t('analytics.financialHealth')}
                  <Badge variant="outline" className="ml-2 bg-white/60 border-green-300">
                    {t('analytics.healthScore')}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-400">
                  {tCommon('aiPoweredWellnessAnalysis')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`text-5xl font-bold ${getHealthColor(stats.financial_health_score)}`}>
                    {getHealthGrade(stats.financial_health_score)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{t('analytics.healthScore')}</span>
                      <span className="text-sm text-muted-foreground">{stats.financial_health_score}/100</span>
                    </div>
                    <Progress value={stats.financial_health_score} className="h-3 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {stats.financial_health_score >= 80 ? t('analytics.excellent') : 
                       stats.financial_health_score >= 60 ? t('analytics.good') : 
                       stats.financial_health_score >= 40 ? t('analytics.average') : t('analytics.poor')} {t('analytics.financialHealth')}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">{t('analytics.keyFinancialMetrics')}:</h4>
                  {getHealthFactors(stats.financial_health_score).slice(0, 4).map((factor, index) => (
                    <p key={index} className="text-xs text-muted-foreground flex items-center">
                      <span className="mr-2">{factor}</span>
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Advanced Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-cyan-950/40 dark:to-blue-950/40 border border-cyan-200/80 dark:border-cyan-800/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm dark:shadow-xl dark:shadow-black/40 hover:dark:from-zinc-800/90 hover:dark:via-cyan-900/50 hover:dark:to-blue-900/50 hover:dark:border-cyan-700/30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-cyan-600 dark:text-cyan-400" />
                  <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-bold">{t('analytics.advancedAnalytics')}</span>
                </CardTitle>
                <CardDescription className="text-cyan-700/80 dark:text-cyan-300/80">{t('analytics.keyFinancialMetrics')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-zinc-800/60 rounded-xl border border-cyan-200/60 dark:border-cyan-700/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm dark:hover:bg-zinc-700/70 hover:dark:border-cyan-600/40">
                  <div className="flex items-center space-x-2">
                    <Banknote className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-800 dark:text-cyan-200">{t('analytics.avgTransaction')}</span>
                  </div>
                  <span className="font-bold text-cyan-700 dark:text-cyan-300">
                    {formatAmount(recentTransactions.length > 0 ? (stats.total_income + stats.total_expenses) / recentTransactions.length : 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-zinc-800/60 rounded-xl border border-green-200/60 dark:border-green-700/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm dark:hover:bg-zinc-700/70 hover:dark:border-green-600/40">
                  <div className="flex items-center space-x-2">
                    <PiggyBank className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">{t('analytics.savingsRate')}</span>
                  </div>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {stats.total_income > 0 ? ((stats.net_balance / stats.total_income) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-zinc-800/60 rounded-xl border border-purple-200/60 dark:border-purple-700/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm dark:hover:bg-zinc-700/70 hover:dark:border-purple-600/40">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">{t('analytics.budgetUsage')}</span>
                  </div>
                  <span className="font-bold text-purple-700 dark:text-purple-300">{stats.budget_used_percentage.toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/70 dark:bg-zinc-800/60 rounded-xl border border-amber-200/60 dark:border-amber-700/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm dark:hover:bg-zinc-700/70 hover:dark:border-amber-600/40">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('analytics.investmentReturn')}</span>
                  </div>
                  <span className={`font-bold ${stats.investment_return >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stats.investment_return >= 0 ? '+' : ''}{stats.investment_return.toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity with Enhanced Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/80 dark:border-emerald-800/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm dark:shadow-xl dark:shadow-black/40 hover:dark:from-zinc-800/90 hover:dark:via-emerald-900/50 hover:dark:to-teal-900/50 hover:dark:border-emerald-700/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">{t('activity.recentActivity')}</span>
                  </div>
                  <Link href="/dashboard/transactions">
                    <Button variant="ghost" size="sm" className="text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30">
                      {t('activity.viewAll')} ({recentTransactions.length})
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription className="text-emerald-700/80 dark:text-emerald-300/80">{t('activity.latestTransactions')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentTransactions.slice(0, 6).map(transaction => (
                    <motion.div 
                      key={transaction.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/70 dark:bg-zinc-800/60 border border-emerald-200/60 dark:border-emerald-700/30 shadow-md hover:shadow-lg transition-all backdrop-blur-sm dark:hover:bg-zinc-700/70 hover:dark:border-emerald-600/40"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-full flex-shrink-0 ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.category_name} • {new Date(transaction.transaction_date).toLocaleDateString()}
                            {transaction.vendor && ` • ${transaction.vendor}`}
                          </p>
                        </div>
                      </div>
                      <div className={`font-medium text-sm flex-shrink-0 ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                      </div>
                    </motion.div>
                  ))}
                  
                  {recentTransactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <h4 className="text-sm font-semibold mb-2">{t('activity.noRecentActivity')}</h4>
                      <p className="text-xs mb-3">{t('activity.startAddingTransactions')}</p>
                      <Link href="/dashboard/transactions/new">
                        <Button variant="outline" size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          {tCommon('addTransaction')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Upcoming Reminders with Priority System */}
        {upcomingReminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card className="shadow-xl bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 dark:bg-gradient-to-r dark:from-zinc-900/70 dark:via-cyan-950/50 dark:to-indigo-950/50 border border-cyan-200/80 dark:border-cyan-800/30 dark:shadow-xl dark:shadow-black/40">
              <CardHeader>
                <CardTitle className="flex items-center text-cyan-800 dark:text-cyan-300">
                  <Calendar className="h-5 w-5 mr-2" />
                  {t('reminders.upcomingReminders')}
                  <Badge variant="outline" className="ml-2 bg-white/60 border-cyan-300">
                    {upcomingReminders.length} {t('reminders.items')}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-cyan-700 dark:text-cyan-400">
                  {t('reminders.financialDeadlines')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingReminders.map(reminder => (
                    <div key={reminder.id} className={`p-4 rounded-lg border ${
                      reminder.priority === 'high' 
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-200/80 dark:border-red-800/40' 
                        : reminder.priority === 'medium'
                          ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200/80 dark:border-yellow-800/40'
                          : 'bg-green-50 dark:bg-green-950/30 border-green-200/80 dark:border-green-800/40'
                    } dark:shadow-lg dark:shadow-black/30`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{reminder.title}</h4>
                        <Badge 
                          variant={reminder.priority === 'high' ? 'destructive' : reminder.priority === 'medium' ? 'outline' : 'secondary'}
                          className="text-xs"
                        >
                          {reminder.days_until_due === 0 ? t('reminders.today') : `${reminder.days_until_due}d`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{reminder.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{formatAmount(reminder.amount || 0)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          reminder.type === 'emi' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                          {reminder.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Monthly Goals Progress */}
        {monthlyGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <Card className="shadow-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-r dark:from-zinc-900/70 dark:via-indigo-950/50 dark:to-pink-950/50 border border-indigo-200/80 dark:border-indigo-800/30 dark:shadow-xl dark:shadow-black/40">
              <CardHeader>
                <CardTitle className="flex items-center text-indigo-800 dark:text-indigo-300">
                  <Target className="h-5 w-5 mr-2" />
                  {t('goals.monthlyGoalsProgress')}
                </CardTitle>
                <CardDescription className="text-indigo-700 dark:text-indigo-400">
                  {t('goals.trackProgress')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {monthlyGoals.map(goal => (
                    <div key={goal.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{t(`goals.titles.${goal.id}`)}</h4>
                        <Badge variant={
                          goal.status === 'achieved' ? 'default' :
                          goal.status === 'on-track' ? 'secondary' :
                          goal.status === 'warning' ? 'outline' : 'destructive'
                        } className="text-xs">
                          {t(`goals.status.${goal.status.replace('-', '_')}`)}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t('goals.progress')}</span>
                          <span>{Math.min(goal.progress, goal.target).toFixed(1)}/{goal.target}</span>
                        </div>
                        <Progress 
                          value={Math.min((goal.progress / goal.target) * 100, 100)} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}