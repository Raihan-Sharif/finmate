"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { CategoryExpense, CurrencyType } from "@/types";
import { ArrowUpRight, BarChart3, PieChart as PieIcon } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CategoryBreakdownProps {
  data: CategoryExpense[];
  showBalances: boolean;
  currency: CurrencyType;
}

export function CategoryBreakdown({
  data,
  showBalances,
  currency,
}: CategoryBreakdownProps) {
  const [viewType, setViewType] = useState<"pie" | "bar" | "list">("pie");

  // Colors for the pie chart
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#F97316",
    "#06B6D4",
    "#84CC16",
    "#EC4899",
    "#6366F1",
    "#14B8A6",
    "#F59E0B",
  ];

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {data.category_name}
          </p>
          <p className="text-sm text-muted-foreground">
            Amount:{" "}
            {showBalances ? formatCurrency(data.amount, currency) : "••••••"}
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: {formatPercentage(data.percentage)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.transactions_count} transaction
            {data.transactions_count !== 1 ? "s" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={120}
          paddingAngle={2}
          dataKey="amount"
          label={({ percentage }) => `${percentage.toFixed(1)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <XAxis
          dataKey="category_name"
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(value) =>
            showBalances ? `${value / 1000}k` : "••••"
          }
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="amount"
          radius={[4, 4, 0, 0]}
          fill={(entry, index) => entry.color || COLORS[index % COLORS.length]}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || COLORS[index % COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {data.map((category, index) => (
        <div
          key={category.category_id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{
                backgroundColor:
                  category.color || COLORS[index % COLORS.length],
              }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {category.category_name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {category.transactions_count} transaction
                {category.transactions_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <p className="font-semibold text-sm">
              {showBalances
                ? formatCurrency(category.amount, currency)
                : "••••••"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(category.percentage)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  if (!data.length) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PieIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No expense data available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start adding transactions to see your spending breakdown
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">
              Category Breakdown
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Expenses by category this month
            </p>
          </div>

          {/* View type selector */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewType === "pie" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("pie")}
              className="h-7 px-2"
            >
              <PieIcon className="w-3 h-3" />
            </Button>
            <Button
              variant={viewType === "bar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("bar")}
              className="h-7 px-2"
            >
              <BarChart3 className="w-3 h-3" />
            </Button>
            <Button
              variant={viewType === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewType("list")}
              className="h-7 px-2 text-xs"
            >
              List
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {viewType === "list" ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Expenses
                  </p>
                  <p className="text-xl font-bold">
                    {showBalances
                      ? formatCurrency(totalAmount, currency)
                      : "••••••"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    Categories
                  </p>
                  <p className="text-xl font-bold">{data.length}</p>
                </div>
              </div>
            </div>

            {renderListView()}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart */}
            <div className="h-64 sm:h-72">
              {viewType === "pie" ? renderPieChart() : renderBarChart()}
            </div>

            {/* Top categories summary */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Top Categories</h4>
              {data.slice(0, 3).map((category, index) => (
                <div
                  key={category.category_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: category.color || COLORS[index],
                      }}
                    />
                    <span className="text-sm font-medium">
                      {category.category_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {showBalances
                        ? formatCurrency(category.amount, currency)
                        : "••••••"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatPercentage(category.percentage)}
                    </span>
                  </div>
                </div>
              ))}

              {data.length > 3 && (
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  View All Categories
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
