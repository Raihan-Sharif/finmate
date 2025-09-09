'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  Crown, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Sparkles,
  Star,
  ArrowRight,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingCardsProps {
  plans: any[]
  currentPlan: string
  billingCycle: 'monthly' | 'yearly'
  onSelectPlan: (plan: any, billingCycle: 'monthly' | 'yearly') => void
}

export function PricingCards({ plans, currentPlan, billingCycle, onSelectPlan }: PricingCardsProps) {
  const t = useTranslations('subscription')

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free':
        return CreditCard
      case 'pro':
        return TrendingUp
      case 'max':
        return Crown
      default:
        return CreditCard
    }
  }

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'free':
        return {
          gradient: 'from-slate-500 to-slate-600',
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-600',
          border: 'border-slate-200 dark:border-slate-700'
        }
      case 'pro':
        return {
          gradient: 'from-blue-500 to-indigo-600',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-600',
          border: 'border-blue-200 dark:border-blue-700'
        }
      case 'max':
        return {
          gradient: 'from-purple-500 to-pink-600',
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-600',
          border: 'border-purple-200 dark:border-purple-700'
        }
      default:
        return {
          gradient: 'from-slate-500 to-slate-600',
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-600',
          border: 'border-slate-200 dark:border-slate-700'
        }
    }
  }

  const getPrice = (plan: any) => {
    const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
    const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(plan.price_yearly / 12) : price
    
    return {
      price,
      monthlyEquivalent,
      savings: billingCycle === 'yearly' ? Math.round(((plan.price_monthly * 12) - plan.price_yearly) / (plan.price_monthly * 12) * 100) : 0
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan, index) => {
        const Icon = getPlanIcon(plan.plan_name)
        const colors = getPlanColor(plan.plan_name)
        const pricing = getPrice(plan)
        const isCurrentPlan = currentPlan === plan.plan_name
        const isPopular = plan.is_popular
        const isFree = plan.plan_name === 'free'

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={cn(
              "relative",
              isPopular && "transform scale-105 z-10"
            )}
          >
            <Card className={cn(
              "relative overflow-hidden shadow-xl border-0 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1",
              isCurrentPlan 
                ? `ring-2 ${colors.border} bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600`
                : "bg-white/90 dark:bg-slate-900/90",
              isPopular && "border-2 border-purple-200 dark:border-purple-800 shadow-purple-500/25"
            )}>
              
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={`pricing-pattern-${plan.id}`} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                      <circle cx="15" cy="15" r="1" fill="currentColor" opacity="0.4"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#pricing-pattern-${plan.id})`}/>
                </svg>
              </div>

              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg px-4 py-1">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {t('mostPopular')}
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="outline" className={cn("font-medium", colors.text, colors.border)}>
                    {t('currentPlan')}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4 relative pt-8">
                {/* Plan Icon */}
                <div className={cn("w-16 h-16 mx-auto rounded-2xl shadow-lg flex items-center justify-center mb-4", colors.bg)}>
                  <Icon className={cn("h-8 w-8", colors.text)} />
                </div>

                <CardTitle className="text-2xl font-bold">
                  {plan.display_name}
                </CardTitle>
                
                <CardDescription className="text-base mt-2 leading-relaxed">
                  {plan.description}
                </CardDescription>

                {/* Pricing */}
                <div className="mt-6 space-y-2">
                  {isFree ? (
                    <div className="text-4xl font-black text-slate-900 dark:text-slate-100">
                      {t('free')}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-end justify-center space-x-2">
                        <span className="text-4xl font-black text-slate-900 dark:text-slate-100">
                          ৳{pricing.price}
                        </span>
                        <span className="text-lg font-medium text-slate-600 dark:text-slate-400 pb-1">
                          /{billingCycle === 'monthly' ? t('month') : t('year')}
                        </span>
                      </div>
                      
                      {billingCycle === 'yearly' && pricing.savings > 0 && (
                        <div className="flex items-center justify-center space-x-2">
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                            {t('savePercent', { percent: pricing.savings })}
                          </Badge>
                        </div>
                      )}

                      {billingCycle === 'yearly' && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          ৳{pricing.monthlyEquivalent}/{t('month')} {t('billedYearly')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 relative">
                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature: string, featureIndex: number) => (
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * featureIndex }}
                      className="flex items-start space-x-3"
                    >
                      <div className={cn("p-1 rounded-full flex-shrink-0 mt-0.5", colors.bg)}>
                        <Check className={cn("h-3 w-3", colors.text)} />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Account Limits */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {plan.max_accounts === 50 ? '50' : plan.max_accounts}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {t('accounts')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {plan.max_family_members}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {plan.max_family_members > 1 ? t('familyMembers') : t('user')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-6">
                  {isCurrentPlan ? (
                    <Button 
                      disabled 
                      className="w-full" 
                      size="lg"
                      variant="outline"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t('currentPlan')}
                    </Button>
                  ) : isFree ? (
                    <Button 
                      variant="outline" 
                      className="w-full border-slate-300 dark:border-slate-600" 
                      size="lg"
                      disabled
                    >
                      {t('alwaysFree')}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onSelectPlan(plan, billingCycle)}
                      className={cn(
                        "w-full shadow-lg hover:shadow-xl transition-all duration-300 group",
                        `bg-gradient-to-r ${colors.gradient} hover:from-${plan.plan_name === 'pro' ? 'blue' : 'purple'}-600 hover:to-${plan.plan_name === 'pro' ? 'indigo' : 'pink'}-700 text-white`
                      )}
                      size="lg"
                    >
                      {currentPlan === 'free' ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                          {t('upgradeTo', { plan: plan.display_name })}
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                          {t('switchTo', { plan: plan.display_name })}
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Additional Info */}
                {!isFree && (
                  <div className="pt-2 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('manualVerification')}
                    </p>
                  </div>
                )}
              </CardContent>

              {/* Glow Effect for Popular Plan */}
              {isPopular && (
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl" />
              )}
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}