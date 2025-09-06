'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserAccountSummary } from '@/lib/services/accounts'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Crown
} from 'lucide-react'
import { AccountSummary } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function AccountsOverview() {
  const { user } = useAuth()
  const t = useTranslations('accounts')
  const [summary, setSummary] = useState<AccountSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadAccountSummary()
    }
  }, [user?.id])

  const loadAccountSummary = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await getUserAccountSummary(user.id)
      setSummary(data)
    } catch (error) {
      console.error('Error loading account summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <AccountsOverviewSkeleton />
  }

  if (!summary) return null

  const isPositiveBalance = summary.total_balance >= 0
  const planConfig = getPlanConfig(summary.subscription_plan)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="relative overflow-hidden shadow-xl border-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-100 text-sm font-medium">{t('overview.totalBalance')}</p>
                <p className="text-3xl font-bold tracking-tight">
                  ৳{Math.abs(summary.total_balance).toLocaleString()}
                </p>
                <div className="flex items-center space-x-2">
                  {isPositiveBalance ? (
                    <ArrowUpRight className="h-4 w-4 text-green-300" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-300" />
                  )}
                  <span className={`text-xs font-medium ${
                    isPositiveBalance ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {isPositiveBalance ? t('overview.positive') : t('overview.negative')}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                <Wallet className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Accounts Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  {t('overview.activeAccounts')}
                </p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {summary.account_count}
                  </p>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    / {summary.max_accounts}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(summary.account_count / summary.max_accounts) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {Math.round((summary.account_count / summary.max_accounts) * 100)}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subscription Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className={`shadow-xl border-0 ${planConfig.gradient} ${planConfig.textColor}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <p className={`text-sm font-medium ${planConfig.mutedTextColor}`}>
                    {t('overview.currentPlan')}
                  </p>
                  {summary.subscription_plan === 'max' && (
                    <Sparkles className="h-4 w-4" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold capitalize">
                    {summary.subscription_plan}
                  </p>
                  <Badge 
                    variant="secondary" 
                    className={`${planConfig.badgeColor} border-0`}
                  >
                    {planConfig.label}
                  </Badge>
                </div>
                {!summary.can_create_more && (
                  <p className={`text-xs ${planConfig.warningColor}`}>
                    {t('overview.limitReached')}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-2xl ${planConfig.iconBg}`}>
                {planConfig.icon}
              </div>
            </div>
            
            {summary.subscription_plan === 'free' && (
              <div className="mt-4">
                <Button 
                  size="sm" 
                  className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30"
                  variant="outline"
                >
                  {t('overview.upgradeToPro')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function getPlanConfig(plan: string) {
  switch (plan) {
    case 'free':
      return {
        gradient: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800',
        textColor: 'text-white',
        mutedTextColor: 'text-slate-300',
        warningColor: 'text-yellow-300',
        badgeColor: 'bg-white/20 text-white',
        iconBg: 'bg-white/10',
        icon: <Wallet className="h-6 w-6" />,
        label: 'Basic'
      }
    case 'pro':
      return {
        gradient: 'bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800',
        textColor: 'text-white',
        mutedTextColor: 'text-purple-200',
        warningColor: 'text-yellow-300',
        badgeColor: 'bg-white/20 text-white',
        iconBg: 'bg-white/10',
        icon: <TrendingUp className="h-6 w-6" />,
        label: 'Professional'
      }
    case 'max':
      return {
        gradient: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600',
        textColor: 'text-white',
        mutedTextColor: 'text-amber-100',
        warningColor: 'text-yellow-200',
        badgeColor: 'bg-white/20 text-white',
        iconBg: 'bg-white/10',
        icon: <Crown className="h-6 w-6" />,
        label: 'Family Premium'
      }
    default:
      return {
        gradient: 'bg-gradient-to-br from-slate-600 to-slate-800',
        textColor: 'text-white',
        mutedTextColor: 'text-slate-300',
        warningColor: 'text-yellow-300',
        badgeColor: 'bg-white/20 text-white',
        iconBg: 'bg-white/10',
        icon: <Wallet className="h-6 w-6" />,
        label: 'Basic'
      }
  }
}

function AccountsOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="shadow-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse" />
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse" />
              </div>
              <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}