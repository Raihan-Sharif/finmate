"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CurrencyType } from "@/types";
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface MonthlyGoal {
  id: string;
  title: string;
  progress: number;
  target: number;
  status: "on-track" | "behind" | "achieved" | "over-budget";
}

interface MonthlyGoalsProps {
  goals: MonthlyGoal[];
  showBalances: boolean;
  currency: CurrencyType;
}

export function MonthlyGoals({
  goals,
  showBalances,
  currency,
}: MonthlyGoalsProps) {
  // Get status color and icon
  const getStatusDisplay = (status: MonthlyGoal["status"]) => {
    switch (status) {
      case "achieved":
        return {
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          icon: <CheckCircle className="w-4 h-4" />,
          variant: "success" as const,
          label: "Achieved",
        };
      case "on-track":
        return {
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          icon: <TrendingUp className="w-4 h-4" />,
          variant: "default" as const,
          label: "On Track",
        };
      case "behind":
        return {
          color: "text-orange-600",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          icon: <AlertTriangle className="w-4 h-4" />,
          variant: "warning" as const,
          label: "Behind",
        };
      case "over-budget":
        return {
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          icon: <AlertTriangle className="w-4 h-4" />,
          variant: "destructive" as const,
          label: "Over Budget",
        };
      default:
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          icon: <Target className="w-4 h-4" />,
          variant: "secondary" as const,
          label: "Unknown",
        };
    }
  };

  // Calculate overall progress
  const overallProgress =
    goals.length > 0
      ? (goals.reduce(
          (sum, goal) => sum + Math.min(goal.progress, goal.target),
          0
        ) /
          goals.reduce((sum, goal) => sum + goal.target, 0)) *
        100
      : 0;

  if (!goals.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Monthly Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No goals set</p>
            <p className="text-sm text-muted-foreground mt-1">
              Set financial goals to track your progress
            </p>
            <Button className="mt-4" size="sm" asChild>
              <Link href="/goals">
                <Plus className="w-4 h-4 mr-1" />
                Set Goals
              </Link>
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
              Monthly Goals
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {goals.length} active goal{goals.length !== 1 ? "s" : ""}
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/goals">
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Overall progress */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-lg mt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-bold">
              {overallProgress.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={overallProgress}
            className="h-2"
            indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {goals.map((goal) => {
            const statusDisplay = getStatusDisplay(goal.status);
            const progressPercentage = (goal.progress / goal.target) * 100;

            return (
              <div
                key={goal.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`p-1.5 rounded-lg ${statusDisplay.bgColor} ${statusDisplay.color}`}
                    >
                      {statusDisplay.icon}
                    </div>
                    <h4 className="font-medium text-sm">{goal.title}</h4>
                  </div>

                  <Badge variant={statusDisplay.variant} className="text-xs">
                    {statusDisplay.label}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {showBalances
                        ? `${goal.progress.toFixed(1)}% of ${goal.target}%`
                        : "••••• of •••••"}
                    </span>
                  </div>

                  <Progress
                    value={Math.min(progressPercentage, 100)}
                    className="h-2"
                    indicatorClassName={
                      goal.status === "achieved"
                        ? "bg-green-500"
                        : goal.status === "over-budget"
                        ? "bg-red-500"
                        : goal.status === "behind"
                        ? "bg-orange-500"
                        : "bg-blue-500"
                    }
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>{goal.target}%</span>
                  </div>
                </div>

                {/* Additional info based on goal type */}
                {goal.id === "budget" && goal.status === "over-budget" && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400">
                    💡 Consider reviewing your spending or adjusting your budget
                  </div>
                )}

                {goal.id === "savings" && goal.status === "behind" && (
                  <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs text-orange-700 dark:text-orange-400">
                    💡 Try to reduce expenses or increase income to meet your
                    savings goal
                  </div>
                )}

                {goal.status === "achieved" && (
                  <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-700 dark:text-green-400">
                    🎉 Great job! You've achieved this goal
                  </div>
                )}
              </div>
            );
          })}

          {/* Action buttons */}
          <div className="flex space-x-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href="/budget">
                <Target className="w-4 h-4 mr-1" />
                Budget
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href="/goals">
                <Plus className="w-4 h-4 mr-1" />
                New Goal
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
