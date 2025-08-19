"use client";

import { supabase, TABLES } from "@/lib/supabase/client";
import {
  CategoryExpense,
  DashboardStats,
  MonthlyData,
  RecentTransaction,
  UpcomingReminder,
} from "@/types";
import {
  addDays,
  differenceInDays,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
  subDays,
} from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

interface EnhancedDashboardStats extends DashboardStats {
  total_accounts: number;
  total_account_balance: number;
  pending_emis: number;
  overdue_lendings: number;
  total_investments: number;
  total_investment_value: number;
  investment_return: number;
  total_loans: number;
  total_loan_amount: number;
  budget_alerts_count: number;
  financial_health_score: number;
}

interface AccountSummary {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  include_in_total: boolean;
  realtime_balance: number;
}

interface BudgetAlert {
  id: string;
  name: string;
  category_name: string;
  amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  is_over_budget: boolean;
  status: 'warning' | 'danger' | 'normal';
}

interface EnhancedDashboardData {
  stats: EnhancedDashboardStats;
  monthlyData: MonthlyData[];
  categoryExpenses: CategoryExpense[];
  recentTransactions: RecentTransaction[];
  upcomingReminders: UpcomingReminder[];
  accounts: AccountSummary[];
  budgetAlerts: BudgetAlert[];
  monthlyGoals: any[];
  loading: boolean;
  error: string | null;
  refreshData: (period?: string) => Promise<void>;
  setPeriod: (period: string) => void;
  currentPeriod: string;
}

