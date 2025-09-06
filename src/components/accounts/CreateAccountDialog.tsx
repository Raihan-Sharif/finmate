'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { 
  createAccount, 
  canUserCreateAccount, 
  getAvailableAccountIcons, 
  getAvailableAccountColors,
  getDefaultAccountIcon,
  getDefaultAccountColor
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  Sparkles,
  Crown
} from 'lucide-react'
import { AccountType, CurrencyType } from '@/types'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface CreateAccountDialogProps {
  onClose: () => void
}

export function CreateAccountDialog({ onClose }: CreateAccountDialogProps) {
  const { user } = useAuth()
  const t = useTranslations('accounts')
  const tCommon = useTranslations('common')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '' as AccountType,
    currency: 'BDT' as CurrencyType,
    balance: '0',
    bank_name: '',
    account_number: '',
    icon: '',
    color: ''
  })
  
  const [limits, setLimits] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const availableIcons = getAvailableAccountIcons()
  const availableColors = getAvailableAccountColors()

  useEffect(() => {
    if (user?.id) {
      loadAccountLimits()
    }
  }, [user?.id])

  useEffect(() => {
    if (formData.type) {
      setFormData(prev => ({
        ...prev,
        icon: prev.icon || getDefaultAccountIcon(prev.type),
        color: prev.color || getDefaultAccountColor(prev.type)
      }))
    }
  }, [formData.type])

  const loadAccountLimits = async () => {
    if (!user?.id) return

    try {
      const data = await canUserCreateAccount(user.id)
      setLimits(data)
    } catch (error) {
      console.error('Error loading limits:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !formData.name || !formData.type) return

    try {
      setLoading(true)
      await createAccount({
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        currency: formData.currency,
        balance: parseFloat(formData.balance) || 0,
        bank_name: formData.bank_name || null,
        account_number: formData.account_number || null,
        icon: formData.icon,
        color: formData.color,
        is_active: true
      })

      toast.success(t('success.created', { name: formData.name }))
      onClose()
    } catch (error: any) {
      console.error('Error creating account:', error)
      toast.error(error.message || t('errors.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (!limits) {
    return <CreateAccountDialogSkeleton />
  }

  // Check if user can create accounts
  if (!limits.canCreate) {
    return (
      <div className="space-y-6">
        <LimitReachedWarning limits={limits} />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              stepNumber === step 
                ? 'bg-blue-600 text-white' 
                : stepNumber < step
                ? 'bg-green-600 text-white'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
            }`}>
              {stepNumber < step ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`w-8 h-0.5 transition-all ${
                stepNumber < step ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t('create.step1.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('create.step1.description')}
              </p>
            </div>

            <div className="space-y-4">
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
                />
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

              <div>
                <Label htmlFor="balance">{t('create.initialBalance')}</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t('create.step2.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('create.step2.description')}
              </p>
            </div>

            <div>
              <Label className="flex items-center space-x-2 mb-3">
                <span>{t('create.accountType')}</span>
                <span className="text-red-500">*</span>
              </Label>
              
              <div className="grid grid-cols-2 gap-3">
                {limits.allowedTypes.map((type: AccountType) => (
                  <AccountTypeCard
                    key={type}
                    type={type}
                    selected={formData.type === type}
                    onClick={() => setFormData(prev => ({ ...prev, type }))}
                  />
                ))}
              </div>

              {limits.planType === 'free' && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
                  <div className="flex items-start space-x-2">
                    <Crown className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        {t('create.upgradeForMore')}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        {t('create.upgradeDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(formData.type === 'bank' || formData.type === 'credit_card') && (
              <div className="space-y-4 mt-6">
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
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t('create.step3.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {t('create.step3.description')}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>{t('create.chooseIcon')}</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
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

              <div>
                <Label>{t('create.chooseColor')}</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
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
            </div>

            {/* Preview */}
            <div className="mt-6">
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
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => step > 1 ? setStep(step - 1) : onClose()}
          disabled={loading}
        >
          {step > 1 ? tCommon('back') : tCommon('cancel')}
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && !formData.name) ||
              (step === 2 && !formData.type)
            }
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {t('create.next')}
            <Sparkles className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={loading || !formData.name || !formData.type}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('create.creating')}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('create.createAccount')}
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  )
}

interface AccountTypeCardProps {
  type: AccountType
  selected: boolean
  onClick: () => void
}

function AccountTypeCard({ type, selected, onClick }: AccountTypeCardProps) {
  const t = useTranslations('accounts')
  const config = getAccountTypeConfig(type, t)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
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

function LimitReachedWarning({ limits }: { limits: any }) {
  const t = useTranslations('accounts')
  
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-amber-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {t('create.limitReached')}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
        {t('create.limitReachedDescription', { 
          current: limits.current, 
          limit: limits.limit,
          plan: limits.planType 
        })}
      </p>
      
      {limits.planType === 'free' && (
        <div className="space-y-3">
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
            <Crown className="h-4 w-4 mr-2" />
            {t('create.upgradeToPro')}
          </Button>
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            {t('create.upgradeToMax')}
          </Button>
        </div>
      )}
    </div>
  )
}

function CreateAccountDialogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center space-x-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}