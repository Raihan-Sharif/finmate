"use client";

import MainLayout from "@/components/layout/MainLayout";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionStats } from "@/components/transactions/TransactionStats";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CurrencyType } from "@/types";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Download,
  Edit,
  Eye,
  EyeOff,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";
import Link from "next/link";
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

export default function TransactionsPage() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showBalances, setShowBalances] = useState(true);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [filters, setFilters] = useState({
    type: "all",
    category: "all",
    dateRange: "month",
    amountRange: { min: 0, max: 0 },
  });

  const {
    transactions,
    loading,
    error,
    totalCount,
    stats,
    deleteTransaction,
    bulkDelete,
    exportTransactions,
    refreshTransactions,
  } = useTransactions(filters, searchQuery);

  const currency = (profile?.currency as CurrencyType) || "USD";

  // Get icon for transaction type
  const getTransactionIcon = (type: "income" | "expense") => {
    return type === "income" ? (
      <ArrowDownLeft className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-red-600" />
    );
  };

  // Get category icon fallback
  const getCategoryIcon = (categoryName?: string) => {
    if (!categoryName) return "TR";
    return categoryName.charAt(0).toUpperCase();
  };

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map((t) => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;

    if (confirm(`Delete ${selectedTransactions.length} transaction(s)?`)) {
      await bulkDelete(selectedTransactions);
      setSelectedTransactions([]);
    }
  };

  const handleExport = async () => {
    await exportTransactions(filters);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-muted rounded w-48 animate-pulse" />
            <div className="flex space-x-2">
              <div className="h-10 bg-muted rounded w-32 animate-pulse" />
              <div className="h-10 bg-muted rounded w-32 animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} loading />
            ))}
          </div>

          <Card loading className="h-96" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
              Transactions
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your income and expenses
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowBalances(!showBalances)}
            >
              {showBalances ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>

            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button variant="outline" asChild>
              <Link href="/import">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Link>
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

        {/* Stats */}
        <motion.div variants={itemVariants}>
          <TransactionStats
            stats={stats}
            showBalances={showBalances}
            currency={currency}
          />
        </motion.div>

        {/* Filters and Search */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <CardTitle className="text-lg">All Transactions</CardTitle>

                <div className="flex items-center space-x-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>

                  {/* Bulk actions */}
                  {selectedTransactions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedTransactions.length} selected
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <TransactionFilters
                filters={filters}
                onFiltersChange={setFilters}
                totalCount={totalCount}
              />
            </CardHeader>

            <CardContent className="pt-0">
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <Button
                    variant="outline"
                    onClick={refreshTransactions}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No transactions found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ||
                    filters.type !== "all" ||
                    filters.category !== "all"
                      ? "Try adjusting your search or filters"
                      : "Start by adding your first transaction"}
                  </p>
                  <Button asChild>
                    <Link href="/transactions/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select all header */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={
                          selectedTransactions.length === transactions.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">
                        {transactions.length} transaction
                        {transactions.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Total:</span>
                      <span className="font-semibold">
                        {showBalances
                          ? formatCurrency(stats.totalAmount, currency)
                          : "••••••"}
                      </span>
                    </div>
                  </div>

                  {/* Transactions list */}
                  <div className="space-y-2">
                    {transactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                          selectedTransactions.includes(transaction.id)
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            : "bg-card hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedTransactions.includes(
                              transaction.id
                            )}
                            onChange={() =>
                              handleSelectTransaction(transaction.id)
                            }
                            className="rounded border-gray-300"
                          />

                          {/* Transaction icon */}
                          <Avatar className="h-12 w-12">
                            <AvatarFallback
                              className={`text-sm font-medium ${
                                transaction.type === "income"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              }`}
                            >
                              {getCategoryIcon(transaction.category?.name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-sm truncate">
                                {transaction.description}
                              </h4>
                              {getTransactionIcon(transaction.type)}
                            </div>

                            <div className="flex items-center space-x-3 mt-1">
                              {transaction.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {transaction.category.name}
                                </Badge>
                              )}
                              {transaction.vendor && (
                                <span className="text-xs text-muted-foreground">
                                  {transaction.vendor}
                                </span>
                              )}
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {formatDate(transaction.transaction_date, {
                                    format: "medium",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p
                              className={`font-semibold text-lg ${
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}
                              {showBalances
                                ? formatCurrency(transaction.amount, currency)
                                : "••••••"}
                            </p>
                            {transaction.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-32">
                                {transaction.notes}
                              </p>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/transactions/${transaction.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/transactions/${transaction.id}/edit`}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  deleteTransaction(transaction.id)
                                }
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
