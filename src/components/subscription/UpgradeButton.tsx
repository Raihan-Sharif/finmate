'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Star, 
  Sparkles, 
  ArrowRight,
  Zap,
  AlertTriangle,
  Rocket
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type UpgradeReason = 
  | 'account_limit'
  | 'feature_locked' 
  | 'export_limit'
  | 'family_sharing'
  | 'advanced_analytics'
  | 'general'

export type UpgradePlan = 'pro' | 'max'

interface UpgradeButtonProps {
  reason?: UpgradeReason
  targetPlan?: UpgradePlan
  variant?: 'default' | 'outline' | 'minimal' | 'cta'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  showIcon?: boolean
  animated?: boolean
  redirectTo?: string // Optional redirect URL after successful subscription
  children?: React.ReactNode
}

const upgradeReasons = {
  account_limit: {
    title: 'Account Limit Reached',
    description: 'Create unlimited accounts',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  feature_locked: {
    title: 'Premium Feature',
    description: 'Unlock advanced features',
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  export_limit: {
    title: 'Export Limit',
    description: 'Unlimited exports & reports',
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  family_sharing: {
    title: 'Family Features',
    description: 'Share with family members',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    borderColor: 'border-pink-200 dark:border-pink-800'
  },
  advanced_analytics: {
    title: 'Advanced Analytics',
    description: 'AI-powered insights',
    icon: Zap,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800'
  },
  general: {
    title: 'Upgrade Now',
    description: 'Unlock premium features',
    icon: Rocket,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800'
  }
}

export function UpgradeButton({
  reason = 'general',
  targetPlan = 'pro',
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  animated = true,
  redirectTo,
  children
}: UpgradeButtonProps) {
  const router = useRouter()
  const t = useTranslations('subscription')
  const [isHovered, setIsHovered] = useState(false)
  
  const reasonConfig = upgradeReasons[reason]
  const Icon = reasonConfig.icon

  const handleUpgrade = () => {
    // Store redirect URL in sessionStorage if provided
    if (redirectTo) {
      sessionStorage.setItem('subscription_redirect_to', redirectTo)
    }
    
    // Store upgrade context
    sessionStorage.setItem('upgrade_reason', reason)
    sessionStorage.setItem('target_plan', targetPlan)
    
    // Navigate to subscription page
    router.push('/dashboard/subscription')
  }

  const getButtonText = () => {
    if (children) return children
    
    switch (targetPlan) {
      case 'pro':
        return t('upgradeToPro')
      case 'max':
        return t('upgradeToMax')
      default:
        return t('upgrade')
    }
  }

  const getButtonVariant = () => {
    switch (variant) {
      case 'cta':
        return targetPlan === 'max' 
          ? 'default' // Will be styled with gradient
          : 'default'
      case 'minimal':
        return 'ghost'
      default:
        return variant
    }
  }

  const getButtonClasses = () => {
    const baseClasses = cn(
      'relative overflow-hidden group transition-all duration-300',
      className
    )

    switch (variant) {
      case 'cta':
        return cn(
          baseClasses,
          targetPlan === 'max' 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl'
        )
      case 'minimal':
        return cn(
          baseClasses,
          'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20'
        )
      default:
        return baseClasses
    }
  }

  const ButtonComponent = animated ? motion.div : 'div'
  const buttonProps = animated ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    onHoverStart: () => setIsHovered(true),
    onHoverEnd: () => setIsHovered(false)
  } : {}

  return (
    <ButtonComponent {...buttonProps}>
      <Button
        onClick={handleUpgrade}
        variant={getButtonVariant()}
        size={size}
        className={getButtonClasses()}
      >
        {/* Background Gradient Animation */}
        {animated && variant === 'cta' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100"
            initial={{ x: '-100%' }}
            animate={{ x: isHovered ? '100%' : '-100%' }}
            transition={{ duration: 0.6 }}
          />
        )}
        
        <div className="relative flex items-center space-x-2">
          {showIcon && (
            <Icon className={cn(
              "h-4 w-4 transition-colors",
              variant === 'cta' ? 'text-white' : reasonConfig.color
            )} />
          )}
          <span className="font-medium">
            {getButtonText()}
          </span>
          {variant === 'cta' && (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          )}
        </div>
        
        {/* Sparkle Effect for Max Plan */}
        {animated && targetPlan === 'max' && variant === 'cta' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${20 + i * 20}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        )}
      </Button>
    </ButtonComponent>
  )
}

// Usage examples in comments:
/*
// Basic upgrade button
<UpgradeButton />

// Account limit reached
<UpgradeButton 
  reason="account_limit" 
  targetPlan="pro"
  variant="cta" 
  redirectTo="/dashboard/accounts"
/>

// Feature locked
<UpgradeButton 
  reason="feature_locked"
  variant="outline"
  size="sm"
>
  Unlock Premium
</UpgradeButton>

// Family features CTA
<UpgradeButton 
  reason="family_sharing"
  targetPlan="max"
  variant="cta"
  size="lg"
  animated={true}
/>
*/