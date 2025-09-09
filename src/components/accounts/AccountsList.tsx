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
          "group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer border-0 rounded-3xl",
          "w-full h-full shadow-xl", 
          accountConfig.gradient,
          accountConfig.shadowColor,
          "hover:shadow-2xl",
          account.is_default && "ring-2 ring-amber-400 ring-offset-4 dark:ring-offset-slate-900 shadow-amber-200/50"
        )}>
          
          {/* Enhanced Card Background - Premium Bank Card Style */}
          <div className="absolute inset-0">
            {/* Layered gradient background */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20", accountConfig.accentGlow)} />
            
            {/* Premium glass morphism effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tl from-black/10 via-transparent to-white/5" />
            
            {/* Sophisticated geometric pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id={`pattern-${account.id}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="30" cy="30" r="2" fill="white" opacity="0.4"/>
                    <circle cx="15" cy="45" r="1.5" fill="white" opacity="0.3"/>
                    <circle cx="45" cy="15" r="1.5" fill="white" opacity="0.3"/>
                    <circle cx="10" cy="20" r="1" fill="white" opacity="0.2"/>
                    <circle cx="50" cy="40" r="1" fill="white" opacity="0.2"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#pattern-${account.id})`}/>
              </svg>
            </div>
            
            {/* Premium light effects */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12 blur-xl" />
            
            {/* Subtle border glow */}
            <div className="absolute inset-[1px] rounded-3xl border border-white/20" />
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
            {/* Top Section - Bank Name & Account Type */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2.5 rounded-2xl backdrop-blur-sm border border-white/30 shadow-lg",
                  accountConfig.iconBg
                )}>
                  {accountIcon}
                </div>
                <div>
                  <p className="text-white/90 text-xs font-semibold uppercase tracking-[0.1em] mb-1">
                    {account.bank_name || 'FINMATE BANK'}
                  </p>
                  <h3 className="font-bold text-lg leading-tight">{account.name}</h3>
                  <p className="text-white/75 text-xs font-medium uppercase tracking-wide">
                    {account.account_type_display || 'DEBIT CARD'}
                  </p>
                </div>
              </div>
              
              {/* Card Network Logo */}
              <div className="flex items-center">
                <div className="text-right">
                  <p className="text-white/60 text-[10px] uppercase tracking-wider font-medium">
                    {getCardNetwork(account.type)}
                  </p>
                </div>
              </div>
            </div>

            {/* Premium EMV Chip - Ultra-realistic */}
            <div className="absolute top-20 left-8">
              <div className="relative">
                {/* Chip outer shell */}
                <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-amber-200 via-yellow-300 to-gold-400 shadow-2xl border border-yellow-400/50">
                  {/* Chip inner surface */}
                  <div className="absolute inset-1 rounded-md bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200 border border-yellow-300/30">
                    {/* Circuit pattern */}
                    <div className="w-full h-full grid grid-cols-4 grid-rows-3 gap-0.5 p-1.5">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="bg-amber-400/70 rounded-sm shadow-inner" />
                      ))}
                    </div>
                    {/* Metallic shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-md" />
                  </div>
                  {/* Chip depth shadow */}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-600/30 to-transparent rounded-b-lg" />
                </div>
              </div>
            </div>

            {/* Card Number - More realistic positioning */}
            <div className="absolute top-32 left-8 right-8">
              <div className="font-mono text-xl md:text-2xl font-bold tracking-[0.15em] text-white">
                {account.account_number 
                  ? `•••• •••• •••• ${account.account_number.slice(-4)}`
                  : `•••• •••• •••• ${String(account.id).slice(-4)}`
                }
              </div>
            </div>

            {/* Premium Balance Section - Center positioned like a luxury card */}
            <div className="absolute top-44 left-8 right-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-white/80 text-[11px] uppercase tracking-[0.1em] font-semibold mb-2 drop-shadow-sm">
                    AVAILABLE BALANCE
                  </div>
                  <div className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                    ৳{Math.abs(account.balance).toLocaleString()}
                  </div>
                  {account.balance < 0 && (
                    <div className="text-red-200 text-sm font-medium mt-1 drop-shadow-sm">Overdrawn</div>
                  )}
                </div>
                
                {/* Enhanced balance trend indicator */}
                <div className="flex flex-col items-center">
                  {isPositiveBalance ? (
                    <div className="p-2 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 shadow-lg">
                      <ArrowUpRight className="h-4 w-4 text-green-200 drop-shadow-sm" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-gradient-to-br from-red-400/30 to-rose-500/20 backdrop-blur-sm border border-red-400/30 shadow-lg">
                      <ArrowDownRight className="h-4 w-4 text-red-200 drop-shadow-sm" />
                    </div>
                  )}
                  <div className="text-[9px] text-white/60 mt-1 uppercase tracking-wider font-medium">
                    {isPositiveBalance ? 'POSITIVE' : 'NEGATIVE'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section - Cardholder & Expiry */}
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1 font-medium">CARDHOLDER</p>
                  <p className="text-white text-sm font-bold uppercase tracking-wide leading-tight">
                    {user?.user_metadata?.full_name?.slice(0, 20) || user?.email?.split('@')[0]?.slice(0, 15) || 'ACCOUNT HOLDER'}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1 font-medium">EXPIRES</p>
                  <p className="text-white text-sm font-mono font-bold">
                    {new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                      month: '2-digit', 
                      year: '2-digit' 
                    })}
                  </p>
                </div>
                
                {/* Premium Card Network Logo */}
                <div className="ml-4 flex items-center">
                  <div className="relative">
                    {getCardNetworkLogo(account.type)}
                  </div>
                </div>
              </div>
              
              {/* Additional card info */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                <div className="text-white/50 text-[9px] uppercase tracking-wider font-medium">
                  {account.account_number ? `****${account.account_number.slice(-4)}` : `****${String(account.id).slice(-4)}`}
                </div>
                <div className="text-white/50 text-[9px] uppercase tracking-wider font-medium">
                  {account.currency || 'BDT'}
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
        gradient: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
        iconBg: 'bg-white/30',
        shadowColor: 'shadow-emerald-500/25',
        accentGlow: 'from-emerald-400/20 via-green-500/10 to-teal-600/20'
      }
    case 'bank':
      return {
        gradient: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700',
        iconBg: 'bg-white/30',
        shadowColor: 'shadow-blue-500/25',
        accentGlow: 'from-blue-500/20 via-indigo-600/10 to-purple-700/20'
      }
    case 'credit_card':
      return {
        gradient: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600',
        iconBg: 'bg-white/30',
        shadowColor: 'shadow-orange-500/25',
        accentGlow: 'from-orange-400/20 via-red-500/10 to-pink-600/20'
      }
    case 'savings':
      return {
        gradient: 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700',
        iconBg: 'bg-white/30',
        shadowColor: 'shadow-violet-500/25',
        accentGlow: 'from-violet-500/20 via-purple-600/10 to-indigo-700/20'
      }
    case 'investment':
      return {
        gradient: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
        iconBg: 'bg-white/30',
        shadowColor: 'shadow-cyan-500/25',
        accentGlow: 'from-cyan-400/20 via-blue-500/10 to-indigo-600/20'
      }
    case 'wallet':
      return {
        gradient: 'bg-gradient-to-br from-pink-400 via-rose-500 to-red-600',
        iconBg: 'bg-white/30',
        shadowColor: 'shadow-pink-500/25',
        accentGlow: 'from-pink-400/20 via-rose-500/10 to-red-600/20'
      }
    default:
      return {
        gradient: 'bg-gradient-to-br from-slate-500 via-gray-600 to-slate-700',
        iconBg: 'bg-white/30',
        shadowColor: 'shadow-slate-500/25',
        accentGlow: 'from-slate-500/20 via-gray-600/10 to-slate-700/20'
      }
  }
}

