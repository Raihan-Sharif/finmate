'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Sparkles, ExternalLink, Crown } from 'lucide-react'
import { CreateAccountDialog } from './CreateAccountDialog'
import UpgradeModal from './UpgradeModal'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { canUserCreateAccount } from '@/lib/services/accounts'
import { AccountLimits } from '@/types'
import Link from 'next/link'

interface CreateAccountButtonProps {
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  showFullPage?: boolean // Option to show full page instead of modal
}

export default function CreateAccountButton({ 
  variant = 'default', 
  size = 'default',
  className,
  showFullPage = false
}: CreateAccountButtonProps) {
  const { user } = useAuth()
  const t = useTranslations('accounts')
  const [open, setOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
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

  const handleClick = () => {
    if (!limits) return

    // Check if user can create more accounts
    if (!limits.canCreate) {
      setUpgradeOpen(true)
      return
    }

    // If full page option is enabled and user can create accounts, navigate
    if (showFullPage) {
      window.location.href = '/dashboard/accounts/create'
      return
    }

    // Show dialog
    setOpen(true)
  }

  // Show loading state
  if (loading) {
    return (
      <Button 
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        <Plus className="h-4 w-4 mr-2 animate-pulse" />
        {t('createAccount')}
      </Button>
    )
  }

  // Show upgrade button if limits reached
  if (limits && !limits.canCreate) {
    return (
      <>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={handleClick}
            variant={variant}
            size={size}
            className={cn(
              variant === 'default' && "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25",
              className
            )}
          >
            <Crown className="h-4 w-4 mr-2" />
            {t('upgradeToCreate')}
            {variant === 'default' && (
              <Sparkles className="h-4 w-4 ml-2 opacity-75" />
            )}
          </Button>
        </motion.div>
        
        {limits && (
          <UpgradeModal
            open={upgradeOpen}
            onClose={() => setUpgradeOpen(false)}
            currentLimits={limits}
            trigger="account_limit"
          />
        )}
      </>
    )
  }

  // If full page option is enabled, use button with click handler
  if (showFullPage) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button 
          onClick={handleClick}
          variant={variant}
          size={size}
          className={cn(
            variant === 'default' && "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25",
            className
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('createAccount')}
          {variant === 'default' && (
            <ExternalLink className="h-4 w-4 ml-2 opacity-75" />
          )}
        </Button>
      </motion.div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            variant={variant}
            size={size}
            className={cn(
              variant === 'default' && "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25",
              className
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('createAccount')}
            {variant === 'default' && (
              <Sparkles className="h-4 w-4 ml-2 opacity-75" />
            )}
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Plus className="h-5 w-5" />
            </div>
            <span>{t('createAccount')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('createAccountDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <CreateAccountDialog onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}