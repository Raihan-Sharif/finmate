'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  PieChart,
  Plus,
  Target,
  TrendingUp,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

// Sample data - in real app, this would come from API
const sampleData = {
  balance: 15420.50,
  income: 4200.00,
  expenses: 2850.75,
  savings: 1349.25,
  investments: 12500.00,
  investmentChange: 8.5,
  budgets: [
    { name: 'Food & Dining', spent: 450, budget: 600, color: '#3B82F6' },
    { name: 'Transportation', spent: 280, budget: 300, color: '#10B981' },
    { name: 'Entertainment', spent: 120, budget: 200, color: '#F59E0B' },
    { name: 'Shopping', spent: 380, budget: 400, color: '#EF4444' },
  ],
  recentTransactions: [
    { id: 1, description: 'Grocery Store', amount: -85.50, date: '2024-01-15', category: 'Food' },
    { id: 2, description: 'Salary Credit', amount: 4200.00, date: '2024-01-15', category: 'Income' },
    { id: 3, description: 'Coffee Shop', amount: -12.50, date: '2024-01-14', category: 'Food' },
    { id: 4, description: 'Gas Station', amount: -45.00, date: '2024-01-14', category: 'Transportation' },
    { id: 5, description: 'Online Shopping', amount: -125.99, date: '2024-01-13', category: 'Shopping' },
  ],
  monthlySpending: [
    { month: 'Jul', amount: 2200 },
    { month: 'Aug', amount: 2400 },
    { month: 'Sep', amount: 2100 },
    { month: 'Oct', amount: 2800 },
    { month: 'Nov', amount: 2600 },
    { month: 'Dec', amount: 2850 },
  ],
  categorySpending: [
    { name: 'Food & Dining', value: 450, color: '#3B82F6' },
    { name: 'Transportation', value: 280, color: '#10B981' },
    { name: 'Shopping', value: 380, color: '#F59E0B' },
    { name: 'Entertainment', value: 120, color: '#EF4444' },
    { name: 'Bills', value: 520, color: '#8B5CF6' },
    { name: 'Others', value: 200, color: '#6B7280' },
  ],
};

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

export default function DashboardOverview() {
  const { user, profile } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const savingsRate = (sampleData.savings / sampleData.income) * 100;
  const currency = profile?.currency || 'USD';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.full_name || user?.user_metadata?.name || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your finances today.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/transactions/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={fadeInUp}>
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(sampleData.balance, currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                +2.5% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <ArrowUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(sampleData.income, currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <ArrowDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(sampleData.expenses, currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                -5% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investments</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(sampleData.investments, currency)}
              </div>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{formatPercentage(sampleData.investmentChange)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Monthly Spending Trend
              </CardTitle>
              <CardDescription>
                Your spending pattern over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sampleData.monthlySpending}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value), currency), 'Amount']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-purple-600" />
                Spending by Category
              </CardTitle>
              <CardDescription>
                This month's expense breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={sampleData.categorySpending}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sampleData.categorySpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value), currency), 'Amount']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {sampleData.categorySpending.map((category, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Budget Progress and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-orange-600" />
                Budget Overview
              </CardTitle>
              <CardDescription>
                Your spending vs. budget for this month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sampleData.budgets.map((budget, index) => {
                const percentage = (budget.spent / budget.budget) * 100;
                const isOverBudget = percentage > 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{budget.name}</span>
                      <span className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {formatCurrency(budget.spent, currency)} / {formatCurrency(budget.budget, currency)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className="h-2"
                      style={{
                        '--progress-background': isOverBudget ? '#EF4444' : budget.color,
                      } as any}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatPercentage(percentage / 100)} used</span>
                      <span>{formatCurrency(budget.budget - budget.spent, currency)} remaining</span>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4 border-t">
                <Link href="/dashboard/budget">
                  <Button variant="outline" className="w-full">
                    Manage Budgets
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                Recent Transactions
              </CardTitle>
              <CardDescription>
                Your latest financial activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleData.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.amount > 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {transaction.amount > 0 ? (
                          <ArrowUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.category} • {transaction.date}</p>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount, currency)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t mt-4">
                <Link href="/dashboard/transactions">
                  <Button variant="outline" className="w-full">
                    View All Transactions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used actions to manage your finances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/transactions/new">
                <Button variant="outline" className="h-20 flex flex-col space-y-2 w-full">
                  <Plus className="w-6 h-6" />
                  <span className="text-sm">Add Transaction</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/budget/new">
                <Button variant="outline" className="h-20 flex flex-col space-y-2 w-full">
                  <Target className="w-6 h-6" />
                  <span className="text-sm">Create Budget</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/investments/new">
                <Button variant="outline" className="h-20 flex flex-col space-y-2 w-full">
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-sm">Add Investment</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/reports">
                <Button variant="outline" className="h-20 flex flex-col space-y-2 w-full">
                  <PieChart className="w-6 h-6" />
                  <span className="text-sm">View Reports</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}