function getCardNetwork(type: string) {
  switch (type) {
    case 'credit_card':
      return 'MASTERCARD'
    case 'bank':
      return 'VISA'
    case 'savings':
      return 'MAESTRO'
    case 'investment':
      return 'AMEX'
    case 'wallet':
      return 'PAYPAL'
    case 'cash':
      return 'FINMATE'
    default:
      return 'NETWORK'
  }
}

function getCardNetworkLogo(type: string) {
  switch (type) {
    case 'credit_card':
      // Mastercard style - overlapping circles
      return (
        <div className="flex items-center">
          <div className="w-7 h-5 rounded-sm bg-gradient-to-br from-red-400 to-red-600 shadow-lg" />
          <div className="w-7 h-5 rounded-sm bg-gradient-to-br from-orange-400 to-yellow-500 -ml-3 shadow-lg" />
        </div>
      )
    case 'bank':
      // Visa style - single blue rectangle
      return (
        <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-700 rounded text-white text-xs font-bold tracking-wider shadow-lg">
          VISA
        </div>
      )
    case 'savings':
      // Maestro style - red and blue circles
      return (
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-md" />
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md" />
        </div>
      )
    case 'investment':
      // Amex style - square with text
      return (
        <div className="px-2 py-1 bg-gradient-to-br from-slate-600 to-slate-800 rounded text-white text-xs font-bold shadow-lg">
          AMEX
        </div>
      )
    case 'wallet':
      // PayPal style - blue rectangle
      return (
        <div className="px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded text-white text-xs font-bold shadow-lg">
          PAY
        </div>
      )
    case 'cash':
      // FinMate brand
      return (
        <div className="px-2 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded text-white text-xs font-bold shadow-lg">
          FIN
        </div>
      )
    default:
      return (
        <div className="w-8 h-5 bg-gradient-to-r from-slate-400 to-slate-600 rounded shadow-lg" />
      )
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
          "group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer rounded-3xl",
          "w-full h-full border-2 border-dashed border-slate-300/50 dark:border-slate-600/50 shadow-xl",
          "hover:border-blue-400/70 dark:hover:border-blue-500/70 hover:bg-blue-50/30 dark:hover:bg-blue-950/10",
          "bg-gradient-to-br from-slate-50/80 via-slate-100/60 to-slate-200/80 dark:from-slate-800/60 dark:via-slate-700/40 dark:to-slate-600/60",
          "backdrop-blur-sm hover:shadow-blue-500/20"
        )}>
          
          {/* Enhanced background with premium effects */}
          <div className="absolute inset-0">
            {/* Glass morphism effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tl from-slate-200/20 via-transparent to-blue-100/10" />
            
            {/* Sophisticated pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="add-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                    <circle cx="25" cy="25" r="1.5" fill="currentColor" opacity="0.4"/>
                    <circle cx="12" cy="37" r="1" fill="currentColor" opacity="0.3"/>
                    <circle cx="37" cy="12" r="1" fill="currentColor" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#add-pattern)"/>
              </svg>
            </div>
            
            {/* Premium light effects */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-300/10 rounded-full -translate-y-20 translate-x-20 blur-3xl group-hover:bg-blue-400/20 transition-all duration-500" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-300/10 rounded-full translate-y-16 -translate-x-16 blur-2xl group-hover:bg-indigo-400/20 transition-all duration-500" />
            
            {/* Subtle border glow */}
            <div className="absolute inset-[1px] rounded-3xl border border-white/30" />
          </div>

          <CardContent className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-500",
                "bg-gradient-to-br from-blue-200/80 via-indigo-300/60 to-purple-400/40 dark:from-blue-800/60 dark:via-indigo-700/40 dark:to-purple-600/30",
                "group-hover:from-blue-300/90 group-hover:via-indigo-400/70 group-hover:to-purple-500/50 dark:group-hover:from-blue-700/70 dark:group-hover:via-indigo-600/50 dark:group-hover:to-purple-500/40",
                "group-hover:scale-110 group-hover:rotate-6 shadow-2xl backdrop-blur-sm border border-white/40",
                "shadow-blue-500/25 group-hover:shadow-indigo-500/35"
              )}>
                <Plus className="h-14 w-14 text-blue-700 dark:text-blue-200 group-hover:text-blue-800 dark:group-hover:text-blue-100 transition-all duration-500 drop-shadow-lg" />
              </div>
            </div>
            
            <div className="absolute bottom-8 left-8 right-8 text-center">
              <h3 className="font-bold text-3xl text-slate-900 dark:text-slate-100 mb-4 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-all duration-300 drop-shadow-sm">
                {t('createAccount')}
              </h3>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all duration-300 leading-relaxed drop-shadow-sm">
                {t('createAccountDescription')}
              </p>
              
              <div className="mt-6 pt-4 border-t border-dashed border-slate-400/50 dark:border-slate-500/50">
                <div className="text-sm text-slate-500 dark:text-slate-400 font-semibold tracking-[0.1em] uppercase drop-shadow-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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