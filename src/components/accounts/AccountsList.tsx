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
  ArrowDownRight,
  Plus
} from 'lucide-react'
import { AccountWithBalance } from '@/types'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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
        <Link href="/dashboard/accounts/create">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            {t('createFirstAccount')}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {accounts.map((account, index) => (
          <div key={account.id} className="w-full h-64">
            <AccountCard
              account={account}
              index={index}
              onSetDefault={handleSetDefault}
              onDelete={handleDelete}
            />
          </div>
        ))}
        
        {/* Add Another Account Card */}
        <div className="w-full h-64">
          <AddAccountCard />
        </div>
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
  const { user } = useAuth()
  const t = useTranslations('accounts')
  const isPositiveBalance = account.balance >= 0
  const accountIcon = getAccountIcon(account.type)
  const accountConfig = getAccountConfig(account.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="w-full h-full"
    >
      <Link href={`/dashboard/accounts/${account.id}`} className="block w-full h-full">
        <Card className={cn(
          "group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer border-0 rounded-2xl",
          "w-full h-full", // Use full container dimensions
          accountConfig.gradient,
          account.is_default && "ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900 shadow-amber-200/50"
        )}>
          
          {/* Card Background Pattern - Modern Bank Card Style */}
          <div className="absolute inset-0">
            {/* Subtle geometric pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id={`pattern-${account.id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="1.5" fill="currentColor" opacity="0.3"/>
                    <circle cx="10" cy="30" r="1" fill="currentColor" opacity="0.2"/>
                    <circle cx="30" cy="10" r="1" fill="currentColor" opacity="0.2"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#pattern-${account.id})`}/>
              </svg>
            </div>
            
            {/* Modern overlay gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-12 -translate-x-12 blur-xl" />
          </div>

          {/* Default Account Indicator */}
          {account.is_default && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-amber-400/20 text-amber-100 border-amber-400/30 backdrop-blur-sm font-medium">
                <Star className="h-3 w-3 mr-1 fill-current" />
                {t('defaultAccount')}
              </Badge>
            </div>
          )}

          {/* Card Actions Menu */}
          <div className="absolute top-4 left-4 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-full"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <Link href={`/dashboard/accounts/${account.id}`}>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('actions.viewDetails')}
                  </DropdownMenuItem>
                </Link>
                <Link href={`/dashboard/accounts/${account.id}/edit`}>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('actions.edit')}
                  </DropdownMenuItem>
                </Link>
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

          <CardContent className="relative h-full flex flex-col justify-between p-8 text-white">
            {/* Top Section - Bank Name & Account Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "p-3 rounded-2xl backdrop-blur-sm border border-white/30 shadow-lg",
                  accountConfig.iconBg
                )}>
                  {accountIcon}
                </div>
                <div>
                  <p className="text-white/90 text-sm font-medium uppercase tracking-wider mb-1">
                    {account.bank_name || 'FINMATE BANK'}
                  </p>
                  <h3 className="font-bold text-xl leading-tight">{account.name}</h3>
                  <p className="text-white/80 text-sm font-medium">{account.account_type_display}</p>
                </div>
              </div>
            </div>

            {/* EMV Chip - Modern Bank Card Element */}
            <div className="absolute top-20 left-8">
              <div className="relative">
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 shadow-lg">
                  <div className="absolute inset-1 rounded-sm bg-gradient-to-br from-yellow-100 to-yellow-200">
                    <div className="w-full h-full grid grid-cols-4 grid-rows-3 gap-px p-1">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="bg-yellow-300/60 rounded-sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Number */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-2xl font-bold tracking-[0.2em] mb-2">
                  {account.account_number 
                    ? `•••• •••• •••• ${account.account_number.slice(-4)}`
                    : '•••• •••• •••• ••••'
                  }
                </div>
                <div className="text-white/80 text-sm uppercase tracking-wider">
                  CARD NUMBER
                </div>
              </div>
            </div>

            {/* Balance Section - Prominent Display */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-white/80 text-sm font-medium tracking-wide">CURRENT BALANCE</span>
                {isPositiveBalance ? (
                  <ArrowUpRight className="h-4 w-4 text-green-300" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-300" />
                )}
              </div>
              <div className="text-4xl font-bold tracking-tight mb-1">
                ৳{Math.abs(account.balance).toLocaleString()}
              </div>
              {account.balance < 0 && (
                <div className="text-red-300 text-sm font-medium">Overdrawn</div>
              )}
            </div>

            {/* Bottom Section - Cardholder & Expiry */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">CARDHOLDER NAME</p>
                <p className="text-white text-lg font-bold uppercase tracking-wide">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ACCOUNT HOLDER'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">VALID THRU</p>
                <p className="text-white text-lg font-mono font-bold">
                  {new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                    month: '2-digit', 
                    year: '2-digit' 
                  })}
                </p>
              </div>
            </div>

            {/* Card Network Logo Area */}
            <div className="absolute bottom-8 right-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-5 rounded-sm bg-white/20 flex items-center justify-center">
                  <div className="w-6 h-3 rounded-full bg-white/80" />
                </div>
                <div className="w-8 h-5 rounded-sm bg-white/20 flex items-center justify-center">
                  <div className="w-6 h-3 rounded-full bg-white/60" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
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

