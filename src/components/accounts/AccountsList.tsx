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
          "group relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-0",
          "w-full shadow-lg", 
          accountConfig.gradient,
          account.is_default && "ring-2 ring-amber-400/80 ring-offset-2 dark:ring-offset-slate-900"
        )}
        style={{
          aspectRatio: '1.586/1', // Standard credit card ratio 85.6mm × 54mm
          borderRadius: '12px', // Standard card corner radius
          minHeight: '200px'
        }}>
          
          {/* Realistic Card Background */}
          <div className="absolute inset-0" style={{ borderRadius: '12px' }}>
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/5 to-transparent" style={{ borderRadius: '12px' }} />
            <div className="absolute inset-0 bg-gradient-to-tl from-black/10 via-transparent to-white/5" style={{ borderRadius: '12px' }} />
            
            {/* Card edge */}
            <div className="absolute inset-[0.5px] border border-white/20" style={{ borderRadius: '12px' }} />
          </div>

          {/* Default Account Badge */}
          {account.is_default && (
            <div className="absolute top-2 right-2 z-20">
              <Badge className="bg-amber-400/95 text-amber-900 border-0 font-medium px-2 py-0.5 text-xs">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Primary
              </Badge>
            </div>
          )}

          {/* Card Actions Menu */}
          <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20 rounded-full border border-white/30"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
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

          <CardContent className="relative h-full p-4 text-white flex flex-col justify-between">
            
            {/* TOP ROW: Bank Name + Network Logo */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "p-1.5 rounded-lg bg-white/20 border border-white/30",
                  accountConfig.iconBg
                )}>
                  {accountIcon}
                </div>
                <div>
                  <h3 className="text-white text-sm font-bold uppercase tracking-wide leading-tight">
                    {account.bank_name || 'FINMATE BANK'}
                  </h3>
                  <p className="text-white/80 text-xs font-medium">
                    {account.account_type_display || 'DEBIT CARD'}
                  </p>
                </div>
              </div>
              
              {/* Network Logo */}
              <div className="flex flex-col items-end">
                {getCardNetworkLogo(account.type)}
                <span className="text-white/70 text-[8px] font-medium uppercase tracking-wider mt-0.5">
                  {getCardNetwork(account.type)}
                </span>
              </div>
            </div>

            {/* MIDDLE: EMV Chip + Account Name */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {/* EMV Chip - Smaller & Realistic */}
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-400 border border-yellow-500/50 shadow-md">
                  <div className="w-full h-full p-1">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-300 rounded-sm">
                      <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-[1px] p-0.5">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="bg-yellow-600/60 rounded-[0.5px]" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Account Name */}
                <div>
                  <h2 className="text-white text-base font-bold leading-tight truncate max-w-[140px]">
                    {account.name}
                  </h2>
                  <p className="text-white/70 text-xs">
                    Account
                  </p>
                </div>
              </div>
            </div>

            {/* CARD NUMBER - Prominent Display */}
            <div className="mb-4">
              <div className="text-white text-lg lg:text-xl font-mono font-bold tracking-[0.15em] drop-shadow">
                {account.account_number 
                  ? `${account.account_number.slice(0, 4)} ${account.account_number.slice(4, 8)} ${account.account_number.slice(8, 12)} ${account.account_number.slice(12, 16)}`
                  : `4532 1234 5678 ${String(account.id).slice(-4).padStart(4, '0')}`
                }
              </div>
            </div>

            {/* BALANCE SECTION - Key Information */}
            <div className="flex items-end justify-between mb-3">
              <div className="flex-1">
                <p className="text-white/80 text-[10px] uppercase tracking-wide font-semibold mb-1">
                  Balance
                </p>
                <div className="text-white text-xl lg:text-2xl font-black tracking-tight">
                  ৳{Math.abs(account.balance).toLocaleString()}
                </div>
                {account.balance < 0 && (
                  <p className="text-red-300 text-xs font-medium">Overdrawn</p>
                )}
              </div>
              
              {/* Status Badge */}
              <div className="text-right">
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold",
                  isPositiveBalance 
                    ? "bg-green-500/30 text-green-200 border border-green-400/50" 
                    : "bg-red-500/30 text-red-200 border border-red-400/50"
                )}>
                  {isPositiveBalance ? 'Active' : 'Debit'}
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: Cardholder + Expiry */}
            <div className="flex items-end justify-between">
              <div className="flex-1">
                <p className="text-white/70 text-[9px] uppercase tracking-wider font-medium mb-0.5">
                  Cardholder
                </p>
                <p className="text-white text-sm font-bold uppercase tracking-wide leading-tight truncate max-w-[120px]">
                  {user?.user_metadata?.full_name?.slice(0, 16) || user?.email?.split('@')[0]?.slice(0, 12) || 'ACCOUNT HOLDER'}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-white/70 text-[9px] uppercase tracking-wider font-medium mb-0.5">
                  Valid Thru
                </p>
                <p className="text-white text-sm font-bold font-mono">
                  {new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                    month: '2-digit', 
                    year: '2-digit' 
                  })}
                </p>
              </div>
            </div>

            {/* SECURITY STRIP - Bottom Info */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/15">
              <span className="text-white/60 text-[8px] font-medium uppercase tracking-wider">
                {account.currency || 'BDT'} • CVV ***
              </span>
              <span className="text-white/60 text-[8px] font-medium uppercase tracking-wider">
                {account.account_number 
                  ? `****${account.account_number.slice(-4)}`
                  : `****${String(account.id).slice(-4).padStart(4, '0')}`
                }
              </span>
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
        gradient: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700',
        iconBg: 'bg-white/25',
        shadowColor: 'shadow-emerald-500/20'
      }
    case 'bank':
      return {
        gradient: 'bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800',
        iconBg: 'bg-white/25',
        shadowColor: 'shadow-blue-500/20'
      }
    case 'credit_card':
      return {
        gradient: 'bg-gradient-to-br from-rose-500 via-red-600 to-pink-700',
        iconBg: 'bg-white/25',
        shadowColor: 'shadow-rose-500/20'
      }
    case 'savings':
      return {
        gradient: 'bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800',
        iconBg: 'bg-white/25',
        shadowColor: 'shadow-violet-500/20'
      }
    case 'investment':
      return {
        gradient: 'bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700',
        iconBg: 'bg-white/25',
        shadowColor: 'shadow-cyan-500/20'
      }
    case 'wallet':
      return {
        gradient: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-700',
        iconBg: 'bg-white/25',
        shadowColor: 'shadow-amber-500/20'
      }
    default:
      return {
        gradient: 'bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800',
        iconBg: 'bg-white/25',
        shadowColor: 'shadow-slate-500/20'
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
      // Mastercard - overlapping circles
      return (
        <div className="flex items-center -space-x-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 border border-red-400/50" />
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 border border-orange-400/50" />
        </div>
      )
    case 'bank':
      // Visa - blue rectangle
      return (
        <div className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md text-white text-[10px] font-black tracking-wide shadow-md">
          VISA
        </div>
      )
    case 'savings':
      // Union Pay - circles
      return (
        <div className="flex items-center space-x-0.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-600" />
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600" />
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-green-600" />
        </div>
      )
    case 'investment':
      // American Express - rectangle
      return (
        <div className="px-2 py-1 bg-gradient-to-br from-slate-700 to-slate-900 rounded-md text-white text-[9px] font-bold shadow-md border border-slate-600">
          AMEX
        </div>
      )
    case 'wallet':
      // Digital wallet - modern design
      return (
        <div className="px-2 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md text-white text-[9px] font-bold shadow-md">
          PAY
        </div>
      )
    case 'cash':
      // FinMate brand - premium look
      return (
        <div className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-md text-white text-[9px] font-black tracking-wide shadow-md">
          FINMATE
        </div>
      )
    default:
      return (
        <div className="w-6 h-4 bg-gradient-to-r from-slate-500 to-slate-600 rounded-sm shadow-md" />
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
          "group relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-0",
          "w-full shadow-lg bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900",
          "border-2 border-dashed border-slate-400/60 dark:border-slate-600/60",
          "hover:border-blue-500/70 dark:hover:border-blue-400/70 hover:shadow-blue-500/20"
        )}
        style={{
          aspectRatio: '1.586/1',
          borderRadius: '12px',
          minHeight: '200px'
        }}>
          
          {/* Background */}
          <div className="absolute inset-0" style={{ borderRadius: '12px' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent" style={{ borderRadius: '12px' }} />
            <div className="absolute inset-0 bg-gradient-to-tl from-slate-300/20 via-transparent to-white/10 dark:from-slate-800/20 dark:to-slate-700/10" style={{ borderRadius: '12px' }} />
          </div>

          <CardContent className="relative h-full p-4 flex flex-col items-center justify-center text-center">
            
            {/* Plus Icon */}
            <div className="mb-6">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-500",
                "bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-800/70 dark:to-indigo-700/70",
                "group-hover:from-blue-200 group-hover:to-indigo-300 dark:group-hover:from-blue-700/80 dark:group-hover:to-indigo-600/80",
                "group-hover:scale-110 shadow-lg border border-blue-200/50 dark:border-blue-600/50"
              )}>
                <Plus className="h-8 w-8 text-blue-600 dark:text-blue-300 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-all duration-500" />
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-slate-800 dark:text-slate-200 text-lg font-bold mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              Add New Account
            </h3>
            
            {/* Subtitle */}
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-[140px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Connect your bank account or wallet
            </p>
            
            {/* Bottom Text */}
            <div className="mt-6 pt-3 border-t border-dashed border-slate-400/50 dark:border-slate-600/50 w-full">
              <span className="text-slate-500 dark:text-slate-500 text-xs font-medium uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Click to Add
              </span>
            </div>
            
            {/* Mock elements to make it look like a card */}
            <div className="absolute top-4 right-4">
              <div className="w-6 h-4 bg-slate-300/50 dark:bg-slate-600/50 rounded-sm" />
            </div>
            
            <div className="absolute top-12 left-4">
              <div className="w-8 h-5 bg-slate-300/30 dark:bg-slate-600/30 rounded-sm" />
            </div>
            
            <div className="absolute bottom-8 left-4 right-4">
              <div className="flex justify-between">
                <div className="space-y-1">
                  <div className="w-16 h-2 bg-slate-300/40 dark:bg-slate-600/40 rounded" />
                  <div className="w-12 h-2 bg-slate-300/40 dark:bg-slate-600/40 rounded" />
                </div>
                <div className="space-y-1">
                  <div className="w-8 h-2 bg-slate-300/40 dark:bg-slate-600/40 rounded" />
                  <div className="w-6 h-2 bg-slate-300/40 dark:bg-slate-600/40 rounded" />
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