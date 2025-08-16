'use client'

import { useState } from 'react'
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
import { Calculator, Calendar, DollarSign, X } from 'lucide-react'
import { LOAN_TYPES, LoanFormData, Loan } from '@/types/emi'
import { useAppStore } from '@/lib/stores/useAppStore'

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
    defaultValues: loan ? {
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
    } : {
      payment_day: 1,
      auto_debit: false,
      reminder_days: 3,
    }
  })

  // Watch form values for EMI calculation
  const principal = watch('principal_amount')
  const rate = watch('interest_rate')
  const tenure = watch('tenure_months')

  // Calculate EMI when values change
  const calculateEMI = () => {
    if (principal > 0 && rate >= 0 && tenure > 0) {
      if (rate === 0) {
        setCalculatedEMI(principal / tenure)
      } else {
        const monthlyRate = rate / 12 / 100
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
                   (Math.pow(1 + monthlyRate, tenure) - 1)
        setCalculatedEMI(emi)
      }
    } else {
      setCalculatedEMI(null)
    }
  }

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
                  <Input
                    id="lender"
                    placeholder="e.g., HDFC Bank, ICICI Bank"
                    {...register('lender')}
                    className={errors.lender ? 'border-red-500' : ''}
                  />
                  {errors.lender && (
                    <p className="text-sm text-red-500">{errors.lender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Loan Type</Label>
                  <Select onValueChange={(value) => setValue('type', value as any)}>
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
                    onChange={(e) => {
                      register('principal_amount').onChange(e)
                      setTimeout(calculateEMI, 100)
                    }}
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
                    onChange={(e) => {
                      register('interest_rate').onChange(e)
                      setTimeout(calculateEMI, 100)
                    }}
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
                    onChange={(e) => {
                      register('tenure_months').onChange(e)
                      setTimeout(calculateEMI, 100)
                    }}
                  />
                  {errors.tenure_months && (
                    <p className="text-sm text-red-500">{errors.tenure_months.message}</p>
                  )}
                </div>
              </div>

              {/* EMI Preview */}
              {calculatedEMI && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Calculator className="h-4 w-4" />
                    <span className="font-medium">Calculated EMI: {formatAmount(calculatedEMI)}</span>
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
                  {...register('auto_debit')}
                />
                <Label htmlFor="auto_debit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Enable Auto Debit
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