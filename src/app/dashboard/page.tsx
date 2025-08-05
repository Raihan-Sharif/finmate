'use client';

import { useEffect, useState } from 'react';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  PieChart
} from 'lucide-react';
import DashboardService from '@/lib/services/dashboard';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  totalBudgetAmount: number;
  totalBudgetSpent: number;
  budgetUsagePercentage: number;
  budgetRemainingAmount: number;
  overBudgetCount: number;
  onTrackBudgetCount: number;
  accountCount: number;
  transactionCount: number;
  averageTransactionAmount: number;
  currentBudgets: any[];
  recentTransactions: any[];
  monthlyData: any[];
  categoryExpenses: any[];
  budgetAlerts: any[];
  insights: any[];
  accountsByType: any;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { canCreateTransactions } = usePermissions();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadHealthScore();
    }
  }, [user, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const period = selectedPeriod !== 'all' ? {
        startDate: new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      } : undefined;

      const data = await DashboardService.getDashboardData(user!.id, period);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadHealthScore = async () => {
    try {
      const score = await DashboardService.getFinancialHealthScore(user!.id);
      setHealthScore(score);
    } catch (error) {
      console.error('Error loading health score:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No Data Available</h2>
          <p className="text-gray-600">Start by adding some transactions to see your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || 'User'}!
          </h1>
          <p className="text-gray-600">Here's your financial overview</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
          {canCreateTransactions() && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBalanceVisible(!balanceVisible)}
            >
              {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balanceVisible ? formatCurrency(dashboardData.totalBalance) : '••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {dashboardData.accountCount} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Period</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{formatCurrency(dashboardData.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(dashboardData.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            {dashboardData.netBalance >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dashboardData.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {dashboardData.netBalance >= 0 ? '+' : ''}{formatCurrency(dashboardData.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Savings rate: {dashboardData.savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alerts */}
      {dashboardData.budgetAlerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.budgetAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-yellow-800">{alert.name}</p>
                    <p className="text-sm text-yellow-600">{alert.message}</p>
                  </div>
                  <Badge variant={alert.type === 'exceeded' ? 'destructive' : 'secondary'}>
                    {alert.percentage.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Health Score */}
      {healthScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Financial Health Score
            </CardTitle>
            <CardDescription>
              Based on your financial habits and goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold" style={{ color: healthScore.gradeColor }}>
                {healthScore.grade}
              </div>
              <div className="flex-1">
                <Progress value={healthScore.score} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {healthScore.score}/100 points
                </p>
              </div>
            </div>
            {healthScore.recommendations.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Recommendations:</h4>
                {healthScore.recommendations.slice(0, 2).map((rec: any, index: number) => (
                  <div key={index} className="text-sm text-gray-600 flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                    {rec.description}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Trends Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart will be rendered here</p>
              <p className="text-sm text-gray-400">Income vs Expenses over time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Insights</CardTitle>
            <CardDescription>
              AI-powered insights about your finances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className={`p-2 rounded-full ${
                    insight.type === 'positive' ? 'bg-green-100 text-green-600' :
                    insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    insight.type === 'negative' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentTransactions.slice(0, 5).map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.category_name} • {new Date(transaction.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview */}
      {dashboardData.currentBudgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Current Budgets
            </CardTitle>
            <CardDescription>
              Track your spending against your budget goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.currentBudgets.map(budget => (
                <div key={budget.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{budget.name}</h4>
                    <Badge variant={budget.is_over_budget ? 'destructive' : 'secondary'}>
                      {budget.percentage_used.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={Math.min(100, budget.percentage_used)} className="h-2 mb-2" />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatCurrency(budget.actual_spent)}</span>
                    <span>{formatCurrency(budget.amount)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {budget.days_remaining} days remaining
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
