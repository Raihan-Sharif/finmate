"use client";

import { StatCard } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CurrencyType } from "@/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  DollarSign,
} from "lucide-react";

interface TransactionStatsProps {
  stats: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    totalAmount: number;
    transactionCount: number;
    avgTransactionAmount: number;
  };
  showBalances: boolean;
  currency: CurrencyType;
}

export function TransactionStats({
  stats,
  showBalances,
  currency,
}: TransactionStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Income */}
      <StatCard
        title="Total Income"
        value={
          showBalances ? formatCurrency(stats.totalIncome, currency) : "••••••"
        }
        icon={<ArrowDownLeft className="w-5 h-5" />}
        color="green"
      />

      {/* Total Expenses */}
      <StatCard
        title="Total Expenses"
        value={
          showBalances
            ? formatCurrency(stats.totalExpenses, currency)
            : "••••••"
        }
        icon={<ArrowUpRight className="w-5 h-5" />}
        color="red"
      />

      {/* Net Amount */}
      <StatCard
        title="Net Amount"
        value={
          showBalances ? formatCurrency(stats.netAmount, currency) : "••••••"
        }
        icon={<DollarSign className="w-5 h-5" />}
        color={stats.netAmount >= 0 ? "green" : "red"}
      />

      {/* Transaction Count & Average */}
      <StatCard
        title="Transactions"
        value={stats.transactionCount.toString()}
        icon={<BarChart3 className="w-5 h-5" />}
        color="blue"
      >
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Avg:{" "}
            {showBalances
              ? formatCurrency(stats.avgTransactionAmount, currency)
              : "••••••"}
          </p>
        </div>
      </StatCard>
    </div>
  );
}
