'use client'

import React, { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Calculator, Calendar, DollarSign, X, Building, Percent, TrendingUp, Info, AlertTriangle } from 'lucide-react'
import { LOAN_TYPES, LoanFormData, Loan } from '@/types/emi'
import { useAppStore } from '@/lib/stores/useAppStore'
import { BANKS_BY_CURRENCY, getBanksByCategory, getBankCategories } from '@/lib/data/banks'
import { calculateEMIDetails } from '@/lib/services/emi'

const loanSchema = z.object({
  lender: z.string().min(1, 'Lender name is required'),
  principal_amount: z.number().min(1, 'Principal amount must be greater than 0'),
  interest_rate: z.number().min(0, 'Interest rate must be 0 or greater').max(100, 'Interest rate cannot exceed 100%'),
  tenure_months: z.number().min(1, 'Tenure must be at least 1 month').max(480, 'Tenure cannot exceed 40 years'),
  start_date: z.string().min(1, 'Start date is required'),
  payment_day: z.number().min(1, 'Payment day must be between 1-31').max(31, 'Payment day must be between 1-31').optional(),
  type: z.enum(['personal', 'home', 'car', 'education', 'business', 'purchase_emi', 'credit_card', 'other']),
  auto_debit: z.boolean().optional(),
  reminder_days: z.number().min(0, 'Reminder days must be 0 or greater').max(30, 'Reminder days cannot exceed 30').optional(),
  notes: z.string().optional(),
})

type LoanFormSchema = z.infer<typeof loanSchema>

interface LoanFormProps {
  loan?: Loan | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LoanFormData) => Promise<void>
  isLoading?: boolean
}

