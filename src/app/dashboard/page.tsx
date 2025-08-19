'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '6m', label: 'Last 6 months' },
    { value: '1y', label: 'Last year' },
    { value: 'ytd', label: 'Year to date' },
    { value: 'all', label: 'All time' }
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

    if (budgetUsage <= 80) factors.push("✓ Excellent budget control");
    else if (budgetUsage <= 100) factors.push("⚠ Close to budget limit");
    else factors.push("✗ Over budget");

    if (savingsRate >= 20) factors.push("✓ Great savings rate");
    else if (savingsRate >= 10) factors.push("⚠ Good savings rate");
    else if (savingsRate >= 0) factors.push("⚠ Low savings rate");
    else factors.push("✗ Spending more than earning");

    if (stats.investment_value > 0) factors.push("✓ Active investor");
    else factors.push("⚠ No investments");

    if (stats.pending_emis === 0) factors.push("✓ No pending EMIs");
    else factors.push("⚠ Has pending payments");

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-background">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading your financial dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <Button onClick={handleRefresh} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-background">
      <div className="p-6 space-y-8">
        {/* Enhanced Header with Controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.full_name || 'there'}! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              Here's your complete financial overview • {getCurrencySymbol()} {periodOptions.find(p => p.value === currentPeriod)?.label}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={currentPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px] bg-card/50 border-border/50">
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
              className="bg-card/50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            {canCreateTransactions() && (
              <Link href="/dashboard/transactions/new">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Add
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
              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800 hover:scale-105">
                <CardContent className="p-4 text-center">
                  <Plus className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Add Transaction</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Link href="/dashboard/budget/new">
              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 hover:scale-105">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Create Budget</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Link href="/dashboard/credit">
              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800 hover:scale-105">
                <CardContent className="p-4 text-center">
                  <CreditCard className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Manage Loans</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Link href="/dashboard/investments">
              <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 hover:scale-105">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Investments</p>
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
            <Card className="bg-gradient-to-br from-blue-50 via-blue-50 to-cyan-50 dark:from-blue-950/40 dark:via-blue-950/40 dark:to-cyan-950/40 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Account Balance
                  <Info className="h-3 w-3 inline ml-1 opacity-70" />
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
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {balanceVisible ? formatAmount(stats.total_account_balance) : '••••••'}
                </div>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 flex items-center mt-1">
                  <Banknote className="h-3 w-3 mr-1" />
                  {stats.total_accounts} accounts • Real-time
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 dark:from-green-950/40 dark:via-green-950/40 dark:to-emerald-950/40 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Income</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  +{formatAmount(stats.total_income)}
                </div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  {periodOptions.find(p => p.value === currentPeriod)?.label.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-red-50 via-red-50 to-pink-50 dark:from-red-950/40 dark:via-red-950/40 dark:to-pink-950/40 border-red-200 dark:border-red-800 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Expenses</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  -{formatAmount(stats.total_expenses)}
                </div>
                <p className="text-xs text-red-600/70 dark:text-red-400/70">
                  {periodOptions.find(p => p.value === currentPeriod)?.label.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-purple-50 via-purple-50 to-pink-50 dark:from-purple-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Net Balance</CardTitle>
                {stats.net_balance >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stats.net_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.net_balance >= 0 ? '+' : ''}{formatAmount(stats.net_balance)}
                </div>
                <p className={`text-xs flex items-center ${stats.net_balance >= 0 ? 'text-green-600/70 dark:text-green-400/70' : 'text-red-600/70 dark:text-red-400/70'}`}>
                  <PiggyBank className="h-3 w-3 mr-1" />
                  {stats.total_income > 0 ? ((stats.net_balance / stats.total_income) * 100).toFixed(1) : '0'}% savings rate
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Smart Financial Alerts */}
        {(stats.pending_emis > 0 || stats.overdue_lendings > 0 || stats.budget_used_percentage > 90 || budgetAlerts.length > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-orange-800 dark:text-orange-300 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Smart Financial Alerts
                  <Badge variant="outline" className="ml-2 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300">
                    {(stats.pending_emis || 0) + (stats.overdue_lendings || 0) + budgetAlerts.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-400">
                  Items requiring your immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.pending_emis > 0 && (
                    <div className="p-4 bg-white/60 dark:bg-black/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <p className="font-medium text-orange-800 dark:text-orange-300">Pending EMIs</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending_emis}</p>
                      <Link href="/dashboard/credit/loans">
                        <Button size="sm" variant="outline" className="mt-2 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950">
                          Manage Loans
                        </Button>
                      </Link>
                    </div>
                  )}
                  
                  {stats.overdue_lendings > 0 && (
                    <div className="p-4 bg-white/60 dark:bg-black/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <p className="font-medium text-orange-800 dark:text-orange-300">Overdue Lendings</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.overdue_lendings}</p>
                      <Link href="/dashboard/credit/personal-lending">
                        <Button size="sm" variant="outline" className="mt-2 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950">
                          Review Lendings
                        </Button>
                      </Link>
                    </div>
                  )}
                  
                  {budgetAlerts.map(alert => (
                    <div key={alert.id} className="p-4 bg-white/60 dark:bg-black/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <p className="font-medium text-orange-800 dark:text-orange-300 text-sm">{alert.name}</p>
                        </div>
                        <Badge variant={alert.is_over_budget ? "destructive" : "outline"} className="text-xs">
                          {alert.percentage_used.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          {formatAmount(alert.spent_amount)} of {formatAmount(alert.amount)}
                        </p>
                        <Progress value={Math.min(100, alert.percentage_used)} className="h-1" />
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
            <Card className="shadow-xl bg-card/70 backdrop-blur-sm border-0 dark:bg-card/40">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Monthly Trends
                  </div>
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                    Dynamic Data • {periodOptions.find(p => p.value === currentPeriod)?.label}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Income vs expenses vs budget over time • All amounts in {getCurrencySymbol()}
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
                      formatter={(value, name) => [formatAmount(Number(value)), name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : 'Budget']}
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
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                      name="Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="budget" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                      name="Budget"
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
            <Card className="shadow-xl bg-card/70 backdrop-blur-sm border-0 dark:bg-card/40">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Spending Breakdown
                  </div>
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
                    Top {categoryExpenses.length} Categories
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {periodOptions.find(p => p.value === currentPeriod)?.label} expense categories • {getCurrencySymbol()}
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
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
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
                    <h3 className="text-lg font-semibold mb-2">No Expenses Found</h3>
                    <p className="mb-4">Start adding expense transactions to see spending breakdown</p>
                    <Link href="/dashboard/transactions/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
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
            <Card className="shadow-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800 dark:text-green-300">
                  <Shield className="h-5 w-5 mr-2" />
                  Financial Health
                  <Badge variant="outline" className="ml-2 bg-white/60 border-green-300">
                    Live Score
                  </Badge>
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-400">
                  AI-powered wellness analysis based on your financial habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`text-5xl font-bold ${getHealthColor(stats.financial_health_score)}`}>
                    {getHealthGrade(stats.financial_health_score)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Score</span>
                      <span className="text-sm text-muted-foreground">{stats.financial_health_score}/100</span>
                    </div>
                    <Progress value={stats.financial_health_score} className="h-3 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {stats.financial_health_score >= 80 ? 'Excellent' : 
                       stats.financial_health_score >= 60 ? 'Good' : 
                       stats.financial_health_score >= 40 ? 'Fair' : 'Needs Improvement'} financial health
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Factors:</h4>
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
            <Card className="shadow-xl bg-card/70 backdrop-blur-sm border-0 dark:bg-card/40">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Advanced Analytics
                </CardTitle>
                <CardDescription>Key financial metrics and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Banknote className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm">Avg. Transaction</span>
                  </div>
                  <span className="font-medium">
                    {formatAmount(recentTransactions.length > 0 ? (stats.total_income + stats.total_expenses) / recentTransactions.length : 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <PiggyBank className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm">Savings Rate</span>
                  </div>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {stats.total_income > 0 ? ((stats.net_balance / stats.total_income) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm">Budget Usage</span>
                  </div>
                  <span className="font-medium">{stats.budget_used_percentage.toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm">Investment Return</span>
                  </div>
                  <span className={`font-medium ${stats.investment_return >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
            <Card className="shadow-xl bg-card/70 backdrop-blur-sm border-0 dark:bg-card/40">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    Recent Activity
                  </div>
                  <Link href="/dashboard/transactions">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All ({recentTransactions.length})
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription>Latest financial transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentTransactions.slice(0, 6).map(transaction => (
                    <motion.div 
                      key={transaction.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
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
                      <h4 className="text-sm font-semibold mb-2">No Recent Activity</h4>
                      <p className="text-xs mb-3">Start adding transactions to see activity</p>
                      <Link href="/dashboard/transactions/new">
                        <Button variant="outline" size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Transaction
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
            <Card className="shadow-xl bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/30 dark:via-blue-950/30 dark:to-indigo-950/30 border-cyan-200 dark:border-cyan-800">
              <CardHeader>
                <CardTitle className="flex items-center text-cyan-800 dark:text-cyan-300">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Reminders
                  <Badge variant="outline" className="ml-2 bg-white/60 border-cyan-300">
                    {upcomingReminders.length} items
                  </Badge>
                </CardTitle>
                <CardDescription className="text-cyan-700 dark:text-cyan-400">
                  Don't miss these important financial deadlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingReminders.map(reminder => (
                    <div key={reminder.id} className={`p-4 rounded-lg border-2 ${
                      reminder.priority === 'high' 
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' 
                        : reminder.priority === 'medium'
                          ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
                          : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{reminder.title}</h4>
                        <Badge 
                          variant={reminder.priority === 'high' ? 'destructive' : reminder.priority === 'medium' ? 'outline' : 'secondary'}
                          className="text-xs"
                        >
                          {reminder.days_until_due === 0 ? 'Today' : `${reminder.days_until_due}d`}
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
            <Card className="shadow-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <CardTitle className="flex items-center text-indigo-800 dark:text-indigo-300">
                  <Target className="h-5 w-5 mr-2" />
                  Monthly Goals Progress
                </CardTitle>
                <CardDescription className="text-indigo-700 dark:text-indigo-400">
                  Track your progress towards financial goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {monthlyGoals.map(goal => (
                    <div key={goal.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{goal.title}</h4>
                        <Badge variant={
                          goal.status === 'achieved' ? 'default' :
                          goal.status === 'on-track' ? 'secondary' :
                          goal.status === 'warning' ? 'outline' : 'destructive'
                        } className="text-xs">
                          {goal.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
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