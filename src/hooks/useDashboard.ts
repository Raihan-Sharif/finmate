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
} from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

interface DashboardData {
  stats: DashboardStats;
  monthlyData: MonthlyData[];
  categoryExpenses: CategoryExpense[];
  recentTransactions: RecentTransaction[];
  upcomingReminders: UpcomingReminder[];
  monthlyGoals: any[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useDashboard(): DashboardData {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total_income: 0,
    total_expenses: 0,
    net_balance: 0,
    monthly_budget: 0,
    budget_used_percentage: 0,
    investment_value: 0,
    investment_return: 0,
    pending_emis: 0,
    overdue_lendings: 0,
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>(
    []
  );
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [upcomingReminders, setUpcomingReminders] = useState<
    UpcomingReminder[]
  >([]);
  const [monthlyGoals, setMonthlyGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Get current month transactions
      const { data: transactions } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select("amount, type")
        .eq("user_id", user.id)
        .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

      // Calculate income and expenses
      const totalIncome =
        transactions
          ?.filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0) || 0;

      const totalExpenses =
        transactions
          ?.filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0) || 0;

      // Get monthly budget
      const { data: budgets } = await supabase
        .from(TABLES.BUDGETS)
        .select("amount")
        .eq("user_id", user.id)
        .eq("month", currentMonth.getMonth() + 1)
        .eq("year", currentMonth.getFullYear());

      const monthlyBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;

      // Get investments
      const { data: investments } = await supabase
        .from(TABLES.INVESTMENTS)
        .select("initial_amount, current_value")
        .eq("user_id", user.id);

      const investmentValue =
        investments?.reduce(
          (sum, inv) => sum + (inv.current_value || inv.initial_amount),
          0
        ) || 0;

      const investmentCost =
        investments?.reduce((sum, inv) => sum + inv.initial_amount, 0) || 0;

      const investmentReturn =
        investmentCost > 0
          ? ((investmentValue - investmentCost) / investmentCost) * 100
          : 0;

      // Get pending EMIs
      const { data: loans } = await supabase
        .from(TABLES.LOANS)
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active");

      const { data: pendingEmis } = await supabase
        .from(TABLES.EMI_PAYMENTS)
        .select("loan_id")
        .in("loan_id", loans?.map((l) => l.id) || [])
        .eq("is_paid", false)
        .lte("payment_date", format(new Date(), "yyyy-MM-dd"));

      // Get overdue lendings
      const { data: overdueLendings } = await supabase
        .from(TABLES.LENDING)
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["lent", "borrowed"])
        .lt("due_date", format(new Date(), "yyyy-MM-dd"));

