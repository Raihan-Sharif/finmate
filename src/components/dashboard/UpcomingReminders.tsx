"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CurrencyType, UpcomingReminder } from "@/types";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";

interface UpcomingRemindersProps {
  reminders: UpcomingReminder[];
  showBalances: boolean;
  currency: CurrencyType;
}

export function UpcomingReminders({
  reminders,
  showBalances,
  currency,
}: UpcomingRemindersProps) {
  // Get icon for reminder type
  const getReminderIcon = (type: "emi" | "lending" | "budget" | "goal") => {
    switch (type) {
      case "emi":
        return <CreditCard className="w-4 h-4" />;
      case "lending":
        return <Users className="w-4 h-4" />;
      case "budget":
        return <AlertCircle className="w-4 h-4" />;
      case "goal":
        return <Target className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Get color based on priority
  const getPriorityColor = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "medium":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
      case "low":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "secondary";
    }
  };

  // Get due status
  const getDueStatus = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "Overdue";
    if (daysUntilDue === 0) return "Due Today";
    if (daysUntilDue === 1) return "Due Tomorrow";
    return `Due in ${daysUntilDue} days`;
  };

  // Sort reminders by urgency
  const sortedReminders = reminders.sort((a, b) => {
    // First by days until due (ascending)
    if (a.days_until_due !== b.days_until_due) {
      return a.days_until_due - b.days_until_due;
    }
    // Then by priority (high first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (!reminders.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No upcoming reminders at the moment
            </p>
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
              Upcoming Reminders
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {reminders.length} upcoming item
              {reminders.length !== 1 ? "s" : ""}
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/reminders">View All</Link>
          </Button>
        </div>

        {/* Quick stats */}
        <div className="flex items-center space-x-4 pt-2">
          {["high", "medium", "low"].map((priority) => {
            const count = reminders.filter(
              (r) => r.priority === priority
            ).length;
            if (count === 0) return null;

            return (
              <div key={priority} className="flex items-center space-x-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    priority === "high"
                      ? "bg-red-500"
                      : priority === "medium"
                      ? "bg-orange-500"
                      : "bg-green-500"
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {count} {priority}
                </span>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {sortedReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center space-x-3 flex-1">
                {/* Icon */}
                <div
                  className={`p-2 rounded-lg ${getPriorityColor(
                    reminder.priority
                  )}`}
                >
                  {getReminderIcon(reminder.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {reminder.title}
                    </h4>
                    <Badge
                      variant={getPriorityVariant(reminder.priority)}
                      className="text-xs"
                    >
                      {reminder.priority}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground truncate">
                    {reminder.description}
                  </p>

                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {formatDate(reminder.due_date, { format: "short" })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs">
                      <Clock className="w-3 h-3" />
                      <span
                        className={`font-medium ${
                          reminder.days_until_due <= 0
                            ? "text-red-600"
                            : reminder.days_until_due <= 1
                            ? "text-orange-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {getDueStatus(reminder.days_until_due)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                {reminder.amount && (
                  <p className="font-semibold text-sm">
                    {showBalances
                      ? formatCurrency(reminder.amount, currency)
                      : "••••••"}
                  </p>
                )}

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors ml-auto" />
              </div>
            </div>
          ))}

          {/* Quick actions */}
          <div className="flex space-x-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href="/loans">
                <CreditCard className="w-4 h-4 mr-1" />
                EMIs
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href="/lending">
                <Users className="w-4 h-4 mr-1" />
                Lending
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
