"use client";

import { AIInsights } from "@/components/dashboard/AIInsights";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { MonthlyGoals } from "@/components/dashboard/MonthlyGoals";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { UpcomingReminders } from "@/components/dashboard/UpcomingReminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY_SYMBOLS } from "@/types";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const {
    stats,
    monthlyData,
    categoryExpenses,
    recentTransactions,
    upcomingReminders,
    monthlyGoals,
    loading,
    error,
    refreshData,
  } = useDashboard();

  const [showBalances, setShowBalances] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const currency = profile?.currency || "USD";
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  // Calculate key metrics
  const netWorth =
    stats.total_income - stats.total_expenses + stats.investment_value;
  const monthlyBudgetUsage =
    stats.monthly_budget > 0
      ? (stats.total_expenses / stats.monthly_budget) * 100
      : 0;
  const savingsRate =
    stats.total_income > 0
      ? ((stats.total_income - stats.total_expenses) / stats.total_income) * 100
      : 0;

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCard key={i} title="" value="" loading />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-96" loading />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Unable to load dashboard
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refreshData}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {profile?.full_name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Here's your financial overview for {currentMonth}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
            className="text-muted-foreground"
          >
            {showBalances ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
          <QuickActions />
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Net Balance"
          value={
            showBalances
              ? formatCurrency(stats.net_balance, currency)
              : "••••••"
          }
          change={savingsRate}
          changeLabel="savings rate"
          icon={<DollarSign className="w-6 h-6" />}
          color={stats.net_balance >= 0 ? "green" : "red"}
          hover
        />

        <StatCard
          title="Monthly Income"
          value={
            showBalances
              ? formatCurrency(stats.total_income, currency)
              : "••••••"
          }
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
          hover
        />

        <StatCard
          title="Monthly Expenses"
          value={
            showBalances
              ? formatCurrency(stats.total_expenses, currency)
              : "••••••"
          }
          change={monthlyBudgetUsage - 100}
          changeLabel="vs budget"
          icon={<CreditCard className="w-6 h-6" />}
          color="red"
          hover
        />

        <StatCard
          title="Investments"
          value={
            showBalances
              ? formatCurrency(stats.investment_value, currency)
              : "••••••"
          }
          change={stats.investment_return}
          changeLabel="return"
          icon={<PiggyBank className="w-6 h-6" />}
          color="purple"
          hover
        />
      </motion.div>

      {/* Budget Progress */}
      {stats.monthly_budget > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Monthly Budget</h3>
                <p className="text-sm text-muted-foreground">
                  {showBalances
                    ? `${formatCurrency(
                        stats.total_expenses,
                        currency
                      )} of ${formatCurrency(
                        stats.monthly_budget,
                        currency
                      )} used`
                    : "•••••• of •••••• used"}
                </p>
              </div>
              <Badge
                variant={
                  monthlyBudgetUsage > 100
                    ? "destructive"
                    : monthlyBudgetUsage > 80
                    ? "warning"
                    : "default"
                }
              >
                {monthlyBudgetUsage.toFixed(1)}%
              </Badge>
            </div>
            <Progress
              value={Math.min(monthlyBudgetUsage, 100)}
              className="h-3"
              indicatorClassName={
                monthlyBudgetUsage > 100
                  ? "bg-red-500"
                  : monthlyBudgetUsage > 80
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>0%</span>
              <span>100%</span>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <OverviewChart
            data={monthlyData}
            period={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            showBalances={showBalances}
            currency={currency}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CategoryBreakdown
            data={categoryExpenses}
            showBalances={showBalances}
            currency={currency}
          />
        </motion.div>
      </div>

      {/* Recent Activity and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <RecentTransactions
            transactions={recentTransactions}
            showBalances={showBalances}
            currency={currency}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <UpcomingReminders
            reminders={upcomingReminders}
            showBalances={showBalances}
            currency={currency}
          />

          <MonthlyGoals
            goals={monthlyGoals}
            showBalances={showBalances}
            currency={currency}
          />
        </motion.div>
      </div>

      {/* AI Insights */}
      <motion.div variants={itemVariants}>
        <AIInsights
          stats={stats}
          monthlyData={monthlyData}
          categoryExpenses={categoryExpenses}
          currency={currency}
        />
      </motion.div>

      {/* Quick Stats Footer */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {recentTransactions.length}
          </div>
          <div className="text-sm text-muted-foreground">Transactions</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {stats.pending_emis}
          </div>
          <div className="text-sm text-muted-foreground">Pending EMIs</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {stats.overdue_lendings}
          </div>
          <div className="text-sm text-muted-foreground">Overdue Lendings</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {savingsRate > 0 ? "+" : ""}
            {savingsRate.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Savings Rate</div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
