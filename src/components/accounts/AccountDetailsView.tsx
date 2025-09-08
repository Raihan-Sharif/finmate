'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getAccountById, deleteAccount, setDefaultAccount } from '@/lib/services/accounts'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Wallet, 
  Building2, 
  CreditCard, 
  PiggyBank, 
  TrendingUp, 
  Smartphone,
  CircleDollarSign,
  Edit3,
  Trash2,
  Star,
  History,
  Eye,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MapPin,
  Hash,
  Loader2,
  AlertCircle,
  Home,
  Car,
  ShoppingCart
} from 'lucide-react'
import { AccountWithBalance } from '@/types'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AccountDetailsViewProps {
  accountId: string
}

export default function AccountDetailsView({ accountId }: AccountDetailsViewProps) {
  const { user } = useAuth()
  const router = useRouter()
  const t = useTranslations('accounts')
  const tCommon = useTranslations('common')
  
  const [account, setAccount] = useState<AccountWithBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id && accountId) {
      loadAccountDetails()
    }
  }, [user?.id, accountId])

  const loadAccountDetails = async () => {
    if (!user?.id) return

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(accountId)) {
      console.error('Invalid account ID format:', accountId)
      toast.error(t('errors.accountNotFound'))
      router.push('/dashboard/accounts')
      return
    }

    try {
      setLoading(true)
      const data = await getAccountById(accountId, user.id)
      if (!data) {
        toast.error(t('errors.accountNotFound'))
        router.push('/dashboard/accounts')
        return
      }
      setAccount(data)
    } catch (error) {
      console.error('Error loading account details:', error)
      toast.error(t('errors.loadFailed'))
      router.push('/dashboard/accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async () => {
    if (!user?.id || !account) return

    try {
      setActionLoading('setDefault')
      await setDefaultAccount(account.id, user.id)
      await loadAccountDetails() // Reload to update default status
      toast.success(t('success.defaultSet'))
    } catch (error: any) {
      console.error('Error setting default account:', error)
      toast.error(error.message || t('errors.defaultFailed'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!user?.id || !account) return

    try {
      setActionLoading('delete')
      await deleteAccount(account.id, user.id)
      toast.success(t('success.deleted', { name: account.name }))
      router.push('/dashboard/accounts')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error(error.message || t('errors.deleteFailed'))
      setActionLoading(null)
      setDeleteDialogOpen(false)
    }
  }

  const getIconComponent = (iconName: string, className: string = 'h-6 w-6') => {
    const iconProps = { className }
    
    switch (iconName) {
      case 'wallet': return <Wallet {...iconProps} />
      case 'building-2': return <Building2 {...iconProps} />
      case 'credit-card': return <CreditCard {...iconProps} />
      case 'piggy-bank': return <PiggyBank {...iconProps} />
      case 'trending-up': return <TrendingUp {...iconProps} />
      case 'smartphone': return <Smartphone {...iconProps} />
      case 'home': return <Home {...iconProps} />
      case 'car': return <Car {...iconProps} />
      case 'shopping-cart': return <ShoppingCart {...iconProps} />
      default: return <CircleDollarSign {...iconProps} />
    }
  }

  if (loading) {
    return <AccountDetailsViewSkeleton />
  }

  if (!account) {
    return (
      <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {t('errors.accountNotFound')}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t('errors.accountNotFoundDescription')}
          </p>
          <Link href="/dashboard/accounts">
            <Button>{tCommon('goBack')}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const isPositiveBalance = account.balance >= 0
  const accountConfig = getAccountConfig(account.type)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Account Header Card */}
      <Card className={cn(
        "shadow-2xl border-0 overflow-hidden",
        accountConfig.gradient
      )}>
        {account.is_default && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-white/20 text-white border-white/30">
              <Star className="h-3 w-3 mr-1 fill-current" />
              {t('defaultAccount')}
            </Badge>
          </div>
        )}
        
        {/* Modern gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
        {/* Decorative blurred elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 blur-xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-12 -translate-x-12 blur-lg" />
        
        <CardContent className="relative p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                {getIconComponent(account.icon, 'h-8 w-8')}
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">{account.name}</h1>
                <p className="text-white/80">{account.account_type_display}</p>
                {account.description && (
                  <p className="text-white/70 text-sm mt-1">{account.description}</p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                {isPositiveBalance ? (
                  <ArrowUpRight className="h-5 w-5 text-green-300" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-300" />
                )}
                <span className="text-3xl font-bold">
                  {account.formatted_balance}
                </span>
              </div>
              <p className="text-white/80 text-sm">{t('currentBalance')}</p>
            </div>
          </div>

          {/* Account Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <div className="text-center">
              <div className="text-xl font-semibold">{account.currency}</div>
              <div className="text-white/70 text-sm">{t('currency')}</div>
            </div>
            
            {account.bank_name && (
              <div className="text-center">
                <div className="text-xl font-semibold">{account.bank_name}</div>
                <div className="text-white/70 text-sm">{t('bankName')}</div>
              </div>
            )}
            
            {account.account_number && (
              <div className="text-center">
                <div className="text-xl font-semibold font-mono">
                  ****{account.account_number.slice(-4)}
                </div>
                <div className="text-white/70 text-sm">{t('accountNumber')}</div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-xl font-semibold">
                {account.include_in_total ? t('yes') : t('no')}
              </div>
              <div className="text-white/70 text-sm">{t('includeInTotal')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/dashboard/accounts/${account.id}/edit`}>
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            <Edit3 className="h-4 w-4 mr-2" />
            {t('actions.edit')}
          </Button>
        </Link>

        {!account.is_default && (
          <Button
            size="lg"
            variant="outline"
            onClick={handleSetDefault}
            disabled={actionLoading === 'setDefault'}
          >
            {actionLoading === 'setDefault' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Star className="h-4 w-4 mr-2" />
            )}
            {t('actions.setDefault')}
          </Button>
        )}

        <Button size="lg" variant="outline">
          <History className="h-4 w-4 mr-2" />
          {t('viewTransactions')}
        </Button>

        <Button size="lg" variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          {t('accountSettings')}
        </Button>

        {account.can_delete && (
          <Button
            size="lg"
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('actions.delete')}
          </Button>
        )}
      </div>

      {/* Account Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Stats */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>{t('accountStats')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('createdAt')}
                </span>
                <span className="font-medium">
                  {new Date(account.created_at).toLocaleDateString()}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  {t('status')}
                </span>
                <Badge variant={account.is_active ? 'default' : 'secondary'}>
                  {account.is_active ? t('active') : t('inactive')}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                  <Hash className="h-4 w-4 mr-2" />
                  {t('accountId')}
                </span>
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {account.id.slice(-8)}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Placeholder */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5 text-green-600" />
              <span>{t('recentActivity')}</span>
            </CardTitle>
            <CardDescription>
              {t('recentActivityDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <History className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">{t('noTransactions')}</p>
              <p className="text-sm">{t('noTransactionsDescription')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>{t('confirmDeleteTitle')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('confirmDelete', { name: account.name })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    {t('deleteWarning')}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {t('deleteWarningDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={actionLoading === 'delete'}
            >
              {tCommon('cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={actionLoading === 'delete'}
            >
              {actionLoading === 'delete' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('actions.delete')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function getAccountConfig(type: string) {
  switch (type) {
    case 'cash':
      return {
        gradient: 'bg-gradient-to-br from-green-500 via-green-600 to-emerald-700'
      }
    case 'bank':
      return {
        gradient: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800'
      }
    case 'credit_card':
      return {
        gradient: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600'
      }
    case 'savings':
      return {
        gradient: 'bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800'
      }
    case 'investment':
      return {
        gradient: 'bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-700'
      }
    case 'wallet':
      return {
        gradient: 'bg-gradient-to-br from-pink-500 via-pink-600 to-rose-700'
      }
    default:
      return {
        gradient: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800'
      }
  }
}

function AccountDetailsViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Card Skeleton */}
      <Card className="shadow-2xl border-0 bg-slate-200 dark:bg-slate-800 animate-pulse overflow-hidden">
        <div className="h-48 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-slate-300 dark:bg-slate-700 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-slate-300 dark:bg-slate-700 rounded" />
                <div className="h-4 w-32 bg-slate-300 dark:bg-slate-700 rounded" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="h-8 w-32 bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-6 mt-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-6 w-16 bg-slate-300 dark:bg-slate-700 rounded mx-auto" />
                <div className="h-4 w-12 bg-slate-300 dark:bg-slate-700 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Action Buttons Skeleton */}
      <div className="flex flex-wrap gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        ))}
      </div>

      {/* Info Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="shadow-xl border-0">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}