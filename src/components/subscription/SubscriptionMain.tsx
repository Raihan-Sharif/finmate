'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  Smartphone, 
  TrendingUp,
  Check,
  Star,
  AlertTriangle,
  Clock,
  Sparkles,
  CreditCard,
  QrCode,
  Banknote,
  Gift,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import PaymentMethodSelector from './PaymentMethodSelector'
import PaymentPendingPage from './PaymentPendingPage'
import CouponInput from './CouponInputSimple'

type SubscriptionStep = 'plans' | 'payment' | 'pending' | 'success'

interface PlanFeatures {
  [key: string]: string[]
}

const planFeatures: PlanFeatures = {
  free: [
    '3 Bank Accounts',
    'Basic Expense Tracking', 
    'Simple Budgeting',
    'Basic Reports',
    'Email Support'
  ],
  pro: [
    '15 Accounts (All Types)',
    'Advanced Expense Tracking',
    'Smart Budgeting with Alerts',
    'Investment Tracking',
    'Credit Card Management', 
    'Advanced Reports & Analytics',
    'Export to Excel/PDF',
    'Priority Email Support',
    'Mobile App Access'
  ],
  max: [
    'Unlimited Accounts',
    'Everything in Pro',
    'Family Sharing (5 Members)',
    'AI-Powered Insights',
    'Advanced Investment Analytics',
    'EMI & Loan Management',
    'Multi-Currency Support',
    'Custom Categories & Tags',
    'API Access',
    'Phone & Chat Support',
    'White-label Reports'
  ]
}

const planPricing = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 299, yearly: 2990 },
  max: { monthly: 599, yearly: 5990 }
}

const planIcons = {
  free: Shield,
  pro: Zap,
  max: Crown
}

const planColors = {
  free: 'from-slate-500 to-slate-600',
  pro: 'from-blue-500 to-indigo-600',
  max: 'from-purple-500 to-pink-600'
}

