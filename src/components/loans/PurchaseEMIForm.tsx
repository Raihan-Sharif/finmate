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
import { Separator } from '@/components/ui/separator'
import { 
  ShoppingCart, 
  Calculator, 
  Store, 
  Package,
  CreditCard,
  Calendar,
  Percent,
  DollarSign
} from 'lucide-react'
import { 
  PURCHASE_EMI_CATEGORIES, 
  PurchaseEMICategory, 
  PurchaseEMI 
} from '@/types/emi'
import { useAppStore } from '@/lib/stores/useAppStore'

const purchaseEMISchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  vendor_name: z.string().min(1, 'Vendor name is required'),
  purchase_category: z.enum(['electronics', 'furniture', 'appliances', 'jewelry', 'gadgets', 'clothing', 'sports', 'travel', 'other']),
  principal_amount: z.number().min(1, 'Purchase amount must be greater than 0'),
  down_payment: z.number().min(0, 'Down payment cannot be negative').optional(),
  interest_rate: z.number().min(0, 'Interest rate must be 0 or greater').max(50, 'Interest rate cannot exceed 50%'),
  tenure_months: z.number().min(1, 'Tenure must be at least 1 month').max(120, 'Tenure cannot exceed 120 months'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  item_condition: z.enum(['new', 'refurbished', 'used']),
  warranty_period: z.number().min(0, 'Warranty period cannot be negative').max(120, 'Warranty period cannot exceed 120 months').optional(),
  payment_day: z.number().min(1, 'Payment day must be between 1-31').max(31, 'Payment day must be between 1-31').optional(),
  notes: z.string().optional(),
})

type PurchaseEMIFormSchema = z.infer<typeof purchaseEMISchema>

interface PurchaseEMIFormData {
  item_name: string
  vendor_name: string
  purchase_category: PurchaseEMICategory
  principal_amount: number
  down_payment?: number | undefined
  interest_rate: number
  tenure_months: number
  purchase_date: string
  item_condition: 'new' | 'refurbished' | 'used'
  warranty_period?: number | undefined
  payment_day?: number | undefined
  notes?: string | undefined
}

interface PurchaseEMIFormProps {
  purchaseEMI?: PurchaseEMI | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PurchaseEMIFormData) => Promise<void>
  isLoading?: boolean
}

