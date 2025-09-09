'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CurrentPlanCardProps {
  status: {
    current_plan: string
    status: string
    expires_at: string | null
    days_remaining: number | null
    can_upgrade: boolean
    pending_payment_id: string | null
  }
  onUpgrade: (plan: any) => void
}

export function CurrentPlanCard({ status, onUpgrade }: CurrentPlanCardProps) {
  const t = useTranslations('subscription')

  const getPlanInfo = (planName: string) => {
    switch (planName) {
      case 'free':
        return {
          name: 'Free Plan',
          color: 'text-slate-600',
          bgColor: 'bg-slate-100 dark:bg-slate-800',
          icon: CreditCard,
          maxAccounts: 3
        }
      case 'pro':
        return {
          name: 'Pro Plan',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          icon: TrendingUp,
          maxAccounts: 15
        }
      case 'max':
        return {
          name: 'Max Plan',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          icon: Crown,
          maxAccounts: 50
        }
      default:
        return {
          name: 'Unknown Plan',
          color: 'text-slate-600',
          bgColor: 'bg-slate-100 dark:bg-slate-800',
          icon: CreditCard,
          maxAccounts: 3
        }
    }
  }

  const planInfo = getPlanInfo(status.current_plan)
  const Icon = planInfo.icon

  const getStatusInfo = () => {
    if (status.pending_payment_id) {
      return {
        text: t('paymentPending'),
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        icon: Clock
      }
    }

    if (status.status === 'active') {
      if (status.days_remaining && status.days_remaining <= 7) {
        return {
          text: t('expiringSoon'),
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          icon: AlertTriangle
        }
      }
      return {
        text: t('active'),
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        icon: CheckCircle
      }
    }

    if (status.status === 'expired') {
      return {
        text: t('expired'),
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        icon: AlertTriangle
      }
    }

    return {
      text: t('unknown'),
      color: 'text-slate-600',
      bgColor: 'bg-slate-50 dark:bg-slate-900/20',
      icon: AlertTriangle
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 backdrop-blur-xl overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="current-plan-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#current-plan-pattern)"/>
          </svg>
        </div>

        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn("p-3 rounded-xl shadow-lg", planInfo.bgColor)}>
                <Icon className={cn("h-6 w-6", planInfo.color)} />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-xl font-bold">{t('currentPlan')}</span>
                  <Badge variant="outline" className={cn("font-medium", planInfo.color)}>
                    {planInfo.name}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  {t('currentPlanDescription')}
                </CardDescription>
              </div>
            </div>

            {/* Status Badge */}
            <div className={cn("flex items-center space-x-2 px-3 py-1.5 rounded-full", statusInfo.bgColor)}>
              <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
              <span className={cn("text-sm font-medium", statusInfo.color)}>
                {statusInfo.text}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-6">
          {/* Plan Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Accounts Usage */}
            <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('accountsUsed')}
                </span>
                <CreditCard className="h-4 w-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                3 / {planInfo.maxAccounts}
              </div>
              <Progress value={(3 / planInfo.maxAccounts) * 100} className="mt-2 h-2" />
            </div>

            {/* Subscription Status */}
            {status.expires_at && (
              <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t('daysRemaining')}
                  </span>
                  <Calendar className="h-4 w-4 text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {status.days_remaining || 0}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('expires')} {new Date(status.expires_at).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Family Members (for Max plan) */}
            {status.current_plan === 'max' && (
              <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {t('familyMembers')}
                  </span>
                  <Users className="h-4 w-4 text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  1 / 4
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('inviteFamily')}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {status.can_upgrade && (
              <Button
                onClick={() => onUpgrade(null)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                {status.current_plan === 'free' ? t('upgradeToPro') : t('upgradeToMax')}
              </Button>
            )}

            {status.current_plan !== 'free' && (
              <Button
                variant="outline"
                className="flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                size="lg"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t('manageBilling')}
              </Button>
            )}

            {status.pending_payment_id && (
              <Button
                variant="outline"
                className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/20"
                size="lg"
              >
                <Clock className="h-4 w-4 mr-2" />
                {t('viewPendingPayment')}
              </Button>
            )}
          </div>

          {/* Expiry Warning */}
          {status.days_remaining && status.days_remaining <= 7 && status.days_remaining > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                    {t('subscriptionExpiringSoon')}
                  </h4>
                  <p className="text-sm text-orange-600 dark:text-orange-300">
                    {t('renewToKeepFeatures')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}