export default function SubscriptionMain() {
  const { user } = useAuth()
  const router = useRouter()
  const t = useTranslations('subscription')
  const { subscriptionStatus, loading: subscriptionLoading } = useSubscription()
  
  const [currentStep, setCurrentStep] = useState<SubscriptionStep>('plans')
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [upgradeReason, setUpgradeReason] = useState<string>('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Get upgrade context from session storage
  useEffect(() => {
    const reason = sessionStorage.getItem('upgrade_reason')
    const targetPlan = sessionStorage.getItem('target_plan')
    
    if (reason) setUpgradeReason(reason)
    if (targetPlan) setSelectedPlan(targetPlan)
  }, [])

  const currentPlan = subscriptionStatus?.current_plan || 'free'
  const planHierarchy = { free: 0, pro: 1, max: 2 }
  const currentPlanLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0
  
  const availablePlans = ['free', 'pro', 'max'] // Show all plans including free

  const calculatePrice = (plan: string) => {
    const basePrice = planPricing[plan as keyof typeof planPricing]?.[billingCycle] || 0
    if (!appliedCoupon) return basePrice
    
    if (appliedCoupon.discount_type === 'percentage') {
      return Math.round(basePrice * (1 - appliedCoupon.discount_value / 100))
    } else {
      return Math.max(0, basePrice - appliedCoupon.discount_value)
    }
  }

  const handlePlanSelect = (plan: string) => {
    if (plan === currentPlan) {
      toast.info('You are already on this plan')
      return
    }
    if (plan === 'free') {
      toast.info('Cannot downgrade to free plan')
      return
    }
    setSelectedPlan(plan)
  }

  const handleProceedToPayment = () => {
    if (!user) {
      toast.error('Please login to continue')
      router.push('/auth/signin')
      return
    }
    
    if (selectedPlan === 'free') {
      toast.info('Free plan is already active')
      return
    }
    
    setCurrentStep('payment')
  }

  const handlePaymentSubmit = async (paymentData: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/subscription/payments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billing_cycle: billingCycle,
          payment_method: paymentData.method,
          payment_details: paymentData,
          applied_coupon_id: appliedCoupon?.id,
          upgrade_reason: upgradeReason
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Payment submission failed')
      }

      setPaymentSubmitted(true)
      setCurrentStep('pending')
      toast.success('Payment submitted successfully! Awaiting approval.')
      
    } catch (error: any) {
      console.error('Payment submission error:', error)
      toast.error(error.message || 'Failed to submit payment')
    } finally {
      setLoading(false)
    }
  }

  const handleCouponApplied = (coupon: any) => {
    setAppliedCoupon(coupon)
    toast.success(`Coupon "${coupon.code}" applied successfully!`)
  }

  if (subscriptionLoading) {
    return <SubscriptionMainSkeleton />
  }

  // If user is already on max plan
  if (currentPlan === 'max') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <Crown className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">You're on the Max Plan!</h2>
          <p className="text-lg opacity-90">
            You have access to all premium features and unlimited everything.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard')} size="lg">
          <ArrowRight className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Progress Indicator with Enhanced Design */}
      <div className="max-w-2xl mx-auto">
        <motion.div 
          className="flex items-center justify-center space-x-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {(['plans', 'payment', 'pending'] as SubscriptionStep[]).map((step, index) => {
            const isActive = step === currentStep
            const isCompleted = ['plans', 'payment', 'pending'].indexOf(currentStep) > index
            const stepNumber = index + 1
            
            return (
              <div key={step} className="flex items-center">
                <motion.div 
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white shadow-lg shadow-green-500/25' 
                      : isActive 
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 text-purple-600 shadow-lg shadow-purple-500/25'
                      : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Animated ring for active step */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-purple-400"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Check className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <span className="font-bold">{stepNumber}</span>
                  )}
                </motion.div>
                {index < 2 && (
                  <div className={`w-16 h-0.5 ml-4 ${
                    isCompleted 
                      ? 'bg-green-500' 
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            )
          })}
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 'plans' && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Current Plan Status */}
            <div className="max-w-2xl mx-auto">
              <Alert className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/20 dark:to-cyan-950/20 shadow-lg">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      You're currently on the <strong className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">{currentPlan.toUpperCase()}</strong> plan
                      {subscriptionStatus?.expires_at && (
                        <div className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
                          Expires on {new Date(subscriptionStatus.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {currentPlan === 'free' && (
                      <div className="text-right">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                          Upgrade for more features
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>

            {/* Enhanced Billing Cycle Toggle */}
            <div className="text-center">
              <motion.div 
                className="inline-flex p-1 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <motion.button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    billingCycle === 'monthly'
                      ? 'bg-gradient-to-r from-white to-slate-50 dark:from-slate-700 dark:to-slate-600 text-slate-900 dark:text-slate-100 shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Monthly
                </motion.button>
                <motion.button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 relative ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-white to-slate-50 dark:from-slate-700 dark:to-slate-600 text-slate-900 dark:text-slate-100 shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Yearly
                  <motion.div
                    className="absolute -top-1 -right-1"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 10 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                      Save 17%
                    </Badge>
                  </motion.div>
                </motion.button>
              </motion.div>
            </div>

            {/* Pricing Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {availablePlans.map((plan) => {
                const Icon = planIcons[plan as keyof typeof planIcons]
                const isSelected = plan === selectedPlan
                const isCurrent = plan === currentPlan
                const isPopular = plan === 'pro'
                const price = calculatePrice(plan)
                const originalPrice = planPricing[plan as keyof typeof planPricing]?.[billingCycle] || 0
                const hasDiscount = appliedCoupon && price < originalPrice
                const canUpgrade = planHierarchy[plan as keyof typeof planHierarchy] > currentPlanLevel
                
                return (
                  <motion.div
                    key={plan}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: plan === 'free' ? 0 : plan === 'pro' ? 0.1 : 0.2,
                      type: "spring",
                      stiffness: 300,
                      damping: 30 
                    }}
                    whileHover={!isCurrent && canUpgrade ? { 
                      scale: 1.03, 
                      y: -5,
                      transition: { type: "spring", stiffness: 400, damping: 25 }
                    } : {}}
                  >
                    <Card
                      className={`relative overflow-hidden transition-all duration-500 backdrop-blur-xl ${
                        !isCurrent && canUpgrade ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isSelected
                          ? 'ring-2 ring-purple-500 shadow-2xl bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-950/40 dark:to-pink-950/40 border-purple-200 dark:border-purple-800'
                          : isCurrent
                          ? 'ring-2 ring-emerald-400 bg-gradient-to-br from-emerald-50/90 to-cyan-50/90 dark:from-emerald-950/30 dark:to-cyan-950/30 shadow-xl border-emerald-200 dark:border-emerald-800'
                          : canUpgrade 
                          ? 'hover:shadow-2xl border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80'
                          : 'opacity-75 border-slate-200/30 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/50'
                      } ${isPopular && !isCurrent ? 'ring-1 ring-blue-400 shadow-lg shadow-blue-500/10' : ''}`}
                      onClick={() => !isCurrent && canUpgrade && handlePlanSelect(plan)}
                    >
                      {/* Animated glow effect for selected/current plan */}
                      {(isSelected || isCurrent) && (
                        <motion.div 
                          className={`absolute inset-0 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-purple-600/5 to-pink-600/5' 
                              : 'bg-gradient-to-r from-emerald-600/5 to-cyan-600/5'
                          }`}
                          animate={{ opacity: [0.3, 0.7, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                      
                      {/* Sparkle effect for max plan */}
                      {plan === 'max' && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-purple-400 rounded-full"
                              style={{
                                left: `${20 + i * 15}%`,
                                top: `${15 + i * 20}%`,
                              }}
                              animate={{
                                scale: [0, 1, 0],
                                opacity: [0, 1, 0]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.4,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-xs font-semibold text-center py-2">
                          <CheckCircle className="inline h-3 w-3 mr-1 fill-current" />
                          CURRENT PLAN
                        </div>
                      )}
                      
                      {isPopular && !isCurrent && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold text-center py-2">
                          <Star className="inline h-3 w-3 mr-1 fill-current" />
                          MOST POPULAR
                        </div>
                      )}

                      <CardHeader className={`text-center pb-6 ${isPopular ? 'pt-10' : 'pt-6'}`}>
                        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${planColors[plan as keyof typeof planColors]} text-white mx-auto mb-4 shadow-lg`}>
                          <Icon className="h-8 w-8" />
                        </div>
                        
                        <CardTitle className="text-2xl capitalize">{plan}</CardTitle>
                        <CardDescription className="text-base">
                          {plan === 'free' && 'Perfect for getting started'}
                          {plan === 'pro' && 'Best for personal finance management'}
                          {plan === 'max' && 'Complete family financial suite'}
                        </CardDescription>
                        
                        <div className="space-y-2">
                          <div className="flex items-baseline justify-center space-x-1">
                            {hasDiscount && (
                              <span className="text-lg text-slate-500 line-through">
                                ৳{originalPrice}
                              </span>
                            )}
                            <span className="text-4xl font-bold">
                              ৳{price}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              /{billingCycle === 'monthly' ? 'month' : 'year'}
                            </span>
                          </div>
                          
                          {billingCycle === 'yearly' && plan !== 'free' && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Save ৳{(planPricing[plan as keyof typeof planPricing].monthly * 12) - planPricing[plan as keyof typeof planPricing].yearly} per year
                            </p>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-6">
                        <div className="space-y-3">
                          {planFeatures[plan]?.map((feature, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          className={`w-full ${
                            isCurrent
                              ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700'
                              : isSelected 
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                              : canUpgrade 
                              ? plan === 'pro' 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                : ''
                              : ''
                          }`}
                          variant={
                            isCurrent ? 'default' 
                            : isSelected ? 'default' 
                            : canUpgrade && plan === 'pro' ? 'default' 
                            : 'outline'
                          }
                          disabled={isCurrent || (!canUpgrade && plan !== 'free')}
                        >
                          {isCurrent 
                            ? 'Current Plan' 
                            : !canUpgrade && plan !== 'free'
                            ? 'Downgrade Unavailable'
                            : isSelected 
                            ? 'Selected' 
                            : `Choose ${plan.charAt(0).toUpperCase() + plan.slice(1)}`
                          }
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* Enhanced Coupon Input Section */}
            <motion.div 
              className="max-w-lg mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/60 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-800/50 backdrop-blur-xl">
                <div className="text-center mb-4">
                  <motion.div
                    className="inline-flex items-center space-x-2 text-purple-700 dark:text-purple-300"
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Gift className="h-5 w-5" />
                    <span className="font-semibold">Have a coupon code?</span>
                  </motion.div>
                </div>
                <CouponInput onCouponApplied={handleCouponApplied} />
              </div>
            </motion.div>

            {/* Enhanced Continue Button */}
            {selectedPlan !== 'free' && (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    onClick={handleProceedToPayment}
                    className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-semibold shadow-2xl shadow-purple-500/25 border-0"
                  >
                    {/* Animated background shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    />
                    <div className="relative flex items-center">
                      <CreditCard className="h-5 w-5 mr-3" />
                      Continue to Payment
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </div>
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}

        {currentStep === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PaymentMethodSelector
              selectedPlan={selectedPlan}
              billingCycle={billingCycle}
              price={calculatePrice(selectedPlan)}
              originalPrice={planPricing[selectedPlan as keyof typeof planPricing]?.[billingCycle] || 0}
              appliedCoupon={appliedCoupon}
              onPaymentSubmit={handlePaymentSubmit}
              onBack={() => setCurrentStep('plans')}
              loading={loading}
            />
          </motion.div>
        )}

        {currentStep === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PaymentPendingPage
              selectedPlan={selectedPlan}
              billingCycle={billingCycle}
              price={calculatePrice(selectedPlan)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SubscriptionMainSkeleton() {
  return (
    <div className="space-y-8">
      {/* Progress Skeleton */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            {i < 3 && <div className="w-16 h-0.5 ml-4 bg-slate-200 dark:bg-slate-700 animate-pulse" />}
          </div>
        ))}
      </div>

      {/* Plans Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl mx-auto mb-4" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-2 w-20" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-4 w-32" />
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded mx-auto w-24" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-start space-x-3">
                    <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
                  </div>
                ))}
              </div>
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}