export default function LoanForm({ loan, isOpen, onClose, onSubmit, isLoading }: LoanFormProps) {
  const [calculatedEMI, setCalculatedEMI] = useState<number | null>(null)
  const [emiDetails, setEmiDetails] = useState<any>(null)
  const [selectedBankType, setSelectedBankType] = useState<'predefined' | 'custom'>('predefined')
  const [customBankName, setCustomBankName] = useState('')
  const { formatAmount, currency } = useAppStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<LoanFormSchema>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      payment_day: 1,
      auto_debit: false,
      reminder_days: 3,
    }
  })

  // Reset form when loan changes (for edit mode)
  React.useEffect(() => {
    if (loan) {
      reset({
        lender: loan.lender,
        principal_amount: loan.principal_amount,
        interest_rate: loan.interest_rate,
        tenure_months: loan.tenure_months,
        start_date: loan.start_date,
        payment_day: loan.payment_day || 1,
        type: loan.type,
        auto_debit: loan.auto_debit || false,
        reminder_days: loan.reminder_days || 3,
        notes: loan.notes || '',
      })
      // Update bank selection type based on whether we can find the bank in our list
      const bankExists = BANKS_BY_CURRENCY[currency as keyof typeof BANKS_BY_CURRENCY]?.some(
        bank => bank.label === loan.lender
      )
      setSelectedBankType(bankExists ? 'predefined' : 'custom')
      
      // If custom bank, set the custom bank name
      if (!bankExists) {
        setCustomBankName(loan.lender)
      }
    } else {
      reset({
        payment_day: 1,
        auto_debit: false,
        reminder_days: 3,
      })
      setSelectedBankType('predefined')
      setCustomBankName('')
    }
  }, [loan, reset, currency])

  // Watch form values for EMI calculation
  const principal = watch('principal_amount')
  const rate = watch('interest_rate')
  const tenure = watch('tenure_months')

  // Calculate EMI when values change
  const calculateEMI = () => {
    if (principal > 0 && rate >= 0 && tenure > 0) {
      try {
        // Convert to numbers to ensure proper calculation
        const principalNum = Number(principal)
        const rateNum = Number(rate)
        const tenureNum = Number(tenure)
        
        console.log('EMI Calculation inputs:', { principalNum, rateNum, tenureNum })
        
        const details = calculateEMIDetails({
          principal: principalNum,
          interestRate: rateNum,
          tenureMonths: tenureNum
        })
        
        console.log('EMI Calculation result:', details)
        
        setCalculatedEMI(details.emi)
        setEmiDetails(details)
      } catch (error) {
        console.error('EMI calculation error:', error)
        setCalculatedEMI(null)
        setEmiDetails(null)
      }
    } else {
      setCalculatedEMI(null)
      setEmiDetails(null)
    }
  }

  // Auto-calculate when inputs change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      calculateEMI()
    }, 300)
    return () => clearTimeout(timer)
  }, [principal, rate, tenure])

  const handleFormSubmit = async (data: LoanFormSchema) => {
    try {
      await onSubmit({
        ...data,
        principal_amount: Number(data.principal_amount),
        interest_rate: Number(data.interest_rate),
        tenure_months: Number(data.tenure_months),
        payment_day: data.payment_day || 1,
        auto_debit: data.auto_debit || false,
        reminder_days: data.reminder_days || 3,
        notes: data.notes || undefined,
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error submitting loan form:', error)
    }
  }

  const handleClose = () => {
    reset()
    setCalculatedEMI(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {loan ? 'Edit Loan' : 'Add New Loan'}
          </DialogTitle>
          <DialogDescription>
            {loan ? 'Update loan information' : 'Add a new bank or institutional loan to track EMI payments'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lender">Lender / Bank Name</Label>
                  
                  {/* Bank Selection Toggle */}
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="predefined-bank"
                        checked={selectedBankType === 'predefined'}
                        onChange={() => setSelectedBankType('predefined')}
                        className="text-primary"
                      />
                      <Label htmlFor="predefined-bank" className="text-sm">Select Bank</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="custom-bank"
                        checked={selectedBankType === 'custom'}
                        onChange={() => setSelectedBankType('custom')}
                        className="text-primary"
                      />
                      <Label htmlFor="custom-bank" className="text-sm">Custom Name</Label>
                    </div>
                  </div>

                  {/* Bank Dropdown for supported currencies */}
                  {selectedBankType === 'predefined' && BANKS_BY_CURRENCY[currency as keyof typeof BANKS_BY_CURRENCY] && (
                    <Select 
                      value={BANKS_BY_CURRENCY[currency as keyof typeof BANKS_BY_CURRENCY]?.find(bank => bank.label === watch('lender'))?.value || ''}
                      onValueChange={(value) => {
                        const selectedBank = BANKS_BY_CURRENCY[currency as keyof typeof BANKS_BY_CURRENCY]?.find(bank => bank.value === value)
                        if (selectedBank) {
                          setValue('lender', selectedBank.label)
                        } else if (value === 'other') {
                          setSelectedBankType('custom')
                          setValue('lender', '')
                        }
                      }}
                    >
                      <SelectTrigger className={errors.lender ? 'border-red-500' : ''}>
                        <SelectValue placeholder={`Select ${currency} bank`} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {getBankCategories(currency).map((category) => (
                          <div key={category.value}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                              {category.label}
                            </div>
                            {getBanksByCategory(currency, category.value).map((bank) => (
                              <SelectItem key={bank.value} value={bank.value}>
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  <span>{bank.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                          Other
                        </div>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span>Other Bank</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Custom bank name input */}
                  {(selectedBankType === 'custom' || !BANKS_BY_CURRENCY[currency as keyof typeof BANKS_BY_CURRENCY]) && (
                    <Input
                      id="lender"
                      placeholder="Enter bank/lender name"
                      {...register('lender')}
                      className={errors.lender ? 'border-red-500' : ''}
                    />
                  )}
                  
                  {errors.lender && (
                    <p className="text-sm text-red-500">{errors.lender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Loan Type</Label>
                  <Select 
                    value={watch('type')} 
                    onValueChange={(value) => setValue('type', value as any)}
                  >
                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOAN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principal_amount">Principal Amount ({currency})</Label>
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
                  <Label htmlFor="interest_rate">Interest Rate (%)</Label>
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
                  <Label htmlFor="tenure_months">Tenure (Months)</Label>
                  <Input
                    id="tenure_months"
                    type="number"
                    placeholder="12"
                    {...register('tenure_months', { valueAsNumber: true })}
                    className={errors.tenure_months ? 'border-red-500' : ''}
                  />
                  {errors.tenure_months && (
                    <p className="text-sm text-red-500">{errors.tenure_months.message}</p>
                  )}
                  {/* Tenure suggestions */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[12, 24, 36, 60, 120].map(months => (
                      <button
                        key={months}
                        type="button"
                        onClick={() => setValue('tenure_months', months)}
                        className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {months}m ({Math.round(months/12)}y)
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced EMI Preview */}
              {emiDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Validation Warnings */}
                  {(tenure && tenure < 6) && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Very Short Tenure</span>
                      </div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        A {tenure}-month loan will have very high monthly payments. Consider a longer tenure if this seems too high.
                      </div>
                    </div>
                  )}
                  
                  {(rate && rate > 30) && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Very High Interest Rate</span>
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-400 mt-1">
                        {rate}% annual interest rate is unusually high. Please verify this is correct.
                      </div>
                    </div>
                  )}
                  
                  {(emiDetails.emi > principal * 0.4) && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">High EMI Amount</span>
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                        Monthly EMI is {((emiDetails.emi / principal) * 100).toFixed(1)}% of loan amount. This suggests very short tenure or high interest rate.
                      </div>
                    </div>
                  )}
                  {/* Main EMI Display */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Calculator className="h-5 w-5" />
                        <span className="font-bold text-lg">Monthly EMI</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatAmount(emiDetails.emi)}
                      </div>
                    </div>
                    
                    {/* EMI Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground">Total Amount</span>
                        </div>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatAmount(emiDetails.totalAmount)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-orange-600" />
                          <span className="text-muted-foreground">Total Interest</span>
                        </div>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {formatAmount(emiDetails.totalInterest)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-muted-foreground">Interest %</span>
                        </div>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                          {emiDetails.interestPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                      <Info className="h-4 w-4 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Loan Summary</p>
                        <p>
                          You'll pay <strong>{formatAmount(emiDetails.emi)}</strong> monthly for{' '}
                          <strong>{tenure} months</strong> ({Math.round(tenure/12)} year{tenure !== 12 ? 's' : ''}), with total interest of{' '}
                          <strong>{formatAmount(emiDetails.totalInterest)}</strong>.
                        </p>
                        <p className="text-xs mt-1 opacity-75">
                          Total repayment: {formatAmount(emiDetails.totalAmount)} | 
                          Interest rate: {emiDetails.interestPercentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Loan Start Date</Label>
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
                  <Label htmlFor="payment_day">Payment Day of Month</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="reminder_days">Reminder Days Before Due</Label>
                  <Input
                    id="reminder_days"
                    type="number"
                    min="0"
                    max="30"
                    placeholder="3"
                    {...register('reminder_days', { valueAsNumber: true })}
                    className={errors.reminder_days ? 'border-red-500' : ''}
                  />
                  {errors.reminder_days && (
                    <p className="text-sm text-red-500">{errors.reminder_days.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto_debit"
                  checked={watch('auto_debit') || false}
                  onCheckedChange={(checked) => setValue('auto_debit', checked === true)}
                />
                <Label htmlFor="auto_debit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Enable Auto Debit
                  <span className="text-xs text-muted-foreground ml-2">
                    (Automatically create expense transactions on due dates)
                  </span>
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this loan..."
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                loan ? 'Update Loan' : 'Add Loan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}