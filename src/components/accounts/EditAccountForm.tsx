'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  getAccountById,
  updateAccount, 
  getAvailableAccountIcons, 
  getAvailableAccountColors,
  getAllowedAccountTypes
} from '@/lib/services/accounts'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { 
  Wallet, 
  Building2, 
  CreditCard, 
  PiggyBank, 
  TrendingUp, 
  Smartphone,
  CircleDollarSign,
  AlertTriangle,
  Check,
  Loader2,
  Save,
  X,
  Home,
  Car,
  ShoppingCart
} from 'lucide-react'
import { AccountType, CurrencyType, AccountWithBalance, AccountUpdate } from '@/types'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface EditAccountFormProps {
  accountId: string
}

export default function EditAccountForm({ accountId }: EditAccountFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const t = useTranslations('accounts')
  const tCommon = useTranslations('common')
  
  const [account, setAccount] = useState<AccountWithBalance | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '' as AccountType,
    currency: 'BDT' as CurrencyType,
    balance: '0',
    bank_name: '',
    account_number: '',
    icon: '',
    color: '',
    include_in_total: true,
    is_active: true
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allowedTypes, setAllowedTypes] = useState<AccountType[]>([])
  const availableIcons = getAvailableAccountIcons()
  const availableColors = getAvailableAccountColors()

  useEffect(() => {
    if (user?.id && accountId) {
      loadAccountData()
    }
  }, [user?.id, accountId])

  const loadAccountData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Load account details
      const accountData = await getAccountById(accountId, user.id)
      if (!accountData) {
        toast.error(t('errors.accountNotFound'))
        router.push('/dashboard/accounts')
        return
      }

      setAccount(accountData)
      setFormData({
        name: accountData.name,
        description: accountData.description || '',
        type: accountData.type as AccountType,
        currency: accountData.currency as CurrencyType,
        balance: accountData.balance.toString(),
        bank_name: accountData.bank_name || '',
        account_number: accountData.account_number || '',
        icon: accountData.icon,
        color: accountData.color,
        include_in_total: accountData.include_in_total,
        is_active: accountData.is_active
      })

      // Load allowed types (this would come from user's subscription plan)
      const types = await getAllowedAccountTypes('pro') // Default to pro for now
      setAllowedTypes(types)

    } catch (error) {
      console.error('Error loading account data:', error)
      toast.error(t('errors.loadFailed'))
      router.push('/dashboard/accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !account || !formData.name) return

    try {
      setSaving(true)
      
      const updateData: AccountUpdate = {
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        currency: formData.currency,
        balance: parseFloat(formData.balance) || 0,
        bank_name: formData.bank_name || null,
        account_number: formData.account_number || null,
        icon: formData.icon,
        color: formData.color,
        include_in_total: formData.include_in_total,
        is_active: formData.is_active
      }

      await updateAccount(account.id, user.id, updateData)
      toast.success(t('success.updated', { name: formData.name }))
      router.push(`/dashboard/accounts/${account.id}`)
      
    } catch (error: any) {
      console.error('Error updating account:', error)
      toast.error(error.message || t('errors.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/accounts/${accountId}`)
  }

  if (loading) {
    return <EditAccountFormSkeleton />
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-2xl flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {t('errors.accountNotFound')}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {t('errors.accountNotFoundDescription')}
        </p>
        <Button onClick={() => router.push('/dashboard/accounts')}>
          {tCommon('goBack')}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name" className="flex items-center space-x-2">
            <span>{t('create.accountName')}</span>
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('create.namePlaceholder')}
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="balance">{t('create.currentBalance')}</Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">{t('create.description')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder={t('create.descriptionPlaceholder')}
          rows={3}
          className="mt-1"
        />
      </div>

      {/* Account Type */}
      <div>
        <Label className="mb-3 block">{t('create.accountType')}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allowedTypes.map((type) => (
            <AccountTypeCard
              key={type}
              type={type}
              selected={formData.type === type}
              onClick={() => setFormData(prev => ({ ...prev, type }))}
              disabled={account.is_default && type !== account.type} // Prevent changing default account type
            />
          ))}
        </div>
        {account.is_default && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('edit.defaultAccountTypeWarning')}
          </p>
        )}
      </div>

      {/* Bank Details (for bank/credit_card types) */}
      {(formData.type === 'bank' || formData.type === 'credit_card') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="bank_name">{t('create.bankName')}</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
              placeholder={t('create.bankNamePlaceholder')}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="account_number">{t('create.accountNumber')}</Label>
            <Input
              id="account_number"
              value={formData.account_number}
              onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
              placeholder={t('create.accountNumberPlaceholder')}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Icon Selection */}
      <div>
        <Label className="mb-3 block">{t('create.chooseIcon')}</Label>
        <div className="grid grid-cols-5 gap-2">
          {availableIcons.map((iconOption) => (
            <button
              key={iconOption.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, icon: iconOption.value }))}
              className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                formData.icon === iconOption.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {getIconComponent(iconOption.value)}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <Label className="mb-3 block">{t('create.chooseColor')}</Label>
        <div className="grid grid-cols-5 gap-2">
          {availableColors.map((colorOption) => (
            <button
              key={colorOption.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, color: colorOption.value }))}
              className={`w-12 h-12 rounded-lg border-4 transition-all hover:scale-105 ${
                formData.color === colorOption.value
                  ? 'border-slate-400 dark:border-slate-500 shadow-lg'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
              style={{ backgroundColor: colorOption.value }}
            />
          ))}
        </div>
      </div>

      {/* Currency */}
      <div>
        <Label htmlFor="currency">{t('create.currency')}</Label>
        <Select 
          value={formData.currency} 
          onValueChange={(value: CurrencyType) => setFormData(prev => ({ ...prev, currency: value }))}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BDT">৳ Bangladeshi Taka (BDT)</SelectItem>
            <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
            <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
            <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
            <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="space-y-1">
            <Label className="text-sm font-medium">{t('edit.includeInTotal')}</Label>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('edit.includeInTotalDescription')}
            </p>
          </div>
          <Switch
            checked={formData.include_in_total}
            onCheckedChange={(checked) =>
              setFormData(prev => ({ ...prev, include_in_total: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="space-y-1">
            <Label className="text-sm font-medium">{t('edit.accountActive')}</Label>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('edit.accountActiveDescription')}
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData(prev => ({ ...prev, is_active: checked }))
            }
          />
        </div>
      </div>

      {/* Preview */}
      <div>
        <Label className="mb-3 block">{t('create.preview')}</Label>
        <Card className="overflow-hidden" style={{ background: `linear-gradient(135deg, ${formData.color}, ${formData.color}dd)` }}>
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/20">
                  {getIconComponent(formData.icon, 'h-5 w-5')}
                </div>
                <div>
                  <p className="font-semibold">{formData.name || t('create.namePlaceholder')}</p>
                  <p className="text-white/80 text-sm">{getAccountTypeDisplay(formData.type)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  {getCurrencySymbol(formData.currency)}{parseFloat(formData.balance || '0').toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="h-4 w-4 mr-2" />
          {tCommon('cancel')}
        </Button>

        <Button
          type="submit"
          disabled={saving || !formData.name}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('edit.saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('edit.saveChanges')}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

interface AccountTypeCardProps {
  type: AccountType
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

function AccountTypeCard({ type, selected, onClick, disabled = false }: AccountTypeCardProps) {
  const t = useTranslations('accounts')
  const config = getAccountTypeConfig(type, t)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
          : disabled
          ? 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg text-white ${config.gradient}`}>
          {config.icon}
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {config.name}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {config.description}
          </p>
        </div>
      </div>
    </motion.button>
  )
}

