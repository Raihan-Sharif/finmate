'use client';

import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle,
    Edit,
    Plus,
    Target,
    Trash2,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Sample budget data - in real app, this would come from API
const sampleBudgets = [
  {
    id: 1,
    name: 'Food & Dining',
    amount: 600,
    spent: 450,
    currency: 'USD',
    period: 'monthly',
    category: 'Food & Dining',
    color: '#EF4444',
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  {
    id: 2,
    name: 'Transportation',
    amount: 300,
    spent: 280,
    currency: 'USD',
    period: 'monthly',
    category: 'Transportation',
    color: '#3B82F6',
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  {
    id: 3,
    name: 'Entertainment',
    amount: 200,
    spent: 120,
    currency: 'USD',
    period: 'monthly',
    category: 'Entertainment',
    color: '#8B5CF6',
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  {
    id: 4,
    name: 'Shopping',
    amount: 400,
    spent: 380,
    currency: 'USD',
    period: 'monthly',
    category: 'Shopping',
    color: '#F59E0B',
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  {
    id: 5,
    name: 'Bills & Utilities',
    amount: 500,
    spent: 475,
    currency: 'USD',
    period: 'monthly',
    category: 'Bills & Utilities',
    color: '#10B981',
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
  {
    id: 6,
    name: 'Healthcare',
    amount: 150,
    spent: 85,
    currency: 'USD',
    period: 'monthly',
    category: 'Healthcare',
    color: '#EF4444',
    isActive: true,
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
];

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

export default function BudgetPage() {
  const { profile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const currency = profile?.currency || 'USD';

  // Calculate summary statistics
  const totalBudget = sampleBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = sampleBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallProgress = (totalSpent / totalBudget) * 100;

  // Categorize budgets
  const onTrackBudgets = sampleBudgets.filter(budget => {
    const percentage = (budget.spent / budget.amount) * 100;
    return percentage <= 80;
  });

  const warningBudgets = sampleBudgets.filter(budget => {
    const percentage = (budget.spent / budget.amount) * 100;
    return percentage > 80 && percentage <= 100;
  });

  const overBudgets = sampleBudgets.filter(budget => {
    const percentage = (budget.spent / budget.amount) * 100;
    return percentage > 100;
  });

  const getBudgetStatus = (budget: typeof sampleBudgets[0]) => {
    const percentage = (budget.spent / budget.amount) * 100;
    if (percentage > 100) return { status: 'over', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' };
    if (percentage > 80) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Target className="w-8 h-8 mr-3 text-orange-600" />
            Budget Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Set and track your spending limits to achieve your financial goals
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/budget/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalBudget, currency)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalSpent, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPercentage(overallProgress / 100)} of budget
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                  <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalRemaining, currency)}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  totalRemaining >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {totalRemaining >= 0 ? (
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Budget Status</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">{onTrackBudgets.length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">{warningBudgets.length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs">{overBudgets.length}</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Overall Budget Progress</CardTitle>
            <CardDescription>
              Your total spending across all budgets for this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {formatCurrency(totalSpent, currency)} of {formatCurrency(totalBudget, currency)}
                </span>
                <span className={`text-sm font-medium ${
                  overallProgress > 100 ? 'text-red-600' : overallProgress > 80 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {formatPercentage(overallProgress / 100)}
                </span>
              </div>
              <Progress 
                value={Math.min(overallProgress, 100)} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Budgets</CardTitle>
                <CardDescription>
                  Manage your spending limits by category
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-green-600">
                  {onTrackBudgets.length} On Track
                </Badge>
                <Badge variant="secondary" className="text-yellow-600">
                  {warningBudgets.length} Warning
                </Badge>
                <Badge variant="secondary" className="text-red-600">
                  {overBudgets.length} Over Budget
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sampleBudgets.map((budget, index) => {
                const percentage = (budget.spent / budget.amount) * 100;
                const status = getBudgetStatus(budget);
                const remaining = budget.amount - budget.spent;

                return (
                  <motion.div
                    key={budget.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: budget.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-foreground">{budget.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline"
                              className={status.color}
                            >
                              {status.status === 'good' && 'On Track'}
                              {status.status === 'warning' && 'Warning'}
                              {status.status === 'over' && 'Over Budget'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {formatCurrency(budget.spent, currency)} / {formatCurrency(budget.amount, currency)}
                            </span>
                            <span className={status.color}>
                              {formatPercentage(percentage / 100)}
                            </span>
                          </div>
                          
                          <Progress 
                            value={Math.min(percentage, 100)} 
                            className="h-2"
                          />
                          
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              {remaining >= 0 
                                ? `${formatCurrency(remaining, currency)} remaining`
                                : `${formatCurrency(Math.abs(remaining), currency)} over budget`
                              }
                            </span>
                            <span>{budget.period}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {sampleBudgets.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No budgets created yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first budget to start tracking your spending limits
                </p>
                <Link href="/dashboard/budget/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Budget
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Budget Tips</CardTitle>
            <CardDescription>
              Smart suggestions to help you manage your budgets better
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Set Realistic Goals
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Base your budgets on your actual spending patterns from the last 3 months.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Use the 50/30/20 Rule
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Review Regularly
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Check your budget progress weekly to stay on track and make adjustments.
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                  Plan for Unexpected
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Add a buffer of 10-15% to your budgets for unexpected expenses.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}