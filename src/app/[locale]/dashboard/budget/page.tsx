'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useBudgets } from '@/hooks/useBudgets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    RefreshCw,
    Info,
    Copy,
    Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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
  const t = useTranslations('budget');
  const tCommon = useTranslations('common');
  const { profile } = useAuth();
  const {
    currentBudgets,
    budgetAlerts,
    currentBudgetsLoading,
    alertsLoading,
    stats,
    duplicateBudget,
    deleteBudget,
    isDuplicating,
    isDeleting,
    refetch
  } = useBudgets();

  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const currency = profile?.currency || 'BDT';

  const getBudgetStatus = (budget: any) => {
    const percentage = budget.percentage_used;
    if (percentage > 100) return { 
      status: 'over', 
      color: 'text-red-600', 
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      label: t('status.overBudget')
    };
    if (percentage > 80) return { 
      status: 'warning', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      label: t('status.atRisk')
    };
    return { 
      status: 'good', 
      color: 'text-green-600', 
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      label: t('status.onTrack')
    };
  };

  const handleDuplicateBudget = (budgetId: string) => {
    duplicateBudget(budgetId);
  };

  const handleDeleteBudget = (budgetId: string) => {
    deleteBudget(budgetId);
  };

  // Loading state
  if (currentBudgetsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
            {t('management.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('management.subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={currentBudgetsLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${currentBudgetsLoading ? 'animate-spin' : ''}`} />
            {t('management.refresh')}
          </Button>
          <Link href="/dashboard/budget/recurring">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              {t('management.recurring')}
            </Button>
          </Link>
          <Link href="/dashboard/budget/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('management.createNew')}
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Budget Alerts */}
      {budgetAlerts && budgetAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/10">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {t('alerts.title', { count: budgetAlerts.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {budgetAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.priority === 'high' ? 'bg-red-500' : 
                        alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{alert.name}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatPercentage(alert.percentage / 100)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(alert.remaining, currency)} {t('alerts.left')}
                      </p>
                    </div>
                  </div>
                ))}
                {budgetAlerts.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{budgetAlerts.length - 3} {t('alerts.viewAll')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
                  <p className="text-sm font-medium text-muted-foreground">{t('totalBudgeted')}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(stats.totalBudgetAmount, currency)}
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
                  <p className="text-sm font-medium text-muted-foreground">{t('totalSpent')}</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(stats.totalSpentAmount, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPercentage(stats.overallProgress / 100)} {t('of')} {t('title')}
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
                  <p className="text-sm font-medium text-muted-foreground">{t('remaining')}</p>
                  <p className={`text-2xl font-bold ${stats.totalRemainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.totalRemainingAmount, currency)}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stats.totalRemainingAmount >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                }`}>
                  {stats.totalRemainingAmount >= 0 ? (
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
                  <p className="text-sm font-medium text-muted-foreground">{t('overview.title')}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">{stats.onTrackCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">{stats.atRiskCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs">{stats.overBudgetCount}</span>
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
            <CardTitle>{t('budgetProgress')}</CardTitle>
            <CardDescription>
              {t('spendingVsBudget')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {formatCurrency(stats.totalSpentAmount, currency)} {t('of')} {formatCurrency(stats.totalBudgetAmount, currency)}
                </span>
                <span className={`text-sm font-medium ${
                  stats.overallProgress > 100 ? 'text-red-600' : stats.overallProgress > 80 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {formatPercentage(stats.overallProgress / 100)}
                </span>
              </div>
              <Progress 
                value={Math.min(stats.overallProgress, 100)} 
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
                <CardTitle>{t('overview.budgets')}</CardTitle>
                <CardDescription>
                  {t('manageBudgets')}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-green-600">
                  {stats.onTrackCount} {t('status.onTrack')}
                </Badge>
                <Badge variant="secondary" className="text-yellow-600">
                  {stats.atRiskCount} {t('status.atRisk')}
                </Badge>
                <Badge variant="secondary" className="text-red-600">
                  {stats.overBudgetCount} {t('status.overBudget')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {currentBudgets && currentBudgets.length > 0 ? (
                currentBudgets.map((budget, index) => {
                  const status = getBudgetStatus(budget);

                  return (
                    <motion.div
                      key={budget.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-medium text-foreground">{budget.name}</h3>
                              {budget.description && (
                                <p className="text-xs text-muted-foreground mt-1">{budget.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline"
                                className={status.color}
                              >
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {formatCurrency(budget.actual_spent, currency)} / {formatCurrency(budget.amount, currency)}
                              </span>
                              <span className={status.color}>
                                {formatPercentage(budget.percentage_used / 100)}
                              </span>
                            </div>
                            
                            <Progress 
                              value={Math.min(budget.percentage_used, 100)} 
                              className="h-2"
                            />
                            
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {budget.remaining >= 0 
                                  ? `${formatCurrency(budget.remaining, currency)} ${t('remaining')}`
                                  : `${formatCurrency(Math.abs(budget.remaining), currency)} ${t('overBudget')}`
                                }
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="capitalize">{budget.period}</span>
                                <span>•</span>
                                <span>{budget.days_remaining} {t('daysLeft')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Link href={`/dashboard/budget/${budget.id}/edit`}>
                          <Button variant="ghost" size="sm" title={t('actions.edit')}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title={t('actions.duplicate')}
                          onClick={() => handleDuplicateBudget(budget.id)}
                          disabled={isDuplicating}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          title={t('actions.delete')}
                          onClick={() => handleDeleteBudget(budget.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">{t('empty.title')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('empty.description')}
                  </p>
                  <Link href="/dashboard/budget/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('empty.createFirst')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
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
            <CardTitle>{t('tips.title')}</CardTitle>
            <CardDescription>
              {t('tips.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  {t('tips.realisticGoals.title')}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('tips.realisticGoals.description')}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  {t('tips.rule503020.title')}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t('tips.rule503020.description')}
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  {t('tips.reviewRegularly.title')}
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {t('tips.reviewRegularly.description')}
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                  {t('tips.planUnexpected.title')}
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {t('tips.planUnexpected.description')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}