function AddAccountCard() {
  const t = useTranslations('accounts')
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full h-full"
    >
      <Link href="/dashboard/accounts/create" className="block w-full h-full">
        <Card className={cn(
          "group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer rounded-2xl",
          "w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-600",
          "hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
          "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600"
        )}>
          
          {/* Background pattern for consistency */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="add-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#add-pattern)"/>
            </svg>
          </div>

          {/* Decorative gradients */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 dark:bg-blue-400/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:bg-blue-300/30 transition-colors" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/20 dark:bg-indigo-400/10 rounded-full translate-y-12 -translate-x-12 blur-xl group-hover:bg-indigo-300/30 transition-colors" />
          </div>

          <CardContent className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300",
                "bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50",
                "group-hover:from-blue-200 group-hover:to-indigo-300 dark:group-hover:from-blue-800/60 dark:group-hover:to-indigo-800/60",
                "group-hover:scale-110 group-hover:rotate-3 shadow-2xl"
              )}>
                <Plus className="h-12 w-12 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
              </div>
            </div>
            
            <div className="absolute bottom-8 left-8 right-8 text-center">
              <h3 className="font-bold text-2xl text-slate-900 dark:text-slate-100 mb-3 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">
                {t('createAccount')}
              </h3>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors leading-relaxed">
                {t('createAccountDescription')}
              </p>
              
              <div className="mt-4 pt-4 border-t border-dashed border-slate-300 dark:border-slate-600">
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">
                  Click to Add New Account
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function AccountsListSkeleton() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-full h-64">
            <Card className="w-full h-full border-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 animate-pulse rounded-2xl">
              <CardContent className="h-full flex flex-col justify-between p-8">
                {/* Top section - Bank & Account */}
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-slate-300 dark:bg-slate-600 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-slate-300 dark:bg-slate-600 rounded" />
                    <div className="h-5 w-32 bg-slate-300 dark:bg-slate-600 rounded" />
                    <div className="h-3 w-24 bg-slate-300 dark:bg-slate-600 rounded" />
                  </div>
                </div>
                
                {/* EMV Chip */}
                <div className="absolute top-20 left-8">
                  <div className="w-12 h-9 bg-slate-300 dark:bg-slate-600 rounded-md" />
                </div>
                
                {/* Card Number section */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="space-y-2 text-center">
                    <div className="h-6 w-64 bg-slate-300 dark:bg-slate-600 rounded mx-auto" />
                    <div className="h-3 w-20 bg-slate-300 dark:bg-slate-600 rounded mx-auto" />
                  </div>
                </div>
                
                {/* Balance section */}
                <div className="text-center mb-6">
                  <div className="h-3 w-28 bg-slate-300 dark:bg-slate-600 rounded mx-auto mb-2" />
                  <div className="h-10 w-48 bg-slate-300 dark:bg-slate-600 rounded mx-auto" />
                </div>
                
                {/* Bottom section - Cardholder & Expiry */}
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-2 w-24 bg-slate-300 dark:bg-slate-600 rounded" />
                    <div className="h-4 w-32 bg-slate-300 dark:bg-slate-600 rounded" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-2 w-16 bg-slate-300 dark:bg-slate-600 rounded" />
                    <div className="h-4 w-12 bg-slate-300 dark:bg-slate-600 rounded" />
                  </div>
                </div>
                
                {/* Card Network logos */}
                <div className="absolute bottom-8 right-8">
                  <div className="flex space-x-2">
                    <div className="w-8 h-5 bg-slate-300 dark:bg-slate-600 rounded-sm" />
                    <div className="w-8 h-5 bg-slate-300 dark:bg-slate-600 rounded-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}