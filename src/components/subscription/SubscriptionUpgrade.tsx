'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  Smartphone, 
  ArrowUpCircle, 
  ArrowDownCircle,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { useSubscription, SubscriptionStatus, SubscriptionPlan } from '@/hooks/useSubscription'
import { PaymentModal } from './PaymentModal'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SubscriptionUpgradeProps {
  className?: string
}

const planIcons = {
  free: Shield,
  pro: Zap,
  max: Crown
}

const planColors = {
  free: 'text-slate-600',
  pro: 'text-blue-600',
  max: 'text-purple-600'
}

const planGradients = {
  free: 'from-slate-500 to-slate-600',
  pro: 'from-blue-500 to-blue-600',
  max: 'from-purple-500 to-pink-600'
}

export function SubscriptionUpgrade({ className }: SubscriptionUpgradeProps) {
  const t = useTranslations('subscription')
  const { 
    subscriptionStatus, 
    subscriptionPlans, 
    loading, 
    error 
  } = useSubscription()

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const currentPlan = subscriptionPlans.find(
    plan => plan.plan_name === subscriptionStatus?.current_plan
  )

  const availableUpgrades = subscriptionPlans.filter(plan => {
    if (!subscriptionStatus) return plan.plan_name !== 'free'
    
    const planHierarchy = { free: 0, pro: 1, max: 2 }
    const currentLevel = planHierarchy[subscriptionStatus.current_plan as keyof typeof planHierarchy] ?? -1
    const planLevel = planHierarchy[plan.plan_name as keyof typeof planHierarchy] ?? -1
    
    return planLevel > currentLevel
  })

  const availableDowngrades = subscriptionPlans.filter(plan => {
    if (!subscriptionStatus || subscriptionStatus.current_plan === 'free') return false
    
    const planHierarchy = { free: 0, pro: 1, max: 2 }
    const currentLevel = planHierarchy[subscriptionStatus.current_plan as keyof typeof planHierarchy] ?? -1
    const planLevel = planHierarchy[plan.plan_name as keyof typeof planHierarchy] ?? -1
    
    return planLevel < currentLevel
  })

  const handleUpgrade = (plan: SubscriptionPlan) => {
    if (!subscriptionStatus?.can_upgrade) {
      toast.error(t('upgradeNotAllowed'))
      return
    }

    setSelectedPlan(plan)
    setShowPaymentModal(true)
  }

  const handleDowngrade = (plan: SubscriptionPlan) => {
    // For downgrade, we'd typically handle this differently
    // For now, we'll show the same modal but with different messaging
    setSelectedPlan(plan)
    setShowPaymentModal(true)
  }

  const renderPlanCard = (
    plan: SubscriptionPlan, 
    type: 'current' | 'upgrade' | 'downgrade'
  ) => {
    const Icon = planIcons[plan.plan_name as keyof typeof planIcons] || Shield
    const isPopular = plan.is_popular && type === 'upgrade'

    return (
      <Card 
        key={plan.id}
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
          type === 'current' && "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20",
          type === 'upgrade' && "hover:scale-105 cursor-pointer",
          type === 'downgrade' && "hover:scale-105 cursor-pointer opacity-75",
          isPopular && "ring-2 ring-blue-500 scale-105"
        )}
        onClick={() => {
          if (type === 'upgrade') handleUpgrade(plan)
          if (type === 'downgrade') handleDowngrade(plan)
        }}
      >
        {isPopular && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold text-center py-1">
            {t('mostPopular')}
          </div>
        )}
        
        <CardHeader className={cn("pb-4", isPopular && "pt-6")}>
          <div className="flex items-center justify-between">
            <div className={cn("p-3 rounded-lg bg-gradient-to-br", planGradients[plan.plan_name as keyof typeof planGradients])}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            
            {type === 'current' && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('current')}
              </Badge>
            )}
            
            {type === 'upgrade' && (
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
            )}
            
            {type === 'downgrade' && (
              <ArrowDownCircle className="h-5 w-5 text-orange-600" />
            )}
          </div>
          
          <CardTitle className="text-xl">{plan.display_name}</CardTitle>
          <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
          
          <div className="space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold">৳{plan.price_monthly}</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">/month</span>
            </div>
            {plan.price_yearly > 0 && (
              <div className="flex items-baseline space-x-2 text-sm">
                <span className="text-lg font-semibold text-green-600">৳{plan.price_yearly}</span>
                <span className="text-slate-600 dark:text-slate-400">/year</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}% off
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4" />
                <span>{t('maxAccounts')}</span>
              </span>
              <span className="font-semibold">{plan.max_accounts}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{t('familyMembers')}</span>
              </span>
              <span className="font-semibold">{plan.max_family_members}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{t('features')}</h4>
            <ul className="space-y-1 text-sm">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {type === 'upgrade' && (
            <Button 
              className="w-full"
              disabled={!subscriptionStatus?.can_upgrade}
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              {t('upgradeNow')}
            </Button>
          )}
          
          {type === 'downgrade' && (
            <Button 
              variant="outline" 
              className="w-full"
            >
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              {t('downgrade')}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Current Plan Status */}
      {currentPlan && subscriptionStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{t('currentPlan')}</h2>
            <p className="text-slate-600 dark:text-slate-400">
              {t('planStatus', { plan: currentPlan.display_name })}
            </p>
          </div>
          
          {subscriptionStatus.expires_at && subscriptionStatus.days_remaining !== null && (
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>{t('timeRemaining')}</span>
                <span className="font-semibold">
                  {subscriptionStatus.days_remaining} {t('days')}
                </span>
              </div>
              <Progress 
                value={(subscriptionStatus.days_remaining / 365) * 100} 
                className="h-2"
              />
            </div>
          )}
          
          {subscriptionStatus.pending_payment_id && (
            <Alert className="max-w-md mx-auto">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {t('paymentPending')}
              </AlertDescription>
            </Alert>
          )}
        </motion.div>
      )}

      {/* Current Plan Card */}
      {currentPlan && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-center">{t('yourCurrentPlan')}</h3>
          <div className="max-w-md mx-auto">
            {renderPlanCard(currentPlan, 'current')}
          </div>
        </motion.div>
      )}

      {/* Available Upgrades */}
      {availableUpgrades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-center">{t('availableUpgrades')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {availableUpgrades.map(plan => renderPlanCard(plan, 'upgrade'))}
          </div>
        </motion.div>
      )}

      {/* Available Downgrades */}
      {availableDowngrades.length > 0 && subscriptionStatus?.current_plan !== 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-center">{t('considerDowngrade')}</h3>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {t('downgradeDescription')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {availableDowngrades.map(plan => renderPlanCard(plan, 'downgrade'))}
          </div>
        </motion.div>
      )}

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedPlan(null)
          }}
          plan={selectedPlan}
          billingCycle="monthly"
          paymentMethods={[]}
          onPaymentComplete={() => {
            setShowPaymentModal(false)
            setSelectedPlan(null)
          }}
          onCouponApplied={() => {}}
        />
      )}
    </div>
  )
}