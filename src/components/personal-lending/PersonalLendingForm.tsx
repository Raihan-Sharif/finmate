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
  Users,
  Calculator, 
  User,
  HandHeart,
  Banknote,
  Calendar,
  Percent,
  DollarSign,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { renderIcon } from '@/lib/utils/iconMapping'
import { useTranslations } from 'next-intl'

const personalLendingSchema = z.object({
  person_name: z.string().min(1, 'Person name is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  type: z.enum(['lent', 'borrowed']),
  interest_rate: z.number().min(0, 'Interest rate must be 0 or greater').max(100, 'Interest rate cannot exceed 100%').optional(),
  date: z.string().min(1, 'Date is required'),
  due_date: z.string().optional(),
  account_id: z.string().optional(),
  category_selection: z.string().optional(), // This will contain either category_id or subcategory_id
  auto_debit: z.boolean().optional(),
  reminder_days: z.number().min(1).max(365).optional(),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
})

type PersonalLendingFormSchema = z.infer<typeof personalLendingSchema>

interface PersonalLendingFormProps {
  lending?: any | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export default function PersonalLendingForm({ 
  lending, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: PersonalLendingFormProps) {
  const { formatAmount, currency } = useAppStore()
  const { accounts, loading: accountsLoading } = useAccounts()
  const { categories, isLoading: categoriesLoading, categoryOptions, dropdownOptions } = useCategories()
  const [selectedType, setSelectedType] = useState<'lent' | 'borrowed'>('lent')
  const t = useTranslations('credit')
  const tCommon = useTranslations('common')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<PersonalLendingFormSchema>({
    resolver: zodResolver(personalLendingSchema),
    defaultValues: {
      person_name: lending?.person_name || '',
      amount: lending?.amount || 0,
      type: lending?.type || 'lent',
      interest_rate: lending?.interest_rate || 0,
      date: lending?.date || new Date().toISOString().split('T')[0],
      due_date: lending?.due_date || '',
      account_id: lending?.account_id || '',
      category_selection: lending?.subcategory_id ? `subcategory_${lending.subcategory_id}` : lending?.category_id ? `category_${lending.category_id}` : '',
      auto_debit: lending?.auto_debit || false,
      reminder_days: lending?.reminder_days || 7,
      contact_info: {
        phone: lending?.contact_info?.phone || '',
        email: lending?.contact_info?.email || '',
        address: lending?.contact_info?.address || '',
      },
      notes: lending?.notes || '',
    }
  })

  // Update form values when lending prop changes (for edit mode)
  useEffect(() => {
    if (lending) {
      setValue('person_name', lending.person_name || '')
      setValue('amount', lending.amount || 0)
      setValue('type', lending.type || 'lent')
      setValue('interest_rate', lending.interest_rate || 0)
      setValue('date', lending.date || new Date().toISOString().split('T')[0])
      setValue('due_date', lending.due_date || '')
      setValue('account_id', lending.account_id || '')
      setValue('category_selection', lending.subcategory_id ? `subcategory_${lending.subcategory_id}` : lending.category_id ? `category_${lending.category_id}` : '')
      setValue('auto_debit', lending.auto_debit || false)
      setValue('reminder_days', lending.reminder_days || 7)
      setValue('contact_info.phone', lending.contact_info?.phone || '')
      setValue('contact_info.email', lending.contact_info?.email || '')
      setValue('contact_info.address', lending.contact_info?.address || '')
      setValue('notes', lending.notes || '')
      setSelectedType(lending.type || 'lent')
    }
  }, [lending, setValue])

  const watchedType = watch('type')
  
  useEffect(() => {
    setSelectedType(watchedType)
  }, [watchedType])

  const calculateInterestAmount = () => {
    const amount = watch('amount')
    const interestRate = watch('interest_rate')
    const date = watch('date')
    const dueDate = watch('due_date')
    
    if (!amount || !interestRate || !date || !dueDate) return 0
    
    const startDate = new Date(date)
    const endDate = new Date(dueDate)
    const days = Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    return (amount * interestRate * days) / (365 * 100)
  }

  const handleFormSubmit = async (data: PersonalLendingFormSchema) => {
    try {
      const contactInfo = (data.contact_info?.phone || data.contact_info?.email || data.contact_info?.address) 
        ? data.contact_info 
        : null

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
        person_name: data.person_name,
        amount: Number(data.amount),
        type: data.type,
        interest_rate: data.interest_rate ? Number(data.interest_rate) : 0,
        date: data.date,
        due_date: data.due_date || null,
        account_id: data.account_id || null,
        category_id,
        subcategory_id,
        auto_debit: data.auto_debit || false,
        reminder_days: data.reminder_days ? Number(data.reminder_days) : 7,
        contact_info: contactInfo,
        notes: data.notes || null,
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error submitting personal lending form:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const interestAmount = calculateInterestAmount()
  const totalAmount = (watch('amount') || 0) + interestAmount

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {lending ? t('personalLending.editPersonalLending') : t('personalLending.addPersonalLendingBorrowing')}
          </DialogTitle>
          <DialogDescription>
            {lending 
              ? t('personalLending.updatePersonalLending')
              : t('personalLending.trackMoneyFriendsFamily')
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                {tCommon('transactionType')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedType === 'lent' 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-border hover:border-emerald-300'
                  }`}
                  onClick={() => {
                    setValue('type', 'lent')
                    setSelectedType('lent')
                  }}
                >
                  <div className="flex items-center gap-3">
                    <HandHeart className="h-6 w-6 text-emerald-600" />
                    <div>
                      <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">{t('personalLending.moneyLent')}</h3>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('personalLending.youGaveMoneyToSomeone')}</p>
                    </div>
                  </div>
                </div>
                
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedType === 'borrowed' 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                      : 'border-border hover:border-orange-300'
                  }`}
                  onClick={() => {
                    setValue('type', 'borrowed')
                    setSelectedType('borrowed')
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Banknote className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-orange-900 dark:text-orange-200">{t('personalLending.moneyBorrowed')}</h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">{t('personalLending.youReceivedMoneyFromSomeone')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Person & Amount Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                {tCommon('personAmountDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="person_name">{t('personalLending.personName')}</Label>
                  <Input
                    id="person_name"
                    placeholder={t('personalLending.form.personNamePlaceholder') || 'e.g., John Doe, Sarah Smith'}
                    {...register('person_name')}
                    className={errors.person_name ? 'border-red-500' : ''}
                  />
                  {errors.person_name && (
                    <p className="text-sm text-red-500">{errors.person_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">{t('common.amount')} ({currency})</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount', { valueAsNumber: true })}
                    className={errors.amount ? 'border-red-500' : ''}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interest_rate">{t('personalLending.interestRatePerYear')}</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('interest_rate', { valueAsNumber: true })}
                    className={errors.interest_rate ? 'border-red-500' : ''}
                  />
                  {errors.interest_rate && (
                    <p className="text-sm text-red-500">{errors.interest_rate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">{selectedType === 'lent' ? t('personalLending.lentDate') : t('personalLending.borrowedDate')}</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                    className={errors.date ? 'border-red-500' : ''}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-500">{errors.date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">{t('personalLending.dueDateOptional')}</Label>
                  <Input
                    id="due_date"
                    type="date"
                    {...register('due_date')}
                  />
                </div>
              </div>

              {/* Interest Calculation */}
              {interestAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">{t('personalLending.interestCalculation')}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-blue-600 dark:text-blue-400 mb-1">
                        <DollarSign className="h-3 w-3" />
                        {t('personalLending.principal')}
                      </div>
                      <div className="font-bold text-blue-900 dark:text-blue-200">
                        {formatAmount(watch('amount') || 0)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-blue-600 dark:text-blue-400 mb-1">
                        <Percent className="h-3 w-3" />
                        {t('personalLending.interest')}
                      </div>
                      <div className="font-bold text-blue-900 dark:text-blue-200">
                        {formatAmount(interestAmount)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-blue-600 dark:text-blue-400 mb-1">
                        <Calculator className="h-3 w-3" />
                        {t('personalLending.total')}
                      </div>
                      <div className="font-bold text-blue-900 dark:text-blue-200">
                        {formatAmount(totalAmount)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {tCommon('contactInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">{t('personalLending.phoneNumber')}</Label>
                  <Input
                    id="contact_phone"
                    placeholder="+1 (555) 123-4567"
                    {...register('contact_info.phone')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">{t('personalLending.emailAddress')}</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="john.doe@email.com"
                    {...register('contact_info.email')}
                    className={errors.contact_info?.email ? 'border-red-500' : ''}
                  />
                  {errors.contact_info?.email && (
                    <p className="text-sm text-red-500">{errors.contact_info.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_address">{t('personalLending.address')}</Label>
                <Textarea
                  id="contact_address"
                  placeholder="123 Main St, City, State, ZIP"
                  {...register('contact_info.address')}
                  rows={2}
                />
              </div>
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
                  <Label htmlFor="account_id">{t('personalLending.accountOptional')}</Label>
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
                  <Label htmlFor="category_selection">{t('personalLending.categoryOptional')}</Label>
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
                  <Label htmlFor="reminder_days">{t('personalLending.reminderDaysBeforeDueDate')}</Label>
                  <Input
                    id="reminder_days"
                    type="number"
                    min="1"
                    max="365"
                    placeholder="7"
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
                  <Label htmlFor="auto_debit" className="text-sm">
                    {t('personalLending.enableAutoProcessing')}
                  </Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('personalLending.autoProcessingDescription')}
              </p>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{tCommon('additionalNotes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('personalLending.notesOptional')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('personalLending.form.notesPlaceholder') || 'Add any additional information about this lending/borrowing...'}
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
              disabled={isLoading}
              className={`bg-gradient-to-r ${
                selectedType === 'lent' 
                  ? 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700' 
                  : 'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('personalLending.saving')}</span>
                </div>
              ) : (
                lending ? t('personalLending.updateRecord') : (selectedType === 'lent' ? t('personalLending.addLendingRecord') : t('personalLending.addBorrowingRecord'))
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}