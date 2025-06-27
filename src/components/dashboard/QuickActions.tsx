"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Calculator,
  ChevronDown,
  CreditCard,
  Download,
  PiggyBank,
  Plus,
  Receipt,
  Target,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const quickActions = [
  {
    category: "Transactions",
    items: [
      {
        label: "Add Expense",
        href: "/transactions/new?type=expense",
        icon: Receipt,
        description: "Record a new expense",
        color: "text-red-600",
      },
      {
        label: "Add Income",
        href: "/transactions/new?type=income",
        icon: TrendingUp,
        description: "Record new income",
        color: "text-green-600",
      },
      {
        label: "Quick Transfer",
        href: "/transactions/transfer",
        icon: CreditCard,
        description: "Transfer between accounts",
        color: "text-blue-600",
      },
    ],
  },
  {
    category: "Financial Planning",
    items: [
      {
        label: "New Investment",
        href: "/investments/new",
        icon: PiggyBank,
        description: "Add investment record",
        color: "text-purple-600",
      },
      {
        label: "Set Budget",
        href: "/budget/new",
        icon: Target,
        description: "Create budget plan",
        color: "text-orange-600",
      },
      {
        label: "Calculate EMI",
        href: "/loans/calculator",
        icon: Calculator,
        description: "EMI calculator",
        color: "text-indigo-600",
      },
    ],
  },
  {
    category: "Lending & Borrowing",
    items: [
      {
        label: "Money Lent",
        href: "/lending/new?type=lent",
        icon: Users,
        description: "Record money lent",
        color: "text-cyan-600",
      },
      {
        label: "Money Borrowed",
        href: "/lending/new?type=borrowed",
        icon: Users,
        description: "Record money borrowed",
        color: "text-pink-600",
      },
    ],
  },
  {
    category: "Data Management",
    items: [
      {
        label: "Import Data",
        href: "/import",
        icon: Upload,
        description: "Import bank statements",
        color: "text-gray-600",
      },
      {
        label: "Export Report",
        href: "/export",
        icon: Download,
        description: "Export financial data",
        color: "text-gray-600",
      },
      {
        label: "View Reports",
        href: "/reports",
        icon: BarChart3,
        description: "Financial reports",
        color: "text-gray-600",
      },
    ],
  },
];

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Quick Actions
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" sideOffset={8}>
        {quickActions.map((category, categoryIndex) => (
          <div key={category.category}>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {category.category}
            </DropdownMenuLabel>

            {category.items.map((action) => (
              <DropdownMenuItem
                key={action.href}
                asChild
                className="cursor-pointer"
              >
                <Link
                  href={action.href}
                  className="flex items-center space-x-3 p-3 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${action.color}`}
                  >
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}

            {categoryIndex < quickActions.length - 1 && (
              <DropdownMenuSeparator />
            )}
          </div>
        ))}

        <DropdownMenuSeparator />

        {/* Recently used actions */}
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recently Used
        </DropdownMenuLabel>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/transactions/new?type=expense"
            className="flex items-center space-x-3 p-3 hover:bg-accent rounded-lg transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Add Expense</p>
              <p className="text-xs text-muted-foreground">Used 2 hours ago</p>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/transactions/new?type=income"
            className="flex items-center space-x-3 p-3 hover:bg-accent rounded-lg transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Add Income</p>
              <p className="text-xs text-muted-foreground">Used yesterday</p>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
