'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { canUserCreateAccount } from '@/lib/services/accounts'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Crown, 
  Zap, 
  ArrowUpRight, 
  Shield,
  Sparkles,
  Users,
  Star,
  AlertTriangle
} from 'lucide-react'
import { AccountLimits } from '@/types'
import { motion } from 'framer-motion'
import { UpgradeButton } from '@/components/subscription/UpgradeButton'

export default function SubscriptionLimitsCard() {
  const { user } = useAuth()
  const t = useTranslations('accounts')
  const [limits, setLimits] = useState<AccountLimits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadLimits()
    }
  }, [user?.id])

  const loadLimits = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await canUserCreateAccount(user.id)
      setLimits(data)
    } catch (error) {
      console.error('Error loading account limits:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <SubscriptionLimitsCardSkeleton />
  }

  if (!limits) return null

  const usagePercentage = (limits.current / limits.limit) * 100
  const planConfig = getPlanConfig(limits.planType, t)
  const isNearLimit = usagePercentage >= 80
  const isAtLimit = !limits.canCreate

  return (
    <Card className={`shadow-xl border-0 overflow-hidden ${planConfig.cardGradient}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
      
      <CardHeader className="relative text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${planConfig.iconBg}`}>
              {planConfig.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{t('subscription.currentPlan')}</CardTitle>
              <CardDescription className={planConfig.mutedTextColor}>
                {planConfig.description}
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            {planConfig.badge}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6 text-white">
        {/* Account Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${planConfig.mutedTextColor}`}>
              {t('subscription.accountUsage')}
            </span>
            <span className="text-sm font-bold">
              {limits.current} / {limits.limit}
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={usagePercentage} 
              className="h-3 bg-white/20"
            />
            <div className="flex items-center justify-between text-xs">
              <span className={`${planConfig.mutedTextColor}`}>
                {Math.round(usagePercentage)}% {t('subscription.used')}
              </span>
              {isAtLimit && (
                <div className="flex items-center space-x-1 text-yellow-300">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{t('subscription.limitReached')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Available Account Types */}
        <div className="space-y-3">
          <h4 className={`font-medium ${planConfig.mutedTextColor}`}>
            {t('subscription.availableTypes')}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {limits.allowedTypes.map((type) => (
              <div 
                key={type}
                className="text-xs p-2 rounded-lg bg-white/10 backdrop-blur-sm text-center capitalize font-medium"
              >
                {getAccountTypeDisplay(type)}
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Prompt */}
        {limits.planType === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Sparkles className="h-8 w-8 text-yellow-300" />
              </div>
              <div>
                <p className="font-semibold text-white mb-1">
                  {t('subscription.upgradeTitle')}
                </p>
                <p className="text-xs text-white/80 mb-3">
                  {t('subscription.upgradeDescription')}
                </p>
              </div>
              <div className="space-y-2">
                <UpgradeButton 
                  reason={isAtLimit ? "account_limit" : "general"}
                  targetPlan="pro"
                  variant="cta"
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0"
                  redirectTo="/dashboard/accounts"
                />
                <UpgradeButton 
                  reason="family_sharing"
                  targetPlan="max"
                  variant="outline"
                  size="sm"
                  className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50"
                  redirectTo="/dashboard/accounts"
                />
              </div>
            </div>
          </motion.div>
        )}

        {limits.planType === 'pro' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <div className="text-center space-y-3">
              <Users className="h-6 w-6 mx-auto text-amber-300" />
              <div>
                <p className="font-semibold text-white mb-1">
                  {t('subscription.familyFeatures')}
                </p>
                <p className="text-xs text-white/80 mb-3">
                  {t('subscription.familyDescription')}
                </p>
              </div>
              <UpgradeButton 
                reason="family_sharing"
                targetPlan="max"
                variant="cta"
                size="sm"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0"
                redirectTo="/dashboard/accounts"
              />
            </div>
          </motion.div>
        )}

        {/* Plan Features */}
        <div className="space-y-3">
          <h4 className={`font-medium ${planConfig.mutedTextColor}`}>
            {t('subscription.planFeatures')}
          </h4>
          <div className="space-y-2">
            {planConfig.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                <span className="text-sm text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getPlanConfig(planType: string, t: any) {
  
  switch (planType) {
    case 'free':
      return {
        cardGradient: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800',
        iconBg: 'bg-white/20',
        icon: <Shield className="h-5 w-5" />,
        badge: 'Free',
        description: t('subscription.plans.free.description'),
        mutedTextColor: 'text-slate-200',
        features: [
          t('subscription.plans.free.feature1'),
          t('subscription.plans.free.feature2'),
          t('subscription.plans.free.feature3')
        ]
      }
    case 'pro':
      return {
        cardGradient: 'bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800',
        iconBg: 'bg-white/20',
        icon: <Zap className="h-5 w-5" />,
        badge: 'Pro',
        description: t('subscription.plans.pro.description'),
        mutedTextColor: 'text-purple-200',
        features: [
          t('subscription.plans.pro.feature1'),
          t('subscription.plans.pro.feature2'),
          t('subscription.plans.pro.feature3'),
          t('subscription.plans.pro.feature4')
        ]
      }
    case 'max':
      return {
        cardGradient: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600',
        iconBg: 'bg-white/20',
        icon: <Crown className="h-5 w-5" />,
        badge: 'Max Family',
        description: t('subscription.plans.max.description'),
        mutedTextColor: 'text-amber-100',
        features: [
          t('subscription.plans.max.feature1'),
          t('subscription.plans.max.feature2'),
          t('subscription.plans.max.feature3'),
          t('subscription.plans.max.feature4'),
          t('subscription.plans.max.feature5')
        ]
      }
    default:
      return {
        cardGradient: 'bg-gradient-to-br from-slate-600 to-slate-800',
        iconBg: 'bg-white/20',
        icon: <Shield className="h-5 w-5" />,
        badge: 'Free',
        description: t('subscription.plans.free.description'),
        mutedTextColor: 'text-slate-200',
        features: [
          t('subscription.plans.free.feature1'),
          t('subscription.plans.free.feature2')
        ]
      }
  }
}

function getAccountTypeDisplay(type: string): string {
  const displayNames: Record<string, string> = {
    cash: 'Cash',
    bank: 'Bank',
    credit_card: 'Credit',
    savings: 'Savings',
    investment: 'Investment',
    wallet: 'Wallet',
    other: 'Other'
  }
  return displayNames[type] || type
}

function SubscriptionLimitsCardSkeleton() {
  return (
    <Card className="shadow-xl border-0 bg-slate-200 dark:bg-slate-800 animate-pulse">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-slate-300 dark:bg-slate-700 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="h-3 w-32 bg-slate-300 dark:bg-slate-700 rounded" />
            </div>
          </div>
          <div className="h-6 w-16 bg-slate-300 dark:bg-slate-700 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-slate-300 dark:bg-slate-700 rounded" />
            <div className="h-3 w-12 bg-slate-300 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-3 w-full bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="h-20 w-full bg-slate-300 dark:bg-slate-700 rounded-xl" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-3 w-full bg-slate-300 dark:bg-slate-700 rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}