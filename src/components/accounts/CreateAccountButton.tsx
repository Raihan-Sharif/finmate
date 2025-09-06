'use client'

import { useState } from 'react'
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
import { Plus, Sparkles } from 'lucide-react'
import { CreateAccountDialog } from './CreateAccountDialog'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CreateAccountButtonProps {
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export default function CreateAccountButton({ 
  variant = 'default', 
  size = 'default',
  className 
}: CreateAccountButtonProps) {
  const t = useTranslations('accounts')
  const [open, setOpen] = useState(false)

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