export default function PurchaseEMIForm({ 
  purchaseEMI, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: PurchaseEMIFormProps) {
  const { formatAmount, currency } = useAppStore()
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
      item_name: purchaseEMI?.metadata?.item_name || '',
      vendor_name: purchaseEMI?.lender || '',
      purchase_category: (purchaseEMI?.metadata?.purchase_category as PurchaseEMICategory) || 'electronics',
      principal_amount: purchaseEMI?.principal_amount || 0,
      down_payment: purchaseEMI?.metadata?.down_payment,
      interest_rate: purchaseEMI?.interest_rate || 12,
      tenure_months: purchaseEMI?.tenure_months || 12,
      purchase_date: purchaseEMI?.metadata?.purchase_date || purchaseEMI?.start_date || new Date().toISOString().split('T')[0],
      item_condition: (purchaseEMI?.metadata?.item_condition as any) || 'new',
      warranty_period: purchaseEMI?.metadata?.warranty_period,
      payment_day: purchaseEMI?.payment_day,
      notes: purchaseEMI?.notes || undefined,
    }
  })

  const watchedValues = watch(['principal_amount', 'interest_rate', 'tenure_months', 'down_payment'])
  const [principalAmount, interestRate, tenureMonths, downPayment] = watchedValues

  // Calculate EMI whenever values change
  useEffect(() => {
    if (principalAmount > 0 && interestRate >= 0 && tenureMonths > 0) {
      const loanAmount = principalAmount - (downPayment || 0)
      
      if (loanAmount <= 0) {
        setEmiCalculation({ emi: 0, totalAmount: 0, totalInterest: 0 })
        return
      }

      let emi: number
      if (interestRate === 0) {
        emi = loanAmount / tenureMonths
      } else {
        const monthlyRate = interestRate / 12 / 100
        emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
              (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      }

      const totalAmount = emi * tenureMonths
      const totalInterest = totalAmount - loanAmount

      setEmiCalculation({
        emi: Math.round(emi * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100
      })
    }
  }, [principalAmount, interestRate, tenureMonths, downPayment])

  const handleFormSubmit = async (data: PurchaseEMIFormSchema) => {
    try {
      await onSubmit({
        item_name: data.item_name,
        vendor_name: data.vendor_name,
        purchase_category: data.purchase_category,
        principal_amount: Number(data.principal_amount),
        down_payment: data.down_payment !== undefined ? Number(data.down_payment) : undefined,
        interest_rate: Number(data.interest_rate),
        tenure_months: Number(data.tenure_months),
        purchase_date: data.purchase_date,
        item_condition: data.item_condition,
        warranty_period: data.warranty_period !== undefined ? Number(data.warranty_period) : undefined,
        payment_day: data.payment_day !== undefined ? Number(data.payment_day) : undefined,
        notes: data.notes || undefined,
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

  const selectedCategory = watch('purchase_category')
  const categoryInfo = PURCHASE_EMI_CATEGORIES.find(cat => cat.value === selectedCategory)
  const loanAmount = (principalAmount || 0) - (downPayment || 0)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {purchaseEMI ? 'Edit Purchase EMI' : 'Add Purchase EMI'}
          </DialogTitle>
          <DialogDescription>
            {purchaseEMI 
              ? 'Update purchase EMI information' 
              : 'Set up EMI for your purchase with automatic payment tracking'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-6">
          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-4 w-4" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item_name">Item Name</Label>
                  <Input
                    id="item_name"
                    placeholder="e.g., iPhone 15 Pro, Samsung TV, MacBook"
                    {...register('item_name')}
                    className={errors.item_name ? 'border-red-500' : ''}
                  />
                  {errors.item_name && (
                    <p className="text-sm text-red-500">{errors.item_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor_name">Vendor/Store Name</Label>
                  <Input
                    id="vendor_name"
                    placeholder="e.g., Apple Store, Best Buy, Amazon"
                    {...register('vendor_name')}
                    className={errors.vendor_name ? 'border-red-500' : ''}
                  />
                  {errors.vendor_name && (
                    <p className="text-sm text-red-500">{errors.vendor_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_category">Category</Label>
                  <Select onValueChange={(value) => setValue('purchase_category', value as PurchaseEMICategory)}>
                    <SelectTrigger className={errors.purchase_category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PURCHASE_EMI_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.purchase_category && (
                    <p className="text-sm text-red-500">{errors.purchase_category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item_condition">Item Condition</Label>
                  <Select onValueChange={(value) => setValue('item_condition', value as any)}>
                    <SelectTrigger className={errors.item_condition ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">🆕 New</SelectItem>
                      <SelectItem value="refurbished">🔄 Refurbished</SelectItem>
                      <SelectItem value="used">📦 Used</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.item_condition && (
                    <p className="text-sm text-red-500">{errors.item_condition.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty_period">Warranty (Months)</Label>
                  <Input
                    id="warranty_period"
                    type="number"
                    min="0"
                    max="120"
                    placeholder="12"
                    {...register('warranty_period', { valueAsNumber: true })}
                    className={errors.warranty_period ? 'border-red-500' : ''}
                  />
                  {errors.warranty_period && (
                    <p className="text-sm text-red-500">{errors.warranty_period.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    {...register('purchase_date')}
                    className={errors.purchase_date ? 'border-red-500' : ''}
                  />
                  {errors.purchase_date && (
                    <p className="text-sm text-red-500">{errors.purchase_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_day">Monthly Payment Day</Label>
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

              {/* Category Badge */}
              {categoryInfo && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {categoryInfo.icon} {categoryInfo.label}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principal_amount">Total Purchase Amount ({currency})</Label>
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
                  <Label htmlFor="down_payment">Down Payment ({currency}) - Optional</Label>
                  <Input
                    id="down_payment"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('down_payment', { valueAsNumber: true })}
                    className={errors.down_payment ? 'border-red-500' : ''}
                  />
                  {errors.down_payment && (
                    <p className="text-sm text-red-500">{errors.down_payment.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interest_rate">Interest Rate (% per annum)</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="tenure_months">EMI Tenure (Months)</Label>
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
              {loanAmount > 0 && emiCalculation.emi > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                >
                  <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">EMI Calculation</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-purple-600 dark:text-purple-400 mb-1">
                        <DollarSign className="h-3 w-3" />
                        Loan Amount
                      </div>
                      <div className="font-bold text-purple-900 dark:text-purple-200">
                        {formatAmount(loanAmount)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-purple-600 dark:text-purple-400 mb-1">
                        <CreditCard className="h-3 w-3" />
                        Monthly EMI
                      </div>
                      <div className="font-bold text-purple-900 dark:text-purple-200">
                        {formatAmount(emiCalculation.emi)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-purple-600 dark:text-purple-400 mb-1">
                        <Percent className="h-3 w-3" />
                        Total Interest
                      </div>
                      <div className="font-bold text-purple-900 dark:text-purple-200">
                        {formatAmount(emiCalculation.totalInterest)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-purple-600 dark:text-purple-400 mb-1">
                        <Calendar className="h-3 w-3" />
                        Total Amount
                      </div>
                      <div className="font-bold text-purple-900 dark:text-purple-200">
                        {formatAmount(emiCalculation.totalAmount + (downPayment || 0))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional information about this purchase EMI..."
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
              disabled={isLoading || loanAmount <= 0}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                purchaseEMI ? 'Update Purchase EMI' : 'Create Purchase EMI'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}