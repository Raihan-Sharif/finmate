"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CurrencyType, MonthlyData } from "@/types";
import {
  Activity,
  BarChart3,
  LineChart as LineIcon,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OverviewChartProps {
  data: MonthlyData[];
  period: string;
  onPeriodChange: (period: string) => void;
  showBalances: boolean;
  currency: CurrencyType;
}

export function OverviewChart({
  data,
  period,
  onPeriodChange,
  showBalances,
  currency,
}: OverviewChartProps) {
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("area");

  const periods = [
    { value: "week", label: "7D" },
    { value: "month", label: "1M" },
    { value: "quarter", label: "3M" },
    { value: "year", label: "1Y" },
  ];

  const chartTypes = [
    { value: "line", label: "Line", icon: LineIcon },
    { value: "area", label: "Area", icon: Activity },
    { value: "bar", label: "Bar", icon: BarChart3 },
  ];

  // Calculate trends
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];

  const incomeTrend =
    latestData && previousData
      ? ((latestData.income - previousData.income) / previousData.income) * 100
      : 0;

  const expenseTrend =
    latestData && previousData
      ? ((latestData.expenses - previousData.expenses) /
          previousData.expenses) *
        100
      : 0;

  const netTrend =
    latestData && previousData
      ? ((latestData.net - previousData.net) / (previousData.net || 1)) * 100
      : 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {entry.name}:
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {showBalances
                  ? formatCurrency(entry.value, currency)
                  : "••••••"}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                showBalances ? `${value / 1000}k` : "••••"
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              strokeWidth={3}
              name="Income"
              dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              strokeWidth={3}
              name="Expenses"
              dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#EF4444", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#3B82F6"
              strokeWidth={3}
              name="Net"
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                showBalances ? `${value / 1000}k` : "••••"
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#incomeGradient)"
              name="Income"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              fillOpacity={1}
              fill="url(#expenseGradient)"
              name="Expenses"
              strokeWidth={2}
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                showBalances ? `${value / 1000}k` : "••••"
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="income"
              fill="#10B981"
              name="Income"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              fill="#EF4444"
              name="Expenses"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="text-lg font-semibold">
              Financial Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Income vs Expenses over time
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Period selector */}
            <div className="flex bg-muted rounded-lg p-1">
              {periods.map((p) => (
                <Button
                  key={p.value}
                  variant={period === p.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPeriodChange(p.value)}
                  className="h-7 px-3 text-xs"
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Chart type selector */}
            <div className="flex bg-muted rounded-lg p-1">
              {chartTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={chartType === type.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType(type.value as any)}
                  className="h-7 px-2"
                >
                  <type.icon className="w-3 h-3" />
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Trend indicators */}
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-muted-foreground">Income</span>
            {incomeTrend !== 0 && (
              <Badge
                variant={incomeTrend > 0 ? "success" : "destructive"}
                className="text-xs"
              >
                {incomeTrend > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {Math.abs(incomeTrend).toFixed(1)}%
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm text-muted-foreground">Expenses</span>
            {expenseTrend !== 0 && (
              <Badge
                variant={expenseTrend < 0 ? "success" : "destructive"}
                className="text-xs"
              >
                {expenseTrend > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {Math.abs(expenseTrend).toFixed(1)}%
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-sm text-muted-foreground">Net</span>
            {netTrend !== 0 && (
              <Badge
                variant={netTrend > 0 ? "success" : "destructive"}
                className="text-xs"
              >
                {netTrend > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {Math.abs(netTrend).toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-64 sm:h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() || <div>No chart data available</div>}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
