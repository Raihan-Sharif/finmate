"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY_SYMBOLS } from "@/types";
import { motion } from "framer-motion";
import {
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  PiggyBank,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function DashboardOverviewPage() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [showBalances, setShowBalances] = useState(true);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const [stats] = useState({
    total_income: 5420.5,
    total_expenses: 3240.75,
    net_balance: 2179.75,
    monthly_budget: 4000.0,
    budget_used_percentage: 81.0,
    investment_value: 12500.0,
    investment_return: 8.5,
    pending_emis: 2,
    overdue_lendings: 0,
  });

  const currency = profile?.currency || "USD";
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    setLoading(false);
  }, [user, router]);

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate key metrics
  const savingsRate =
    stats.total_income > 0
      ? ((stats.total_income - stats.total_expenses) / stats.total_income) * 100
      : 0;

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
            <Card
              key={i}
              className="h-96 animate-pulse bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
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
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            asChild
          >
            <Link href="/transactions/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Link>
          </Button>
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
          change={stats.budget_used_percentage - 100}
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
                  stats.budget_used_percentage > 100
                    ? "destructive"
                    : stats.budget_used_percentage > 80
                    ? "warning"
                    : "default"
                }
              >
                {stats.budget_used_percentage.toFixed(1)}%
              </Badge>
            </div>
            <Progress
              value={Math.min(stats.budget_used_percentage, 100)}
              className="h-3"
              indicatorClassName={
                stats.budget_used_percentage > 100
                  ? "bg-red-500"
                  : stats.budget_used_percentage > 80
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

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              asChild
            >
              <Link href="/transactions/new?type=expense">
                <div className="flex flex-col items-center space-y-2">
                  <CreditCard className="w-8 h-8 text-red-600" />
                  <span>Add Expense</span>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              asChild
            >
              <Link href="/transactions/new?type=income">
                <div className="flex flex-col items-center space-y-2">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <span>Add Income</span>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              asChild
            >
              <Link href="/budget">
                <div className="flex flex-col items-center space-y-2">
                  <Wallet className="w-8 h-8 text-blue-600" />
                  <span>View Budget</span>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              asChild
            >
              <Link href="/investments">
                <div className="flex flex-col items-center space-y-2">
                  <PiggyBank className="w-8 h-8 text-purple-600" />
                  <span>Investments</span>
                </div>
              </Link>
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Getting Started */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Welcome to FinMate!
              </h3>
              <p className="text-blue-700 dark:text-blue-200 mb-4">
                Start by adding your first transaction to see your financial
                data come to life. Track expenses, set budgets, and achieve your
                financial goals.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  asChild
                >
                  <Link href="/transactions/new">
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Transaction
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/budget">Set Up Budget</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Stats Footer */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">0</div>
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