function getAccountTypeConfig(type: AccountType, t: any) {
  switch (type) {
    case 'cash':
      return {
        name: t('types.cash.name'),
        description: t('types.cash.description'),
        icon: <Wallet className="h-4 w-4" />,
        gradient: 'bg-gradient-to-br from-green-500 to-emerald-600'
      }
    case 'bank':
      return {
        name: t('types.bank.name'),
        description: t('types.bank.description'),
        icon: <Building2 className="h-4 w-4" />,
        gradient: 'bg-gradient-to-br from-blue-600 to-indigo-700'
      }
    case 'credit_card':
      return {
        name: t('types.creditCard.name'),
        description: t('types.creditCard.description'),
        icon: <CreditCard className="h-4 w-4" />,
        gradient: 'bg-gradient-to-br from-amber-500 to-orange-600'
      }
    case 'savings':
      return {
        name: t('types.savings.name'),
        description: t('types.savings.description'),
        icon: <PiggyBank className="h-4 w-4" />,
        gradient: 'bg-gradient-to-br from-purple-600 to-indigo-700'
      }
    case 'investment':
      return {
        name: t('types.investment.name'),
        description: t('types.investment.description'),
        icon: <TrendingUp className="h-4 w-4" />,
        gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600'
      }
    case 'wallet':
      return {
        name: t('types.wallet.name'),
        description: t('types.wallet.description'),
        icon: <Smartphone className="h-4 w-4" />,
        gradient: 'bg-gradient-to-br from-pink-500 to-rose-600'
      }
    default:
      return {
        name: t('types.other.name'),
        description: t('types.other.description'),
        icon: <CircleDollarSign className="h-4 w-4" />,
        gradient: 'bg-gradient-to-br from-slate-600 to-slate-700'
      }
  }
}

function getIconComponent(iconName: string, className: string = 'h-4 w-4') {
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

function getAccountTypeDisplay(type: AccountType): string {
  const displayNames = {
    cash: 'Cash Wallet',
    bank: 'Bank Account',
    credit_card: 'Credit Card',
    savings: 'Savings Account',
    investment: 'Investment Account',
    wallet: 'Digital Wallet',
    other: 'Other Account'
  }
  return displayNames[type] || type
}

function getCurrencySymbol(currency: CurrencyType): string {
  const symbols = {
    USD: '$',
    BDT: '৳',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$'
  }
  return symbols[currency] || currency
}

function EditAccountFormSkeleton() {
  return (
    <div className="space-y-8">
      {/* Basic Info Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i}>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
      
      {/* Description */}
      <div>
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
        <div className="h-20 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      
      {/* Account Type Cards */}
      <div>
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    </div>
  )
}