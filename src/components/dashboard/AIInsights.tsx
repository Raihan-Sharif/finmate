"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CategoryExpense,
  CurrencyType,
  DashboardStats,
  MonthlyData,
} from "@/types";
import {
  AlertTriangle,
  Brain,
  ChevronRight,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

interface AIInsightsProps {
  stats: DashboardStats;
  monthlyData: MonthlyData[];
  categoryExpenses: CategoryExpense[];
  currency: CurrencyType;
}

interface AIInsight {
  id: string;
  type: "trend" | "recommendation" | "alert" | "opportunity";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  action?: string;
  actionLink?: string;
  confidence: number;
}

export function AIInsights({
  stats,
  monthlyData,
  categoryExpenses,
  currency,
}: AIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Generate insights based on financial data
  const generateInsights = async () => {
    setLoading(true);

    try {
      // Simulate AI processing time
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const generatedInsights: AIInsight[] = [];

      // Spending pattern insights
      if (categoryExpenses.length > 0) {
        const topCategory = categoryExpenses[0];
        if (topCategory && topCategory.percentage > 40) {
          generatedInsights.push({
            id: "high-category-spending",
            type: "alert",
            title: "High Spending in One Category",
            description: `${
              topCategory.category_name
            } accounts for ${topCategory.percentage.toFixed(
              1
            )}% of your expenses. Consider diversifying your spending or setting a specific budget for this category.`,
            impact: "high",
            action: "Set Category Budget",
            actionLink: "/budget",
            confidence: 85,
          });
        }
      }

      // Monthly trend insights
      if (monthlyData.length >= 2) {
        const currentMonth = monthlyData[monthlyData.length - 1];
        const previousMonth = monthlyData[monthlyData.length - 2];

        if (currentMonth && previousMonth) {
          const expenseChange =
            ((currentMonth.expenses - previousMonth.expenses) /
              previousMonth.expenses) *
            100;

        if (expenseChange > 20) {
          generatedInsights.push({
            id: "expense-increase",
            type: "alert",
            title: "Expenses Increased Significantly",
            description: `Your expenses increased by ${expenseChange.toFixed(
              1
            )}% compared to last month. Review your recent transactions to identify the cause.`,
            impact: "high",
            action: "Review Transactions",
            actionLink: "/transactions",
            confidence: 90,
          });
        } else if (expenseChange < -10) {
          generatedInsights.push({
            id: "expense-decrease",
            type: "trend",
            title: "Great Expense Control",
            description: `Your expenses decreased by ${Math.abs(
              expenseChange
            ).toFixed(1)}% compared to last month. Keep up the good work!`,
            impact: "medium",
            confidence: 85,
          });
        }
        }
      }

      // Budget insights
      if (stats.budget_used_percentage > 90) {
        generatedInsights.push({
          id: "budget-limit",
          type: "alert",
          title: "Budget Limit Approaching",
          description: `You've used ${stats.budget_used_percentage.toFixed(
            1
          )}% of your monthly budget. Consider reducing discretionary spending for the rest of the month.`,
          impact: "high",
          action: "View Budget",
          actionLink: "/budget",
          confidence: 95,
        });
      }

      // Savings rate insights
      const savingsRate =
        stats.total_income > 0
          ? ((stats.total_income - stats.total_expenses) / stats.total_income) *
            100
          : 0;

      if (savingsRate < 10 && stats.total_income > 0) {
        generatedInsights.push({
          id: "low-savings",
          type: "recommendation",
          title: "Low Savings Rate",
          description: `Your current savings rate is ${savingsRate.toFixed(
            1
          )}%. Experts recommend saving at least 20% of your income. Consider automating your savings.`,
          impact: "high",
          action: "Set Savings Goal",
          actionLink: "/goals",
          confidence: 80,
        });
      } else if (savingsRate > 30) {
        generatedInsights.push({
          id: "high-savings",
          type: "opportunity",
          title: "Excellent Savings Rate",
          description: `Your savings rate of ${savingsRate.toFixed(
            1
          )}% is excellent! Consider investing surplus funds for better returns.`,
          impact: "medium",
          action: "Explore Investments",
          actionLink: "/investments",
          confidence: 85,
        });
      }

      // Investment insights
      if (stats.investment_return > 10) {
        generatedInsights.push({
          id: "good-investments",
          type: "trend",
          title: "Strong Investment Performance",
          description: `Your investments are performing well with a ${stats.investment_return.toFixed(
            1
          )}% return. Consider increasing your investment allocation.`,
          impact: "medium",
          action: "Add Investment",
          actionLink: "/investments/new",
          confidence: 75,
        });
      }

      // EMI and debt insights
      if (stats.pending_emis > 3) {
        generatedInsights.push({
          id: "multiple-emis",
          type: "recommendation",
          title: "Multiple Pending EMIs",
          description: `You have ${stats.pending_emis} pending EMI payments. Consider setting up auto-pay to avoid late fees and maintain a good credit score.`,
          impact: "medium",
          action: "Manage EMIs",
          actionLink: "/loans",
          confidence: 90,
        });
      }

      // Income diversification
      if (stats.total_income > 0) {
        generatedInsights.push({
          id: "income-diversification",
          type: "opportunity",
          title: "Income Diversification Opportunity",
          description:
            "Consider diversifying your income sources through side hustles, freelancing, or passive income investments to increase financial stability.",
          impact: "medium",
          action: "Learn More",
          confidence: 70,
        });
      }

      // Emergency fund check
      const emergencyFundMonths = stats.net_balance / stats.total_expenses;
      if (emergencyFundMonths < 3 && stats.total_expenses > 0) {
        generatedInsights.push({
          id: "emergency-fund",
          type: "recommendation",
          title: "Build Emergency Fund",
          description: `Your current savings can cover ${emergencyFundMonths.toFixed(
            1
          )} months of expenses. Aim for 3-6 months as an emergency fund.`,
          impact: "high",
          action: "Set Savings Goal",
          actionLink: "/goals",
          confidence: 95,
        });
      }

      setInsights(generatedInsights.slice(0, 4)); // Show top 4 insights
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate insights on component mount
  useEffect(() => {
    generateInsights();
  }, [stats, monthlyData, categoryExpenses]);

  const getInsightIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="w-4 h-4" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4" />;
      case "recommendation":
        return <Lightbulb className="w-4 h-4" />;
      case "opportunity":
        return <Target className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (
    type: AIInsight["type"],
    impact: AIInsight["impact"]
  ) => {
    if (type === "alert") return "text-red-600 bg-red-50 dark:bg-red-900/20";
    if (type === "opportunity")
      return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (type === "recommendation")
      return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
    if (type === "trend")
      return "text-purple-600 bg-purple-50 dark:bg-purple-900/20";
    return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
  };

  const getImpactVariant = (impact: AIInsight["impact"]) => {
    switch (impact) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                AI Financial Insights
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Personalized recommendations based on your spending patterns
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-3 p-4 border rounded-lg"
              >
                <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
              >
                <div
                  className={`p-2 rounded-lg ${getInsightColor(
                    insight.type,
                    insight.impact
                  )}`}
                >
                  {getInsightIcon(insight.type)}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm leading-tight">
                      {insight.title}
                    </h4>
                    <div className="flex items-center space-x-2 ml-2">
                      <Badge
                        variant={getImpactVariant(insight.impact)}
                        className="text-xs"
                      >
                        {insight.impact}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {insight.confidence}%
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>

                  {insight.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      asChild={!!insight.actionLink}
                    >
                      {insight.actionLink ? (
                        <a href={insight.actionLink}>
                          {insight.action}
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        <>
                          {insight.action}
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Ask AI Assistant
                <Sparkles className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No insights available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add more transactions to get personalized insights
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
