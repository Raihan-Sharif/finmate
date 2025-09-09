'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { CurrentPlanCard } from './CurrentPlanCard'
import { PricingCards } from './PricingCards'
import { PaymentModal } from './PaymentModal'
import { CouponInput } from './CouponInput'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, CreditCard, Gift, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SubscriptionManager() {
  const t = useTranslations('subscription')
  const { user } = useAuth()
  const {
    subscriptionStatus,
    subscriptionPlans,
    paymentMethods,
    loading,
    error,
    refreshSubscription
  } = useSubscription()

  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)

  const handlePlanSelect = (plan: any, billingCycle: 'monthly' | 'yearly') => {
    setSelectedPlan(plan)
    setSelectedBilling(billingCycle)
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = () => {
    setShowPaymentModal(false)
    setSelectedPlan(null)
    setAppliedCoupon(null)
    refreshSubscription()
  }

  if (loading) {
    return <SubscriptionManagerSkeleton />
  }

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      {subscriptionStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CurrentPlanCard 
            status={subscriptionStatus}
            onUpgrade={(plan) => handlePlanSelect(plan, 'monthly')}
          />
        </motion.div>
      )}

      {/* Pending Payment Alert */}
      {subscriptionStatus?.pending_payment_id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {t('pendingPaymentAlert')} 
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2 text-amber-800 dark:text-amber-200 font-semibold"
                onClick={() => {/* Navigate to payment status */}}
              >
                {t('viewStatus')}
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Billing Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex justify-center"
      >
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-2">
          <Tabs value={selectedBilling} onValueChange={(value: any) => setSelectedBilling(value)} className="w-auto">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger value="monthly" className="flex items-center space-x-2">
                <span>{t('monthly')}</span>
              </TabsTrigger>
              <TabsTrigger value="yearly" className="flex items-center space-x-2">
                <span>{t('yearly')}</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs">
                  {t('save20')}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <PricingCards
          plans={subscriptionPlans}
          currentPlan={subscriptionStatus?.current_plan || 'free'}
          billingCycle={selectedBilling}
          onSelectPlan={handlePlanSelect}
        />
      </motion.div>

      {/* Features Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>{t('compareFeatures')}</span>
            </CardTitle>
            <CardDescription>
              {t('compareFeaturesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold">{t('features')}</th>
                    {subscriptionPlans.map((plan) => (
                      <th key={plan.id} className="text-center py-3 px-4 font-semibold">
                        <div className="flex flex-col items-center space-y-1">
                          <span className="capitalize">{plan.display_name}</span>
                          {plan.is_popular && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                              {t('popular')}
                            </Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4">{t('maxAccounts')}</td>
                    {subscriptionPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        <Badge variant="outline" className="font-mono">
                          {plan.max_accounts === 50 ? '50 (Family)' : plan.max_accounts}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-4">{t('familyMembers')}</td>
                    {subscriptionPlans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        <Badge variant="outline" className="font-mono">
                          {plan.max_family_members}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  {/* Add more feature comparisons */}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle>{t('frequentlyAskedQuestions')}</CardTitle>
            <CardDescription>
              {t('faqDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  question: t('faq.paymentQuestion'),
                  answer: t('faq.paymentAnswer')
                },
                {
                  question: t('faq.upgradeQuestion'),
                  answer: t('faq.upgradeAnswer')
                },
                {
                  question: t('faq.familyQuestion'),
                  answer: t('faq.familyAnswer')
                }
              ].map((faq, index) => (
                <details key={index} className="group">
                  <summary className="flex justify-between items-center cursor-pointer list-none p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="font-medium">{faq.question}</span>
                    <div className="transition-transform group-open:rotate-180">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </summary>
                  <div className="mt-2 px-4 pb-4 text-slate-600 dark:text-slate-400">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPlan && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            plan={selectedPlan}
            billingCycle={selectedBilling}
            paymentMethods={paymentMethods}
            appliedCoupon={appliedCoupon}
            onPaymentComplete={handlePaymentComplete}
            onCouponApplied={setAppliedCoupon}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function SubscriptionManagerSkeleton() {
  return (
    <div className="space-y-8">
      {/* Current Plan Skeleton */}
      <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plans Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
            <CardHeader className="text-center pb-4">
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto" />
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto mt-2" />
              <div className="mt-4 space-y-2">
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
              <div className="pt-4">
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}