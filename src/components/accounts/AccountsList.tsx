'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserAccounts, setDefaultAccount, deleteAccount } from '@/lib/services/accounts'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Star, 
  Eye,
  Wallet,
  Building2,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Smartphone,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { AccountWithBalance } from '@/types'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function AccountsList() {
  const { user } = useAuth()
  const t = useTranslations('accounts')
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadAccounts()
    }
  }, [user?.id])

  const loadAccounts = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await getUserAccounts(user.id)
      setAccounts(data)
    } catch (error) {
      console.error('Error loading accounts:', error)
      toast.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (accountId: string) => {
    if (!user?.id) return

    try {
      await setDefaultAccount(accountId, user.id)
      await loadAccounts() // Refresh the list
      toast.success(t('success.defaultSet'))
    } catch (error) {
      console.error('Error setting default account:', error)
      toast.error(t('errors.defaultFailed'))
    }
  }

  const handleDelete = async (accountId: string, accountName: string) => {
    if (!user?.id) return
    
    if (!window.confirm(t('confirmDelete', { name: accountName }))) return

    try {
      await deleteAccount(accountId, user.id)
      await loadAccounts() // Refresh the list
      toast.success(t('success.deleted'))
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error(error.message || t('errors.deleteFailed'))
    }
  }

  if (loading) {
    return <AccountsListSkeleton />
  }

  if (accounts.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mb-4">
          <Wallet className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {t('emptyState.title')}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          {t('emptyState.description')}
        </p>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          {t('createFirstAccount')}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((account, index) => (
          <AccountCard
            key={account.id}
            account={account}
            index={index}
            onSetDefault={handleSetDefault}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}

interface AccountCardProps {
  account: AccountWithBalance
  index: number
  onSetDefault: (accountId: string) => void
  onDelete: (accountId: string, accountName: string) => void
}

function AccountCard({ account, index, onSetDefault, onDelete }: AccountCardProps) {
  const t = useTranslations('accounts')
  const isPositiveBalance = account.balance >= 0
  const accountIcon = getAccountIcon(account.type)
  const accountConfig = getAccountConfig(account.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer border-0",
        accountConfig.gradient,
        account.is_default && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900"
      )}>
        {account.is_default && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/20 text-white border-white/30">
              <Star className="h-3 w-3 mr-1 fill-current" />
              {t('defaultAccount')}
            </Badge>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />

        <CardContent className="relative p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-3 rounded-xl backdrop-blur-sm",
                accountConfig.iconBg
              )}>
                {accountIcon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{account.name}</h3>
                <p className="text-white/80 text-sm">{account.account_type_display}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  {t('actions.viewDetails')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('actions.edit')}
                </DropdownMenuItem>
                {!account.is_default && (
                  <DropdownMenuItem onClick={() => onSetDefault(account.id)}>
                    <Star className="h-4 w-4 mr-2" />
                    {t('actions.setDefault')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {account.can_delete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(account.id, account.name)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('actions.delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-white/80 text-sm">{t('currentBalance')}</span>
              <div className="flex items-center space-x-2">
                {isPositiveBalance ? (
                  <ArrowUpRight className="h-4 w-4 text-green-300" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-300" />
                )}
                <span className="text-2xl font-bold">
                  ৳{Math.abs(account.balance).toLocaleString()}
                </span>
              </div>
            </div>

            {account.description && (
              <p className="text-white/70 text-xs">{account.description}</p>
            )}

            {account.bank_name && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">{t('bankName')}</span>
                <span className="text-white">{account.bank_name}</span>
              </div>
            )}

            {account.account_number && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">{t('accountNumber')}</span>
                <span className="text-white font-mono">
                  ****{account.account_number.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function getAccountIcon(type: string) {
  const iconProps = { className: "h-6 w-6" }
  
  switch (type) {
    case 'cash':
      return <Wallet {...iconProps} />
    case 'bank':
      return <Building2 {...iconProps} />
    case 'credit_card':
      return <CreditCard {...iconProps} />
    case 'savings':
      return <PiggyBank {...iconProps} />
    case 'investment':
      return <TrendingUp {...iconProps} />
    case 'wallet':
      return <Smartphone {...iconProps} />
    default:
      return <CircleDollarSign {...iconProps} />
  }
}

function getAccountConfig(type: string) {
  switch (type) {
    case 'cash':
      return {
        gradient: 'bg-gradient-to-br from-green-500 via-green-600 to-emerald-700',
        iconBg: 'bg-white/20'
      }
    case 'bank':
      return {
        gradient: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800',
        iconBg: 'bg-white/20'
      }
    case 'credit_card':
      return {
        gradient: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600',
        iconBg: 'bg-white/20'
      }
    case 'savings':
      return {
        gradient: 'bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800',
        iconBg: 'bg-white/20'
      }
    case 'investment':
      return {
        gradient: 'bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-700',
        iconBg: 'bg-white/20'
      }
    case 'wallet':
      return {
        gradient: 'bg-gradient-to-br from-pink-500 via-pink-600 to-rose-700',
        iconBg: 'bg-white/20'
      }
    default:
      return {
        gradient: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800',
        iconBg: 'bg-white/20'
      }
  }
}

function AccountsListSkeleton() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 bg-slate-200 dark:bg-slate-800 animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-slate-300 dark:bg-slate-700 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
                    <div className="h-3 w-16 bg-slate-300 dark:bg-slate-700 rounded" />
                  </div>
                </div>
                <div className="h-8 w-8 bg-slate-300 dark:bg-slate-700 rounded" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-slate-300 dark:bg-slate-700 rounded" />
                  <div className="h-6 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
                </div>
                <div className="h-2 w-full bg-slate-300 dark:bg-slate-700 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}