      setStats({
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_balance: totalIncome - totalExpenses,
        monthly_budget: monthlyBudget,
        budget_used_percentage:
          monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0,
        investment_value: investmentValue,
        investment_return: investmentReturn,
        pending_emis: pendingEmis?.length || 0,
        overdue_lendings: overdueLendings?.length || 0,
      });
    } catch (err: any) {
      console.error("Error fetching stats:", err);
      setError("Failed to load dashboard statistics");
    }
  }, [user]);

  // Fetch monthly trend data
  const fetchMonthlyData = useCallback(async () => {
    if (!user) return;

    try {
      const months = [];
      const currentDate = new Date();

      // Get last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(currentDate, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { data: transactions } = await supabase
          .from(TABLES.TRANSACTIONS)
          .select("amount, type")
          .eq("user_id", user.id)
          .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
          .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

        const income =
          transactions
            ?.filter((t) => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0) || 0;

        const expenses =
          transactions
            ?.filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0) || 0;

        // Get budget for this month
        const { data: budgets } = await supabase
          .from(TABLES.BUDGETS)
          .select("amount")
          .eq("user_id", user.id)
          .eq("month", monthDate.getMonth() + 1)
          .eq("year", monthDate.getFullYear());

        const budget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;

        months.push({
          month: format(monthDate, "MMM yyyy"),
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
  }, [user]);

  // Fetch category breakdown
  const fetchCategoryExpenses = useCallback(async () => {
    if (!user) return;

    try {
      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data: expenseData } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select(
          `
          amount,
          category_id,
          categories (
            id,
            name,
            color
          )
        `
        )
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

      // Group by category
      const categoryMap = new Map();
      const totalExpenses =
        expenseData?.reduce((sum, t) => sum + t.amount, 0) || 0;

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

      // Calculate percentages and sort
      const categories = Array.from(categoryMap.values())
        .map((cat) => ({
          ...cat,
          percentage:
            totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8); // Top 8 categories

      setCategoryExpenses(categories);
    } catch (err: any) {
      console.error("Error fetching category expenses:", err);
    }
  }, [user]);

  // Fetch recent transactions
  const fetchRecentTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const { data: transactions } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select(
          `
          id,
          description,
          amount,
          type,
          transaction_date,
          vendor,
          categories (
            name
          )
        `
        )
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);

      const formattedTransactions =
        transactions?.map((t: any) => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category_name: t.categories?.name,
          transaction_date: t.transaction_date,
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
        .select(
          `
          id,
          loan_name,
          emi_amount,
          emi_payments (
            id,
            payment_date,
            amount,
            is_paid
          )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "active");

      loans?.forEach((loan) => {
        const upcomingEmi = loan.emi_payments
          ?.filter(
            (emi) => !emi.is_paid && new Date(emi.payment_date) <= nextWeek
          )
          .sort(
            (a, b) =>
              new Date(a.payment_date).getTime() -
              new Date(b.payment_date).getTime()
          )[0];

        if (upcomingEmi) {
          const daysUntilDue = differenceInDays(
            new Date(upcomingEmi.payment_date),
            today
          );
          reminders.push({
            id: upcomingEmi.id,
            type: "emi",
            title: `EMI Payment Due`,
            description: loan.loan_name,
            amount: upcomingEmi.amount,
            due_date: upcomingEmi.payment_date,
            days_until_due: daysUntilDue,
            priority:
              daysUntilDue <= 1 ? "high" : daysUntilDue <= 3 ? "medium" : "low",
          });
        }
      });

      // Get upcoming lending due dates
      const { data: lendings } = await supabase
        .from(TABLES.LENDING)
        .select("id, person_name, amount, due_date, type")
        .eq("user_id", user.id)
        .in("status", ["lent", "borrowed"])
        .gte("due_date", format(today, "yyyy-MM-dd"))
        .lte("due_date", format(nextWeek, "yyyy-MM-dd"));

      lendings?.forEach((lending) => {
        const daysUntilDue = differenceInDays(
          new Date(lending.due_date!),
          today
        );
        reminders.push({
          id: lending.id,
          type: "lending",
          title: `${lending.type === "lent" ? "Collection" : "Payment"} Due`,
          description: `${lending.type === "lent" ? "From" : "To"} ${
            lending.person_name
          }`,
          amount: lending.amount,
          due_date: lending.due_date!,
          days_until_due: daysUntilDue,
          priority:
            daysUntilDue <= 1 ? "high" : daysUntilDue <= 3 ? "medium" : "low",
        });
      });

      // Sort by due date
      reminders.sort((a, b) => a.days_until_due - b.days_until_due);

      setUpcomingReminders(reminders.slice(0, 5));
    } catch (err: any) {
      console.error("Error fetching upcoming reminders:", err);
    }
  }, [user]);

  // Fetch monthly goals
  const fetchMonthlyGoals = useCallback(async () => {
    if (!user) return;

    try {
      const currentMonth = new Date();
      const goals = [
        {
          id: "budget",
          title: "Stay within budget",
          progress: Math.min(stats.budget_used_percentage, 100),
          target: 100,
          status:
            stats.budget_used_percentage <= 100 ? "on-track" : "over-budget",
        },
        {
          id: "savings",
          title: "Save 20% of income",
          progress:
            stats.total_income > 0
              ? ((stats.total_income - stats.total_expenses) /
                  stats.total_income) *
                100
              : 0,
          target: 20,
          status:
            ((stats.total_income - stats.total_expenses) / stats.total_income) *
              100 >=
            20
              ? "achieved"
              : "in-progress",
        },
      ];

      setMonthlyGoals(goals);
    } catch (err: any) {
      console.error("Error fetching monthly goals:", err);
    }
  }, [user, stats]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchStats(),
        fetchMonthlyData(),
        fetchCategoryExpenses(),
        fetchRecentTransactions(),
        fetchUpcomingReminders(),
      ]);
    } catch (err: any) {
      console.error("Error refreshing dashboard data:", err);
      setError("Failed to refresh dashboard data");
    } finally {
      setLoading(false);
    }
  }, [
    user,
    fetchStats,
    fetchMonthlyData,
    fetchCategoryExpenses,
    fetchRecentTransactions,
    fetchUpcomingReminders,
  ]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  // Update monthly goals when stats change
  useEffect(() => {
    if (user && !loading) {
      fetchMonthlyGoals();
    }
  }, [user, stats, loading, fetchMonthlyGoals]);

  return {
    stats,
    monthlyData,
    categoryExpenses,
    recentTransactions,
    upcomingReminders,
    monthlyGoals,
    loading,
    error,
    refreshData,
  };
}
