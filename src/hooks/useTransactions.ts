"use client";

import { db, realtime, supabase, TABLES } from "@/lib/supabase/client";
import { Category, Transaction } from "@/types";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./useAuth";

interface TransactionFilters {
  type: string;
  category: string;
  dateRange: string;
  amountRange: { min: number; max: number };
}

interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  totalAmount: number;
  transactionCount: number;
  avgTransactionAmount: number;
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  stats: TransactionStats;
  createTransaction: (data: Partial<Transaction>) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    data: Partial<Transaction>
  ) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  exportTransactions: (filters: TransactionFilters) => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

export function useTransactions(
  filters: TransactionFilters,
  searchQuery?: string
): UseTransactionsReturn {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<TransactionStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0,
    totalAmount: 0,
    transactionCount: 0,
    avgTransactionAmount: 0,
  });

  // Get date range based on filter
  const getDateRange = (dateRange: string) => {
    const now = new Date();

    switch (dateRange) {
      case "today":
        return {
          start: format(now, "yyyy-MM-dd"),
          end: format(now, "yyyy-MM-dd"),
        };
      case "week":
        return {
          start: format(subDays(now, 7), "yyyy-MM-dd"),
          end: format(now, "yyyy-MM-dd"),
        };
      case "month":
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd"),
          end: format(endOfMonth(now), "yyyy-MM-dd"),
        };
      case "quarter":
        return {
          start: format(subMonths(now, 3), "yyyy-MM-dd"),
          end: format(now, "yyyy-MM-dd"),
        };
      case "year":
        return {
          start: format(new Date(now.getFullYear(), 0, 1), "yyyy-MM-dd"),
          end: format(now, "yyyy-MM-dd"),
        };
      default:
        return {
          start: format(subMonths(now, 1), "yyyy-MM-dd"),
          end: format(now, "yyyy-MM-dd"),
        };
    }
  };

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch global categories only (no user_id filter needed)
      const { data: categoriesData, error } = await supabase
        .from(TABLES.CATEGORIES)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(categoriesData || []);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
    }
  }, [user]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Build query
      const dateRange = getDateRange(filters.dateRange);
      let query = supabase
        .from(TABLES.TRANSACTIONS)
        .select(
          `
          *,
          categories (
            id,
            name,
            color,
            icon
          ),
          subcategories (
            id,
            name,
            color,
            icon
          ),
          accounts!transactions_account_id_fkey (
            id,
            name
          )
        `
        )
        .eq("user_id", user.id)
        .gte("date", dateRange.start)
        .lte("date", dateRange.end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.type !== "all") {
        query = query.eq("type", filters.type);
      }

      if (filters.category !== "all") {
        query = query.eq("category_id", filters.category);
      }

      if (filters.amountRange.min > 0) {
        query = query.gte("amount", filters.amountRange.min);
      }

      if (filters.amountRange.max > 0) {
        query = query.lte("amount", filters.amountRange.max);
      }

      // Apply search
      if (searchQuery) {
        query = query.or(
          `description.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%,vendor.ilike.%${searchQuery}%`
        );
      }

      const {
        data: transactionsData,
        error: transactionsError,
        count,
      } = await query;

      if (transactionsError) throw transactionsError;

      setTransactions(transactionsData || []);
      setTotalCount(count || 0);

      // Calculate stats
      const income =
        transactionsData
          ?.filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0) || 0;

      const expenses =
        transactionsData
          ?.filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0) || 0;

      const totalAmount =
        transactionsData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const transactionCount = transactionsData?.length || 0;

      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        netAmount: income - expenses,
        totalAmount,
        transactionCount,
        avgTransactionAmount:
          transactionCount > 0 ? totalAmount / transactionCount : 0,
      });
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user, filters, searchQuery]);

  // Create transaction
  const createTransaction = useCallback(
    async (data: Partial<Transaction>) => {
      if (!user) throw new Error("User not authenticated");

      try {
        const transaction = await db.create<Transaction>(TABLES.TRANSACTIONS, {
          ...data,
          user_id: user.id,
        });

        toast.success("Transaction created successfully");
        await fetchTransactions();
        return transaction;
      } catch (err: any) {
        console.error("Error creating transaction:", err);
        toast.error("Failed to create transaction");
        throw err;
      }
    },
    [user, fetchTransactions]
  );

  // Update transaction
  const updateTransaction = useCallback(
    async (id: string, data: Partial<Transaction>) => {
      if (!user) throw new Error("User not authenticated");

      try {
        const transaction = await db.update<Transaction>(
          TABLES.TRANSACTIONS,
          id,
          data
        );

        toast.success("Transaction updated successfully");
        await fetchTransactions();
        return transaction;
      } catch (err: any) {
        console.error("Error updating transaction:", err);
        toast.error("Failed to update transaction");
        throw err;
      }
    },
    [user, fetchTransactions]
  );

  // Delete transaction
  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) return;

      if (!confirm("Are you sure you want to delete this transaction?")) {
        return;
      }

      try {
        await db.delete(TABLES.TRANSACTIONS, id);
        toast.success("Transaction deleted successfully");
        await fetchTransactions();
      } catch (err: any) {
        console.error("Error deleting transaction:", err);
        toast.error("Failed to delete transaction");
      }
    },
    [user, fetchTransactions]
  );

  // Bulk delete transactions
  const bulkDelete = useCallback(
    async (ids: string[]) => {
      if (!user || ids.length === 0) return;

      try {
        await Promise.all(ids.map((id) => db.delete(TABLES.TRANSACTIONS, id)));
        toast.success(`${ids.length} transaction(s) deleted successfully`);
        await fetchTransactions();
      } catch (err: any) {
        console.error("Error bulk deleting transactions:", err);
        toast.error("Failed to delete transactions");
      }
    },
    [user, fetchTransactions]
  );

  // Export transactions
  const exportTransactions = useCallback(
    async (exportFilters: TransactionFilters) => {
      if (!user) return;

      try {
        const dateRange = getDateRange(exportFilters.dateRange);

        let query = supabase
          .from(TABLES.TRANSACTIONS)
          .select(
            `
          *,
          categories (
            name
          )
        `
          )
          .eq("user_id", user.id)
          .gte("date", dateRange.start)
          .lte("date", dateRange.end)
          .order("date", { ascending: false });

        if (exportFilters.type !== "all") {
          query = query.eq("type", exportFilters.type);
        }

        if (exportFilters.category !== "all") {
          query = query.eq("category_id", exportFilters.category);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Convert to CSV
        const csvHeaders = [
          "Date",
          "Description",
          "Category",
          "Type",
          "Amount",
          "Vendor",
          "Notes",
        ];

        const csvRows =
          data?.map((transaction) => [
            transaction.date,
            transaction.description,
            transaction.categories?.name || "",
            transaction.type,
            transaction.amount.toString(),
            transaction.vendor || "",
            transaction.notes || "",
          ]) || [];

        const csvContent = [
          csvHeaders.join(","),
          ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
        ].join("\n");

        // Download file
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Transactions exported successfully");
      } catch (err: any) {
        console.error("Error exporting transactions:", err);
        toast.error("Failed to export transactions");
      }
    },
    [user]
  );

  // Refresh transactions
  const refreshTransactions = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchTransactions();
    }
  }, [user, fetchCategories, fetchTransactions]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = realtime.subscribe(
      TABLES.TRANSACTIONS,
      user.id,
      (payload: any) => {
        console.log("Transaction update:", payload);
        // Refresh transactions on any change
        fetchTransactions();
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchTransactions]);

  return {
    transactions,
    categories,
    loading,
    error,
    totalCount,
    stats,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkDelete,
    exportTransactions,
    refreshTransactions,
  };
}
