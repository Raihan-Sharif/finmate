"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { CurrencyType, RecentTransaction } from "@/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Filter,
  Plus,
  Receipt,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
  showBalances: boolean;
  currency: CurrencyType;
}

export function RecentTransactions({
  transactions,
  showBalances,
  currency,
}: RecentTransactionsProps) {
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

    const iconMap: Record<string, string> = {
      "Food & Dining": "🍽️",
      Transportation: "🚗",
      Shopping: "🛍️",
      Entertainment: "🎬",
      "Bills & Utilities": "📄",
      Healthcare: "🏥",
      Education: "📚",
      Travel: "✈️",
      Salary: "💼",
      Freelance: "💻",
      Business: "🏢",
      "Investment Returns": "📈",
      Gift: "🎁",
    };

    return iconMap[categoryName] || categoryName.charAt(0).toUpperCase();
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.transaction_date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, RecentTransaction[]>);

  if (!transactions.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Transactions</CardTitle>
            <Button size="sm" asChild>
              <Link href="/transactions">
                <Plus className="w-4 h-4 mr-1" />
                Add Transaction
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start by adding your first transaction
            </p>
            <Button className="mt-4" asChild>
              <Link href="/transactions/new">Add Transaction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">
              Recent Transactions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Latest {transactions.length} transactions
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
            <Button size="sm" asChild>
              <Link href="/transactions">View All</Link>
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex items-center space-x-4 pt-2">
          <div className="flex items-center space-x-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">Income:</span>
            <span className="font-medium text-green-600">
              {showBalances
                ? formatCurrency(
                    transactions
                      .filter((t) => t.type === "income")
                      .reduce((sum, t) => sum + t.amount, 0),
                    currency
                  )
                : "••••••"}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-sm">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-muted-foreground">Expenses:</span>
            <span className="font-medium text-red-600">
              {showBalances
                ? formatCurrency(
                    transactions
                      .filter((t) => t.type === "expense")
                      .reduce((sum, t) => sum + t.amount, 0),
                    currency
                  )
                : "••••••"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(
            ([date, dayTransactions]) => (
              <div key={date} className="space-y-2">
                {/* Date header */}
                <div className="flex items-center space-x-2 pb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {formatRelativeDate(new Date(date))}
                  </h4>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Transactions for this date */}
                <div className="space-y-2">
                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Transaction icon */}
                        <Avatar className="h-10 w-10">
                          <AvatarFallback
                            className={`text-xs font-medium ${
                              transaction.type === "income"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {getCategoryIcon(transaction.category_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm truncate">
                              {transaction.description}
                            </h4>
                            {getTransactionIcon(transaction.type)}
                          </div>

                          <div className="flex items-center space-x-2 mt-1">
                            {transaction.category_name && (
                              <Badge variant="secondary" className="text-xs">
                                {transaction.category_name}
                              </Badge>
                            )}
                            {transaction.vendor && (
                              <span className="text-xs text-muted-foreground">
                                {transaction.vendor}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-semibold ${
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
                        <p className="text-xs text-muted-foreground">
                          {new Date(
                            transaction.transaction_date
                          ).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* View more link */}
          {transactions.length >= 10 && (
            <div className="pt-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/transactions">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  View All Transactions
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
