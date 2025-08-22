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
import { useTranslations } from 'next-intl';


export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('dashboard.quickActions');
  const tCategories = useTranslations('dashboard.categories');

  const quickActions = [
    {
      category: tCategories('transactions'),
      items: [
        {
          label: t('addExpense'),
          href: "/transactions/new?type=expense",
          icon: Receipt,
          description: t('descriptions.addExpense'),
          color: "text-red-600",
        },
        {
          label: t('addIncome'),
          href: "/transactions/new?type=income",
          icon: TrendingUp,
          description: t('descriptions.addIncome'),
          color: "text-green-600",
        },
        {
          label: t('quickTransfer'),
          href: "/transactions/transfer",
          icon: CreditCard,
          description: t('descriptions.quickTransfer'),
          color: "text-blue-600",
        },
      ],
    },
    {
      category: tCategories('financialPlanning'),
      items: [
        {
          label: t('newInvestment'),
          href: "/investments/new",
          icon: PiggyBank,
          description: t('descriptions.newInvestment'),
          color: "text-purple-600",
        },
        {
          label: t('setBudget'),
          href: "/budget/new",
          icon: Target,
          description: t('descriptions.setBudget'),
          color: "text-orange-600",
        },
        {
          label: t('calculateEMI'),
          href: "/loans/calculator",
          icon: Calculator,
          description: t('descriptions.calculateEMI'),
          color: "text-indigo-600",
        },
      ],
    },
    {
      category: tCategories('lendingBorrowing'),
      items: [
        {
          label: t('moneyLent'),
          href: "/lending/new?type=lent",
          icon: Users,
          description: t('descriptions.moneyLent'),
          color: "text-cyan-600",
        },
        {
          label: t('moneyBorrowed'),
          href: "/lending/new?type=borrowed",
          icon: Users,
          description: t('descriptions.moneyBorrowed'),
          color: "text-pink-600",
        },
      ],
    },
    {
      category: tCategories('dataManagement'),
      items: [
        {
          label: t('importData'),
          href: "/import",
          icon: Upload,
          description: t('descriptions.importData'),
          color: "text-gray-600",
        },
        {
          label: t('exportReport'),
          href: "/export",
          icon: Download,
          description: t('descriptions.exportReport'),
          color: "text-gray-600",
        },
        {
          label: t('viewReports'),
          href: "/reports",
          icon: BarChart3,
          description: t('descriptions.viewReports'),
          color: "text-gray-600",
        },
      ],
    },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          {t('title')}
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
          {t('recentlyUsed')}
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
              <p className="font-medium text-sm">{t('addExpense')}</p>
              <p className="text-xs text-muted-foreground">{t('usedTimeAgo.twoHoursAgo')}</p>
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
              <p className="font-medium text-sm">{t('addIncome')}</p>
              <p className="text-xs text-muted-foreground">{t('usedTimeAgo.yesterday')}</p>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