export function useEnhancedDashboard(): EnhancedDashboardData {
  const { user, profile } = useAuth();
  const [currentPeriod, setCurrentPeriod] = useState('30d');
  
  const [stats, setStats] = useState<EnhancedDashboardStats>({
    total_income: 0,
    total_expenses: 0,
    net_balance: 0,
    monthly_budget: 0,
    budget_used_percentage: 0,
    investment_value: 0,
    investment_return: 0,
    pending_emis: 0,
    overdue_lendings: 0,
    total_accounts: 0,
    total_account_balance: 0,
    total_investments: 0,
    total_investment_value: 0,
    total_loans: 0,
    total_loan_amount: 0,
    budget_alerts_count: 0,
    financial_health_score: 0,
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminder[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get date range based on period
  const getDateRange = (period: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (period) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '6m':
        startDate = subMonths(now, 6);
        break;
      case '1y':
        startDate = subMonths(now, 12);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        return { startDate: null, endDate: null };
      default:
        startDate = subDays(now, 30);
        break;
    }

    return {
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd")
    };
  };

  // Fetch enhanced dashboard statistics
  const fetchStats = useCallback(async (period: string = currentPeriod) => {
    if (!user) return;

    try {
      const { startDate, endDate } = getDateRange(period);
      
      // Get transactions for the period
      let transactionQuery = supabase
        .from(TABLES.TRANSACTIONS)
        .select("amount, type, date")
        .eq("user_id", user.id);
      
      if (startDate && endDate) {
        transactionQuery = transactionQuery
          .gte("date", startDate)
          .lte("date", endDate);
      }

      const { data: transactions } = await transactionQuery;

      // Calculate income and expenses
      const totalIncome = transactions
        ?.filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const totalExpenses = transactions
        ?.filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      // Get current accounts and balances
      const { data: accountsData } = await supabase
        .from(TABLES.ACCOUNTS)
        .select("id, name, type, balance, currency, include_in_total")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq("is_active", true);

      const totalAccountBalance = accountsData
        ?.filter(acc => acc.include_in_total)
        .reduce((sum, acc) => sum + acc.balance, 0) || 0;

      // Get monthly budget
      const currentMonth = new Date();
      const { data: budgets } = await supabase
        .from(TABLES.BUDGETS)
        .select("amount, spent_amount")
        .eq("user_id", user.id)
        .eq("month", currentMonth.getMonth() + 1)
        .eq("year", currentMonth.getFullYear());

      const monthlyBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;
      const totalBudgetSpent = budgets?.reduce((sum, b) => sum + (b.spent_amount || 0), 0) || 0;

      // Get investments
      const { data: investments } = await supabase
        .from(TABLES.INVESTMENTS)
        .select("initial_amount, current_value")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const investmentValue = investments?.reduce(
        (sum, inv) => sum + (inv.current_value || inv.initial_amount), 0
      ) || 0;

      const investmentCost = investments?.reduce((sum, inv) => sum + inv.initial_amount, 0) || 0;
      const investmentReturn = investmentCost > 0 ? ((investmentValue - investmentCost) / investmentCost) * 100 : 0;
      
      // Get loans
      const { data: loans } = await supabase
        .from(TABLES.LOANS)
        .select("outstanding_balance, loan_amount")
        .eq("user_id", user.id)
        .in("status", ["active", "pending"]);

      const totalLoanAmount = loans?.reduce((sum, loan) => sum + loan.loan_amount, 0) || 0;
      const totalOutstandingBalance = loans?.reduce((sum, loan) => sum + loan.outstanding_balance, 0) || 0;

      // Get pending EMIs (past due date)
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: pendingLoans } = await supabase
        .from(TABLES.LOANS)
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .lte("next_due_date", today);

      const pendingEmis = pendingLoans?.length || 0;

      // Get overdue lendings
      const { data: overdueLendings } = await supabase
        .from(TABLES.LENDING)
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["pending", "partial"])
        .lt("due_date", format(new Date(), "yyyy-MM-dd"));

      // Calculate financial health score
      const healthScore = calculateFinancialHealthScore({
        budgetUsage: monthlyBudget > 0 ? (totalBudgetSpent / monthlyBudget) * 100 : 0,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
        investmentValue,
        pendingEmis,
        overdueLendingsCount: overdueLendings?.length || 0,
      });

      setStats({
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_balance: totalIncome - totalExpenses,
        monthly_budget: monthlyBudget,
        budget_used_percentage: monthlyBudget > 0 ? (totalBudgetSpent / monthlyBudget) * 100 : 0,
        investment_value: investmentValue,
        investment_return: investmentReturn,
        pending_emis: pendingEmis,
        overdue_lendings: overdueLendings?.length || 0,
        total_accounts: accountsData?.length || 0,
        total_account_balance: totalAccountBalance,
        total_investments: investments?.length || 0,
        total_investment_value: investmentValue,
        total_loans: loans?.length || 0,
        total_loan_amount: totalOutstandingBalance,
        budget_alerts_count: 0, // Will be calculated in fetchBudgetAlerts
        financial_health_score: healthScore,
      });
    } catch (err: any) {
      console.error("Error fetching enhanced stats:", err);
      setError("Failed to load dashboard statistics");
    }
  }, [user, currentPeriod]);

  // Calculate financial health score
  const calculateFinancialHealthScore = (params: {
    budgetUsage: number;
    savingsRate: number;
    investmentValue: number;
    pendingEmis: number;
    overdueLendingsCount: number;
  }) => {
    let score = 0;

    // Budget adherence (30%)
    if (params.budgetUsage <= 70) score += 30;
    else if (params.budgetUsage <= 90) score += 20;
    else if (params.budgetUsage <= 100) score += 10;

    // Savings rate (25%)
    if (params.savingsRate >= 30) score += 25;
    else if (params.savingsRate >= 20) score += 20;
    else if (params.savingsRate >= 10) score += 15;
    else if (params.savingsRate >= 0) score += 5;

    // Investment presence (20%)
    if (params.investmentValue > 0) score += 20;

    // Debt management (15%)
    if (params.pendingEmis === 0) score += 15;
    else if (params.pendingEmis <= 2) score += 10;
    else if (params.pendingEmis <= 5) score += 5;

    // Payment discipline (10%)
    if (params.overdueLendingsCount === 0) score += 10;
    else if (params.overdueLendingsCount <= 1) score += 5;

    return Math.max(0, Math.min(100, score));
  };

  // Fetch monthly trend data with dynamic period
  const fetchMonthlyData = useCallback(async (period: string = currentPeriod) => {
    if (!user) return;

    try {
      let monthsToShow = 6;
      if (period === '1y') monthsToShow = 12;
      else if (period === '6m') monthsToShow = 6;
      else if (period === '90d') monthsToShow = 3;

      const months = [];
      const currentDate = new Date();

      for (let i = monthsToShow - 1; i >= 0; i--) {
        const monthDate = subMonths(currentDate, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { data: transactions } = await supabase
          .from(TABLES.TRANSACTIONS)
          .select("amount, type")
          .eq("user_id", user.id)
          .gte("date", format(monthStart, "yyyy-MM-dd"))
          .lte("date", format(monthEnd, "yyyy-MM-dd"));

        const income = transactions?.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0) || 0;
        const expenses = transactions?.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0) || 0;

        // Get budget for this month
        const { data: budgets } = await supabase
          .from(TABLES.BUDGETS)
          .select("amount")
          .eq("user_id", user.id)
          .eq("month", monthDate.getMonth() + 1)
          .eq("year", monthDate.getFullYear());

        const budget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;

        months.push({
          month: format(monthDate, "MMM"),
          income,
          expenses,
          net: income - expenses,
          budget,
        });
      }

      setMonthlyData(months);
    } catch (err: any) {
      console.error("Error fetching monthly data:", err);
    }
  }, [user, currentPeriod]);

  // Fetch category breakdown with period filtering
  const fetchCategoryExpenses = useCallback(async (period: string = currentPeriod) => {
    if (!user) return;

    try {
      const { startDate, endDate } = getDateRange(period);
      
      let expenseQuery = supabase
        .from(TABLES.TRANSACTIONS)
        .select(`
          amount,
          category_id,
          categories (
            id,
            name,
            color
          )
        `)
        .eq("user_id", user.id)
        .eq("type", "expense");

      if (startDate && endDate) {
        expenseQuery = expenseQuery.gte("date", startDate).lte("date", endDate);
      }

      const { data: expenseData } = await expenseQuery;

      const categoryMap = new Map();
      const totalExpenses = expenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;

      expenseData?.forEach((transaction: any) => {
        const categoryId = transaction.category_id || "uncategorized";
        const categoryName = transaction.categories?.name || "Uncategorized";
        const categoryColor = transaction.categories?.color || "#6B7280";

        if (categoryMap.has(categoryId)) {
          const existing = categoryMap.get(categoryId);
          existing.amount += transaction.amount;
          existing.transactions_count += 1;
        } else {
          categoryMap.set(categoryId, {
            category_id: categoryId,
            category_name: categoryName,
            amount: transaction.amount,
            percentage: 0,
            color: categoryColor,
            transactions_count: 1,
          });
        }
      });

      const categories = Array.from(categoryMap.values())
        .map((cat) => ({
          ...cat,
          percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8);

      setCategoryExpenses(categories);
    } catch (err: any) {
      console.error("Error fetching category expenses:", err);
    }
  }, [user, currentPeriod]);

  // Fetch recent transactions
  const fetchRecentTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const { data: transactions } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select(`
          id,
          description,
          amount,
          type,
          date,
          vendor,
          categories (
            name
          )
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);

      const formattedTransactions = transactions?.map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category_name: t.categories?.name,
        transaction_date: t.date,
        vendor: t.vendor,
      })) || [];

      setRecentTransactions(formattedTransactions);
    } catch (err: any) {
      console.error("Error fetching recent transactions:", err);
    }
  }, [user]);

  // Fetch upcoming reminders
  const fetchUpcomingReminders = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      const nextWeek = addDays(today, 7);
      const reminders: UpcomingReminder[] = [];

      // Get upcoming EMI payments
      const { data: loans } = await supabase
        .from(TABLES.LOANS)
        .select("id, loan_name, emi_amount, next_due_date")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("next_due_date", format(today, "yyyy-MM-dd"))
        .lte("next_due_date", format(nextWeek, "yyyy-MM-dd"));

      loans?.forEach((loan) => {
        if (loan.next_due_date) {
          const daysUntilDue = differenceInDays(new Date(loan.next_due_date), today);
          reminders.push({
            id: loan.id,
            type: "emi",
            title: "EMI Payment Due",
            description: loan.loan_name,
            amount: loan.emi_amount,
            due_date: loan.next_due_date,
            days_until_due: daysUntilDue,
            priority: daysUntilDue <= 1 ? "high" : daysUntilDue <= 3 ? "medium" : "low",
          });
        }
      });

      // Get upcoming lending due dates
      const { data: lendings } = await supabase
        .from(TABLES.LENDING)
        .select("id, person_name, amount, due_date, type")
        .eq("user_id", user.id)
        .in("status", ["pending", "partial"])
        .gte("due_date", format(today, "yyyy-MM-dd"))
        .lte("due_date", format(nextWeek, "yyyy-MM-dd"));

      lendings?.forEach((lending) => {
        if (lending.due_date) {
          const daysUntilDue = differenceInDays(new Date(lending.due_date), today);
          reminders.push({
            id: lending.id,
            type: "lending",
            title: `${lending.type === "lent" ? "Collection" : "Payment"} Due`,
            description: `${lending.type === "lent" ? "From" : "To"} ${lending.person_name}`,
            amount: lending.amount,
            due_date: lending.due_date,
            days_until_due: daysUntilDue,
            priority: daysUntilDue <= 1 ? "high" : daysUntilDue <= 3 ? "medium" : "low",
          });
        }
      });

      reminders.sort((a, b) => a.days_until_due - b.days_until_due);
      setUpcomingReminders(reminders.slice(0, 5));
    } catch (err: any) {
      console.error("Error fetching upcoming reminders:", err);
    }
  }, [user]);

  // Fetch accounts with real-time balance calculation
  const fetchAccounts = useCallback(async () => {
    if (!user) return;

    try {
      const { data: accountsData } = await supabase
        .from(TABLES.ACCOUNTS)
        .select("id, name, type, balance, currency, include_in_total")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq("is_active", true);

      // Get recent transactions to calculate real-time balance
      const { data: recentTxns } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select("account_id, type, amount, transfer_to_account_id")
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const accountBalances = accountsData?.map(account => {
        let realtimeBalance = account.balance;

        recentTxns?.forEach(txn => {
          if (txn.account_id === account.id) {
            if (txn.type === 'income') realtimeBalance += txn.amount;
            else if (txn.type === 'expense') realtimeBalance -= txn.amount;
          }
          if (txn.transfer_to_account_id === account.id) {
            realtimeBalance += txn.amount;
          }
        });

        return {
          ...account,
          realtime_balance: realtimeBalance
        };
      }) || [];

      setAccounts(accountBalances);
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
    }
  }, [user]);

  // Fetch budget alerts
  const fetchBudgetAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const currentMonth = new Date();
      const { data: budgets } = await supabase
        .from(TABLES.BUDGETS)
        .select(`
          id,
          name,
          amount,
          spent_amount,
          remaining_amount,
          categories (
            name
          )
        `)
        .eq("user_id", user.id)
        .eq("month", currentMonth.getMonth() + 1)
        .eq("year", currentMonth.getFullYear());

      const alerts = budgets?.map((budget: any) => {
        const percentageUsed = budget.amount > 0 ? ((budget.spent_amount || 0) / budget.amount) * 100 : 0;
        return {
          id: budget.id,
          name: budget.name,
          category_name: budget.categories?.name || 'General',
          amount: budget.amount,
          spent_amount: budget.spent_amount || 0,
          remaining_amount: budget.remaining_amount || (budget.amount - (budget.spent_amount || 0)),
          percentage_used: percentageUsed,
          is_over_budget: percentageUsed > 100,
          status: percentageUsed > 100 ? 'danger' as const : percentageUsed > 85 ? 'warning' as const : 'normal' as const
        };
      }).filter(alert => alert.percentage_used > 85) || [];

      setBudgetAlerts(alerts);
      
      // Update stats with alert count
      setStats(prev => ({ ...prev, budget_alerts_count: alerts.length }));
    } catch (err: any) {
      console.error("Error fetching budget alerts:", err);
    }
  }, [user]);

  // Fetch monthly goals
  const fetchMonthlyGoals = useCallback(async () => {
    if (!user || !stats.total_income) return;

    try {
      const savingsRate = stats.total_income > 0 
        ? ((stats.total_income - stats.total_expenses) / stats.total_income) * 100 
        : 0;

      // Get current month investment progress
      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const { data: monthlyInvestments } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .eq("category_id", await getInvestmentCategoryId())
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"));

      const monthlyInvestmentAmount = monthlyInvestments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
      const investmentTarget = stats.total_income * 0.15; // 15% of income target
      const investmentProgress = investmentTarget > 0 ? (monthlyInvestmentAmount / investmentTarget) * 100 : 0;

      const goals = [
        {
          id: "budget",
          title: "Stay within budget",
          progress: Math.min(stats.budget_used_percentage, 100),
          target: 100,
          status: stats.budget_used_percentage <= 80 ? "on-track" : stats.budget_used_percentage <= 100 ? "warning" : "over-budget",
        },
        {
          id: "savings",
          title: "Save 20% of income",
          progress: Math.max(0, savingsRate),
          target: 20,
          status: savingsRate >= 20 ? "achieved" : savingsRate >= 10 ? "on-track" : "needs-attention",
        },
        {
          id: "investments",
          title: "Invest 15% of income",
          progress: Math.min(investmentProgress, 100),
          target: 100,
          status: investmentProgress >= 100 ? "achieved" : investmentProgress >= 50 ? "on-track" : "needs-attention",
        }
      ];

      setMonthlyGoals(goals);
    } catch (err: any) {
      console.error("Error calculating monthly goals:", err);
    }
  }, [user, stats]);

  // Helper function to get investment category ID
  const getInvestmentCategoryId = useCallback(async () => {
    if (!user) return null;
    
    const { data: category } = await supabase
      .from(TABLES.CATEGORIES)
      .select("id")
      .eq("user_id", user.id)
      .eq("name", "Investments")
      .single();
    
    return category?.id || null;
  }, [user]);

  // Set period and refresh data
  const setPeriod = useCallback((period: string) => {
    setCurrentPeriod(period);
  }, []);

  // Refresh all data
  const refreshData = useCallback(async (period?: string) => {
    if (!user) return;

    const targetPeriod = period || currentPeriod;
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchStats(targetPeriod),
        fetchMonthlyData(targetPeriod),
        fetchCategoryExpenses(targetPeriod),
        fetchRecentTransactions(),
        fetchUpcomingReminders(),
        fetchAccounts(),
        fetchBudgetAlerts(),
      ]);
    } catch (err: any) {
      console.error("Error refreshing enhanced dashboard data:", err);
      setError("Failed to refresh dashboard data");
    } finally {
      setLoading(false);
    }
  }, [
    user,
    currentPeriod,
    fetchStats,
    fetchMonthlyData,
    fetchCategoryExpenses,
    fetchRecentTransactions,
    fetchUpcomingReminders,
    fetchAccounts,
    fetchBudgetAlerts,
  ]);

  // Load data on mount and when user/period changes
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, currentPeriod, refreshData]);

  // Update monthly goals when stats change
  useEffect(() => {
    if (user && !loading && stats.total_income !== undefined) {
      fetchMonthlyGoals();
    }
  }, [user, stats, loading, fetchMonthlyGoals]);

  return {
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
    currentPeriod,
  };
}