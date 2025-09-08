'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Crown, 
  Star, 
  Check, 
  Zap, 
  Shield, 
  Users, 
  Smartphone,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Building2,
  Wallet,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SubscriptionPlan, AccountLimits } from '@/types'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  currentLimits: AccountLimits
  trigger?: 'account_limit' | 'account_type' | 'general'
}

export default function UpgradeModal({ 
  open, 
  onClose, 
  currentLimits, 
  trigger = 'general' 
}: UpgradeModalProps) {
  const t = useTranslations('accounts')
  const tCommon = useTranslations('common')
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('pro')

  const plans = {
    free: {
      name: 'Free',
      price: '৳0',
      period: '/month',
      accounts: 3,
      accountTypes: ['cash', 'bank'],
      features: [
        'Basic expense tracking',
        'Simple budgeting',
        '3 bank accounts',
        'Basic reports'
      ],
      color: 'from-slate-500 to-slate-600',
      icon: Shield,
      popular: false
    },
    pro: {
      name: 'Pro',
      price: '৳299',
      period: '/month',
      accounts: 15,
      accountTypes: ['cash', 'bank', 'credit_card', 'savings', 'investment', 'wallet'],
      features: [
        'Advanced expense tracking',
        'Smart budgeting with alerts',
        '15 accounts (all types)',
        'Investment tracking',
        'Credit card management',
        'Advanced reports & insights',
        'Export to Excel/PDF',
        'Email support'
      ],
      color: 'from-blue-600 to-indigo-600',
      icon: Crown,
      popular: true
    },
    max: {
      name: 'Max',
      price: '৳599',
      period: '/month',
      accounts: 50,
      accountTypes: ['cash', 'bank', 'credit_card', 'savings', 'investment', 'wallet', 'other'],
      features: [
        'Everything in Pro',
        '50 accounts + family sharing',
        'AI-powered insights',
        'Advanced investment analytics',
        'EMI & loan management',
        'Multi-currency support',
        'Priority support',
        'Custom categories',
        'API access'
      ],
      color: 'from-purple-600 to-pink-600',
      icon: Sparkles,
      popular: false
    }
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Wallet className="h-4 w-4" />
      case 'bank': return <Building2 className="h-4 w-4" />
      case 'credit_card': return <CreditCard className="h-4 w-4" />
      case 'savings': return <PiggyBank className="h-4 w-4" />
      case 'investment': return <TrendingUp className="h-4 w-4" />
      case 'wallet': return <Smartphone className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
  }

  const handleUpgrade = (plan: SubscriptionPlan) => {
    // In a real app, this would integrate with payment processing
    console.log(`Upgrading to ${plan} plan...`)
    // For now, just show a message
    alert(`Upgrade to ${plan} plan functionality would be implemented here with payment integration.`)
  }

  const getTriggerMessage = () => {
    switch (trigger) {
      case 'account_limit':
        return {
          title: t('upgrade.accountLimitTitle'),
          description: t('upgrade.accountLimitDescription', { 
            current: currentLimits.current,
            limit: currentLimits.limit 
          })
        }
      case 'account_type':
        return {
          title: t('upgrade.accountTypeTitle'),
          description: t('upgrade.accountTypeDescription')
        }
      default:
        return {
          title: t('upgrade.generalTitle'),
          description: t('upgrade.generalDescription')
        }
    }
  }

  const triggerMessage = getTriggerMessage()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{triggerMessage.title}</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {triggerMessage.description}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Limits Warning */}
          {trigger === 'account_limit' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30"
            >
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  You've reached your account limit ({currentLimits.current}/{currentLimits.limit})
                </p>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Upgrade to create more accounts and unlock advanced features.
              </p>
            </motion.div>
          )}

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(plans).map(([planKey, plan]) => {
              const isSelected = selectedPlan === planKey
              const isCurrent = currentLimits.planType === planKey
              const Icon = plan.icon
              
              return (
                <motion.div
                  key={planKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: planKey === 'free' ? 0 : planKey === 'pro' ? 0.1 : 0.2 }}
                >
                  <Card
                    className={`relative overflow-hidden transition-all duration-300 cursor-pointer border-2 ${
                      isSelected
                        ? 'border-blue-500 shadow-2xl scale-105'
                        : isCurrent 
                        ? 'border-green-500'
                        : 'border-slate-200 dark:border-slate-700 hover:shadow-lg'
                    } ${planKey === 'free' ? 'opacity-75' : ''}`}
                    onClick={() => setSelectedPlan(planKey as SubscriptionPlan)}
                  >
                    {/* Popular Badge */}
                    {plan.popular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    {/* Current Plan Badge */}
                    {isCurrent && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-500 text-white">
                          <Check className="h-3 w-3 mr-1" />
                          Current
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${plan.color} text-white mb-4`}>
                          <Icon className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <div className="flex items-baseline justify-center space-x-1 mt-2">
                          <span className="text-3xl font-bold">{plan.price}</span>
                          <span className="text-slate-600 dark:text-slate-400">{plan.period}</span>
                        </div>
                      </div>

                      {/* Account Limits */}
                      <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="text-center mb-2">
                          <span className="text-2xl font-bold text-blue-600">{plan.accounts}</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">accounts</span>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {plan.accountTypes.map((type) => (
                            <div
                              key={type}
                              className="flex items-center space-x-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-xs"
                            >
                              {getAccountTypeIcon(type)}
                              <span className="capitalize">{type.replace('_', ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {tCommon('cancel')}
            </Button>
            
            {selectedPlan !== currentLimits.planType && selectedPlan !== 'free' && (
              <Button
                onClick={() => handleUpgrade(selectedPlan)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to {plans[selectedPlan].name}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="text-center pt-4 border-t">
            <div className="flex items-center justify-center space-x-6 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>Instant Activation</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}