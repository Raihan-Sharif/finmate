'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { 
  getUserAccounts, 
  updateAccount, 
  deleteAccount, 
  setDefaultAccount,
  formatAccountBalance,
  getAccountTypeDisplay
} from '@/lib/services/accounts'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Wallet, 
  Building2, 
  CreditCard, 
  PiggyBank, 
  TrendingUp, 
  Smartphone,
  CircleDollarSign,
  MoreHorizontal,
  Edit3,
  Trash2,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  Home,
  Car,
  ShoppingCart
} from 'lucide-react'
import { AccountWithBalance, AccountType } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export default function AccountSettings() {
  const { user } = useAuth()
  const t = useTranslations('accounts')
  const tCommon = useTranslations('common')
  
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [preferences, setPreferences] = useState({
    showZeroBalances: true,
    groupByType: false,
    defaultCurrency: 'BDT'
  })

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
      await loadAccounts() // Reload to update UI
      toast.success(t('success.defaultSet'))
    } catch (error: any) {
      console.error('Error setting default account:', error)
      toast.error(error.message || t('errors.defaultFailed'))
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!user?.id) return

    try {
      await deleteAccount(accountId, user.id)
      await loadAccounts() // Reload to update UI
      setDeleteDialogOpen(null)
      toast.success(t('success.deleted'))
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error(error.message || t('errors.deleteFailed'))
    }
  }

  const getIconComponent = (iconName: string, className: string = 'h-5 w-5') => {
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
    return <AccountSettingsSkeleton />
  }

  const filteredAccounts = preferences.showZeroBalances 
    ? accounts 
    : accounts.filter(account => account.balance !== 0)

  return (
    <div className="space-y-6">
      {/* Account Management */}
      <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span>Account Management</span>
          </CardTitle>
          <CardDescription>
            Manage your accounts, set defaults, and customize display options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {filteredAccounts.map((account) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="group"
                >
                  <AccountCard
                    account={account}
                    onSetDefault={() => handleSetDefault(account.id)}
                    onDelete={() => setDeleteDialogOpen(account.id)}
                    getIconComponent={getIconComponent}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredAccounts.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No accounts match your current filter settings</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-green-600" />
            <span>Display Preferences</span>
          </CardTitle>
          <CardDescription>
            Customize how your accounts are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Show Zero Balance Accounts</Label>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Display accounts with zero balance in the list
              </p>
            </div>
            <Switch
              checked={preferences.showZeroBalances}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({ ...prev, showZeroBalances: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Group by Account Type</Label>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Group similar account types together
              </p>
            </div>
            <Switch
              checked={preferences.groupByType}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({ ...prev, groupByType: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Account Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {accounts.length}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                Total Accounts
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {accounts.filter(a => a.balance > 0).length}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                Positive Balance
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {accounts.filter(a => a.balance < 0).length}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                Negative Balance
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {new Set(accounts.map(a => a.type)).size}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                Account Types
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (() => {
        const account = accounts.find(a => a.id === deleteDialogOpen)
        return (
          <DeleteAccountDialog
            account={account}
            open={!!deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(null)}
            onConfirm={() => handleDeleteAccount(deleteDialogOpen)}
          />
        )
      })()}
    </div>
  )
}

interface AccountCardProps {
  account: AccountWithBalance
  onSetDefault: () => void
  onDelete: () => void
  getIconComponent: (iconName: string, className?: string) => React.ReactNode
}

function AccountCard({ account, onSetDefault, onDelete, getIconComponent }: AccountCardProps) {
  const t = useTranslations('accounts')

  return (
    <div 
      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group-hover:shadow-md"
    >
      <div className="flex items-center space-x-4">
        <div 
          className="p-3 rounded-lg text-white shadow-md"
          style={{ backgroundColor: account.color }}
        >
          {getIconComponent(account.icon)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {account.name}
            </h3>
            {account.is_default && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                <Star className="h-3 w-3 mr-1" />
                Default
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <span>{getAccountTypeDisplay(account.type as AccountType)}</span>
            {account.bank_name && (
              <>
                <span>•</span>
                <span>{account.bank_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className={`text-lg font-semibold ${
            account.balance >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {account.formatted_balance}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!account.is_default && (
              <DropdownMenuItem onClick={onSetDefault}>
                <Star className="h-4 w-4 mr-2" />
                {t('actions.setDefault')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Edit3 className="h-4 w-4 mr-2" />
              {t('actions.edit')}
            </DropdownMenuItem>
            {account.can_delete && (
              <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('actions.delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

interface DeleteAccountDialogProps {
  account?: AccountWithBalance | undefined
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

function DeleteAccountDialog({ account, open, onClose, onConfirm }: DeleteAccountDialogProps) {
  const t = useTranslations('accounts')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            <span>Delete Account</span>
          </DialogTitle>
          <DialogDescription>
            {account ? t('confirmDelete', { name: account.name }) : 'Are you sure you want to delete this account?'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
            <div className="flex items-start space-x-2">
              <X className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  This action cannot be undone
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  All transaction history for this account will remain but the account will be permanently deleted.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AccountSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(2)].map((_, i) => (
        <Card key={i} className="shadow-xl border-0">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center justify-between p-4 border rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}