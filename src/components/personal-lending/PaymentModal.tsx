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
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign,
  Calculator,
  CreditCard,
  Banknote,
  Wallet,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { useAppStore } from '@/lib/stores/useAppStore'
import { useAccounts } from '@/hooks/useAccounts'
import { useTranslations } from 'next-intl'

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  account_id: z.string().optional(),
  notes: z.string().optional(),
})

type PaymentFormSchema = z.infer<typeof paymentSchema>

interface PaymentModalProps {
  lending?: any | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}


export default function PaymentModal({ 
  lending, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: PaymentModalProps) {
  const { formatAmount, currency } = useAppStore()
  const { accounts, loading: accountsLoading } = useAccounts()
  const t = useTranslations()
  const tCommon = useTranslations('common')
  const [paymentType, setPaymentType] = useState<'repayment_received' | 'repayment_made'>('repayment_received')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<PaymentFormSchema>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0] || '',
      account_id: '',
      notes: '',
    }
  })

  const watchedAmount = watch('amount')

  useEffect(() => {
    if (lending) {
      // Determine payment type based on lending type
      if (lending.type === 'lent') {
        setPaymentType('repayment_received') // You're receiving money back
      } else {
        setPaymentType('repayment_made') // You're paying back money
      }
    }
  }, [lending])

  if (!lending) return null

  const remainingAmount = lending.pending_amount
  const originalAmount = lending.amount
  const paidAmount = originalAmount - remainingAmount
  const progressPercentage = ((originalAmount - remainingAmount) / originalAmount) * 100
  
  const newPaidAmount = paidAmount + (watchedAmount || 0)
  const newRemainingAmount = Math.max(0, originalAmount - newPaidAmount)
  const newProgressPercentage = (newPaidAmount / originalAmount) * 100

  const isFullPayment = watchedAmount >= remainingAmount
  const isPartialPayment = watchedAmount > 0 && watchedAmount < remainingAmount
  const isOverPayment = watchedAmount > remainingAmount

  const handleFormSubmit = async (data: PaymentFormSchema) => {
    try {
      await onSubmit({
        amount: Number(data.amount),
        payment_date: data.payment_date,
        account_id: data.account_id || null,
        notes: data.notes || null,
        transaction_type: paymentType,
      })
      reset()
      onClose()
    } catch (error) {
      console.error('Error submitting payment:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const getPaymentIcon = () => {
    if (lending.type === 'lent') {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else {
      return <DollarSign className="h-5 w-5 text-orange-600" />
    }
  }

  const getPaymentTitle = () => {
    if (lending.type === 'lent') {
      return t('personalLending.paymentModal.receivePaymentFrom', { name: lending.person_name })
    } else {
      return t('personalLending.paymentModal.makePaymentTo', { name: lending.person_name })
    }
  }

  const getPaymentDescription = () => {
    if (lending.type === 'lent') {
      return t('personalLending.paymentModal.recordPaymentReceivedDescription', { name: lending.person_name })
    } else {
      return t('personalLending.paymentModal.recordPaymentMadeDescription', { name: lending.person_name })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getPaymentIcon()}
            {getPaymentTitle()}
          </DialogTitle>
          <DialogDescription>
            {getPaymentDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4" />
                {t('personalLending.paymentModal.currentStatus')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>{t('personalLending.paymentModal.paymentProgress')}</span>
                  <span>{progressPercentage.toFixed(1)}% {tCommon('completed')}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-600">{formatAmount(paidAmount)}</p>
                    <p className="text-xs text-muted-foreground">{tCommon('paid')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-600">{formatAmount(remainingAmount)}</p>
                    <p className="text-xs text-muted-foreground">{tCommon('remaining')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{formatAmount(originalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{t('personalLending.originalAmount')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {t('personalLending.paymentModal.paymentDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t('personalLending.paymentModal.paymentAmount')} ({currency})</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={remainingAmount * 1.1} // Allow slight overpayment
                      placeholder="0.00"
                      {...register('amount', { valueAsNumber: true })}
                      className={errors.amount ? 'border-red-500' : ''}
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-500">{errors.amount.message}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue('amount', remainingAmount / 4)}
                      >
                        25%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue('amount', remainingAmount / 2)}
                      >
                        50%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue('amount', (remainingAmount * 3) / 4)}
                      >
                        75%
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue('amount', remainingAmount)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Full ({formatAmount(remainingAmount)})
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_date">{t('personalLending.paymentModal.paymentDate')}</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      {...register('payment_date')}
                      className={errors.payment_date ? 'border-red-500' : ''}
                    />
                    {errors.payment_date && (
                      <p className="text-sm text-red-500">{errors.payment_date.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_id">{t('personalLending.paymentModal.accountOptional')}</Label>
                  <Select 
                    value={watch('account_id') || 'none'} 
                    onValueChange={(value) => setValue('account_id', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={accountsLoading ? tCommon('loading') + '...' : t('personalLending.paymentModal.selectAccount')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{tCommon('noAccount')}</SelectItem>
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
                  <p className="text-xs text-muted-foreground">
                    {t('personalLending.paymentModal.accountBalanceNote')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('personalLending.paymentModal.notesOptional')}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t('personalLending.paymentModal.notesPlaceholder')}
                    {...register('notes')}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Preview */}
            {watchedAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  isOverPayment 
                    ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20' 
                    : isFullPayment 
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                      : 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <h4 className={`font-semibold mb-3 ${
                  isOverPayment 
                    ? 'text-orange-900 dark:text-orange-200' 
                    : isFullPayment 
                      ? 'text-green-900 dark:text-green-200'
                      : 'text-blue-900 dark:text-blue-200'
                }`}>
                  {isOverPayment ? `⚠️ ${t('personalLending.paymentModal.overpaymentAlert')}` : isFullPayment ? `✅ ${t('personalLending.paymentModal.fullPayment')}` : `📊 ${t('personalLending.paymentModal.partialPaymentPreview')}`}
                </h4>
                
                {isOverPayment && (
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                    {t('personalLending.paymentModal.overpaymentMessage', { 
                      paymentAmount: formatAmount(watchedAmount), 
                      remainingBalance: formatAmount(remainingAmount) 
                    })}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('personalLending.paymentModal.newProgress')}</span>
                    <span>{Math.min(100, newProgressPercentage).toFixed(1)}% {tCommon('completed')}</span>
                  </div>
                  <Progress value={Math.min(100, newProgressPercentage)} className="h-2" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className={`text-lg font-bold ${
                        isOverPayment ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {formatAmount(Math.min(originalAmount, newPaidAmount))}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('personalLending.paymentModal.newPaid')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        {formatAmount(newRemainingAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('personalLending.paymentModal.newRemaining')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">{formatAmount(originalAmount)}</p>
                      <p className="text-xs text-muted-foreground">{t('personalLending.originalAmount')}</p>
                    </div>
                  </div>
                  {isOverPayment && (
                    <div className="text-center pt-2 border-t">
                      <p className="text-sm text-orange-600 font-semibold">
                        {t('personalLending.paymentModal.excessAmount')}: {formatAmount(watchedAmount - remainingAmount)}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

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
                disabled={isLoading || watchedAmount <= 0}
                className={`${
                  lending.type === 'lent' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{tCommon('processing')}</span>
                  </div>
                ) : (
                  `${t('personalLending.paymentModal.record')} ${isFullPayment ? t('personalLending.paymentModal.full') : t('personalLending.paymentModal.partial')} ${t('personalLending.paymentModal.payment')}`
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}