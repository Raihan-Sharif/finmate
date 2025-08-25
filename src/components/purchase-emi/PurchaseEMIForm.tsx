'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Calculator, 
  Store, 
  Package,
  CreditCard,
  Calendar,
  Percent,
  DollarSign,
  Smartphone,
  Laptop,
  Home,
  Car
} from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { renderIcon } from '@/lib/utils/iconMapping'
import { useTranslations } from 'next-intl'

// Schema will be created inside the component to access translations

type PurchaseEMIFormSchema = {
  item_name: string
  lender: string
  principal_amount: number
  interest_rate: number
  tenure_months: number
  start_date: string
  payment_day?: number
  account_id?: string
  category_selection?: string
  auto_debit?: boolean
  reminder_days?: number
  notes?: string
}

interface PurchaseEMIFormProps {
  emi?: any | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

const PURCHASE_CATEGORIES = [
  { value: 'electronics', label: 'Electronics', icon: Smartphone },
  { value: 'appliances', label: 'Home Appliances', icon: Home },
  { value: 'furniture', label: 'Furniture', icon: Home },
  { value: 'vehicle', label: 'Vehicle', icon: Car },
  { value: 'jewelry', label: 'Jewelry', icon: Package },
  { value: 'fashion', label: 'Fashion', icon: ShoppingCart },
  { value: 'other', label: 'Other', icon: Package }
]

export default function PurchaseEMIForm({ 
  emi, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: PurchaseEMIFormProps) {
  const { formatAmount, currency } = useAppStore()
  const { accounts, loading: accountsLoading } = useAccounts()
  const { categories, isLoading: categoriesLoading, dropdownOptions } = useCategories('expense')
  const t = useTranslations('credit')
  const tCommon = useTranslations('common')

  const purchaseEMISchema = z.object({
    item_name: z.string().min(1, t('purchaseEmi.form.errors.itemNameRequired')),
    lender: z.string().min(1, t('purchaseEmi.form.errors.vendorRequired')),
    principal_amount: z.number().min(1, t('purchaseEmi.form.errors.totalAmountPositive')),
    interest_rate: z.number().min(0, t('purchaseEmi.form.errors.interestRatePositive') || 'Interest rate must be 0 or greater').max(50, 'Interest rate cannot exceed 50%'),
    tenure_months: z.number().min(1, t('purchaseEmi.form.errors.tenurePositive')).max(120, 'Tenure cannot exceed 120 months'),
    start_date: z.string().min(1, t('purchaseEmi.form.errors.purchaseDateRequired')),
    payment_day: z.number().min(1, 'Payment day must be between 1-31').max(31, 'Payment day must be between 1-31').optional(),
    account_id: z.string().optional(),
    category_selection: z.string().optional(),
    auto_debit: z.boolean().optional(),
    reminder_days: z.number().min(1).max(30).optional(),
    notes: z.string().optional(),
  })
  const [emiCalculation, setEmiCalculation] = useState({
    emi: 0,
    totalAmount: 0,
    totalInterest: 0
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<PurchaseEMIFormSchema>({
    resolver: zodResolver(purchaseEMISchema),
    defaultValues: {
      item_name: emi?.notes?.split('Item: ')[1]?.split('\n')[0] || '',
      lender: emi?.lender || '',
      principal_amount: emi?.principal_amount || 0,
      interest_rate: emi?.interest_rate || 12,
      tenure_months: emi?.tenure_months || 12,
      start_date: emi?.start_date || new Date().toISOString().split('T')[0],
      payment_day: emi?.payment_day || 1,
      account_id: emi?.account_id || '',
      category_selection: emi?.subcategory_id ? `subcategory_${emi.subcategory_id}` : emi?.category_id ? `category_${emi.category_id}` : '',
      auto_debit: emi?.auto_debit || false,
      reminder_days: emi?.reminder_days || 3,
      notes: emi?.notes || '',
    }
  })

  // Update form values when emi prop changes (for edit mode)
  useEffect(() => {
    if (emi) {
      setValue('item_name', emi.notes?.split('Item: ')[1]?.split('\n')[0] || '')
      setValue('lender', emi.lender || '')
      setValue('principal_amount', emi.principal_amount || 0)
      setValue('interest_rate', emi.interest_rate || 12)
      setValue('tenure_months', emi.tenure_months || 12)
      setValue('start_date', emi.start_date || new Date().toISOString().split('T')[0])
      setValue('payment_day', emi.payment_day || 1)
      setValue('account_id', emi.account_id || '')
      setValue('category_selection', emi.subcategory_id ? `subcategory_${emi.subcategory_id}` : emi.category_id ? `category_${emi.category_id}` : '')
      setValue('auto_debit', emi.auto_debit || false)
      setValue('reminder_days', emi.reminder_days || 3)
      setValue('notes', emi.notes || '')
    }
  }, [emi, setValue])

  const watchedValues = watch(['principal_amount', 'interest_rate', 'tenure_months'])
  const [principalAmount, interestRate, tenureMonths] = watchedValues

  // Calculate EMI whenever values change
  useEffect(() => {
    if (principalAmount > 0 && interestRate >= 0 && tenureMonths > 0) {
      let emi: number
      if (interestRate === 0) {
        emi = principalAmount / tenureMonths
      } else {
        const monthlyRate = interestRate / 12 / 100
        emi = (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
              (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      }

      const totalAmount = emi * tenureMonths
      const totalInterest = totalAmount - principalAmount

      setEmiCalculation({
        emi: Math.round(emi * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100
      })
    }
  }, [principalAmount, interestRate, tenureMonths])

  const handleFormSubmit = async (data: PurchaseEMIFormSchema) => {
    try {
      // Combine item name with notes
      const notesWithItem = `Item: ${data.item_name}${data.notes ? '\nNotes: ' + data.notes : ''}`
      
      // Parse category selection to determine if it's a category or subcategory
      let category_id = null
      let subcategory_id = null
      
      if (data.category_selection) {
        if (data.category_selection.startsWith('category_')) {
          category_id = data.category_selection.replace('category_', '')
        } else if (data.category_selection.startsWith('subcategory_')) {
          subcategory_id = data.category_selection.replace('subcategory_', '')
        }
      }
      
      await onSubmit({
        lender: data.lender,
        principal_amount: Number(data.principal_amount),
        interest_rate: Number(data.interest_rate),
        tenure_months: Number(data.tenure_months),
        start_date: data.start_date,
        payment_day: data.payment_day ? Number(data.payment_day) : undefined,
        account_id: data.account_id || null,
        category_id,
        subcategory_id,
        auto_debit: data.auto_debit || false,
        reminder_days: data.reminder_days ? Number(data.reminder_days) : 3,
        notes: notesWithItem,
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error submitting purchase EMI form:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {emi ? t('purchaseEmi.editPurchaseEmi') : t('purchaseEmi.addPurchaseEmi')}
          </DialogTitle>
          <DialogDescription>
            {emi 
              ? t('purchaseEmi.updatePurchaseEmi')
              : t('purchaseEmi.subtitle')
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-4 w-4" />
                {tCommon('purchaseDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item_name">{t('purchaseEmi.itemProductName')}</Label>
                  <Input
                    id="item_name"
                    placeholder={t('purchaseEmi.form.itemNamePlaceholder') || 'e.g., iPhone 15 Pro, MacBook Air, Samsung TV'}
                    {...register('item_name')}
                    className={errors.item_name ? 'border-red-500' : ''}
                  />
                  {errors.item_name && (
                    <p className="text-sm text-red-500">{errors.item_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lender">{t('purchaseEmi.storeVendorName')}</Label>
                  <Input
                    id="lender"
                    placeholder={t('purchaseEmi.form.vendorPlaceholder') || 'e.g., Apple Store, Best Buy, Amazon'}
                    {...register('lender')}
                    className={errors.lender ? 'border-red-500' : ''}
                  />
                  {errors.lender && (
                    <p className="text-sm text-red-500">{errors.lender.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">{t('purchaseEmi.purchaseDate')}</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...register('start_date')}
                    className={errors.start_date ? 'border-red-500' : ''}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-red-500">{errors.start_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_day">{t('purchaseEmi.monthlyPaymentDay')}</Label>
                  <Input
                    id="payment_day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1"
                    {...register('payment_day', { valueAsNumber: true })}
                    className={errors.payment_day ? 'border-red-500' : ''}
                  />
                  {errors.payment_day && (
                    <p className="text-sm text-red-500">{errors.payment_day.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {tCommon('financialDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principal_amount">{t('purchaseEmi.totalPurchaseAmount')} ({currency})</Label>
                  <Input
                    id="principal_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('principal_amount', { valueAsNumber: true })}
                    className={errors.principal_amount ? 'border-red-500' : ''}
                  />
                  {errors.principal_amount && (
                    <p className="text-sm text-red-500">{errors.principal_amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest_rate">{tCommon('interestRate')} (% {t('common.perAnnum') || 'per annum'})</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    placeholder="12.00"
                    {...register('interest_rate', { valueAsNumber: true })}
                    className={errors.interest_rate ? 'border-red-500' : ''}
                  />
                  {errors.interest_rate && (
                    <p className="text-sm text-red-500">{errors.interest_rate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenure_months">{t('purchaseEmi.emiTenureMonths')}</Label>
                  <Input
                    id="tenure_months"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="12"
                    {...register('tenure_months', { valueAsNumber: true })}
                    className={errors.tenure_months ? 'border-red-500' : ''}
                  />
                  {errors.tenure_months && (
                    <p className="text-sm text-red-500">{errors.tenure_months.message}</p>
                  )}
                </div>
              </div>

              {/* EMI Calculation Preview */}
              {principalAmount > 0 && emiCalculation.emi > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                >
                  <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">{t('purchaseEmi.emiCalculation')}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-purple-600 dark:text-purple-400 mb-1">
                        <CreditCard className="h-3 w-3" />
                        {tCommon('monthlyEmi')}
                      </div>
                      <div className="font-bold text-purple-900 dark:text-purple-200">
                        {formatAmount(emiCalculation.emi)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-purple-600 dark:text-purple-400 mb-1">
                        <Percent className="h-3 w-3" />
                        {t('purchaseEmi.totalInterest')}
                      </div>
                      <div className="font-bold text-purple-900 dark:text-purple-200">
                        {formatAmount(emiCalculation.totalInterest)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-purple-600 dark:text-purple-400 mb-1">
                        <Calendar className="h-3 w-3" />
                        {t('purchaseEmi.totalAmount')}
                      </div>
                      <div className="font-bold text-purple-900 dark:text-purple-200">
                        {formatAmount(emiCalculation.totalAmount)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Account & Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{tCommon('accountCategory')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_id">{t('purchaseEmi.accountOptional')}</Label>
                  <Select 
                    value={watch('account_id') || 'none'} 
                    onValueChange={(value) => setValue('account_id', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={accountsLoading ? `${tCommon('loading')}...` : `${tCommon('selectAccount') || 'Select account'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.noAccount') || 'No Account'}</SelectItem>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{account.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{account.type}</span>
                              <span className="text-xs font-medium">{formatAmount(account.balance)}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_selection">{t('purchaseEmi.categoryOptional')}</Label>
                  <Select 
                    value={watch('category_selection') || 'none'} 
                    onValueChange={(value) => setValue('category_selection', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categoriesLoading ? `${tCommon('loading')}...` : `${tCommon('selectCategorySubcategory') || 'Select category or subcategory'}`} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      <SelectItem value="none">{t('common.noCategory') || 'No Category'}</SelectItem>
                      {dropdownOptions?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            {option.icon && (
                              <div className="flex-shrink-0">
                                {renderIcon(option.icon, { 
                                  size: 16, 
                                  className: "text-muted-foreground",
                                  style: { color: option.color || undefined }
                                })}
                              </div>
                            )}
                            <span className={option.level > 0 ? 'ml-2 text-sm text-muted-foreground' : 'font-medium'}>
                              {option.displayLabel}
                            </span>
                            {option.parent && option.level > 0 && (
                              <span className="text-xs text-muted-foreground">in {option.parent}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('common.chooseCategoryHelp') || 'Choose a main category or specific subcategory for better organization'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminder_days">{t('purchaseEmi.reminderDaysBeforeDue')}</Label>
                  <Input
                    id="reminder_days"
                    type="number"
                    min="1"
                    max="30"
                    placeholder="3"
                    {...register('reminder_days', { valueAsNumber: true })}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="auto_debit"
                    {...register('auto_debit')}
                    className="rounded border-border"
                  />
                  <Label htmlFor="auto_debit">{t('purchaseEmi.enableAutoDebit')}</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{tCommon('additionalNotes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('purchaseEmi.notesOptional')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('purchaseEmi.form.notesPlaceholder') || 'Add any additional information about this purchase EMI...'}
                  {...register('notes')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || principalAmount <= 0}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('purchaseEmi.saving')}</span>
                </div>
              ) : (
                emi ? t('purchaseEmi.updatePurchaseEmi') : t('purchaseEmi.createPurchaseEmi')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}