'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CouponInput } from './CouponInput'
import { 
  CreditCard, 
  Smartphone, 
  Receipt, 
  Upload, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Copy,
  ExternalLink,
  Gift,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const paymentFormSchema = z.object({
  payment_method_id: z.string().min(1, 'Please select a payment method'),
  transaction_id: z.string().min(1, 'Transaction ID is required').min(6, 'Transaction ID must be at least 6 characters'),
  sender_number: z.string().min(1, 'Sender number is required').regex(/^01[3-9]\d{8}$/, 'Invalid mobile number format'),
  payment_proof: z.any().optional(),
  notes: z.string().optional()
})

type PaymentFormData = z.infer<typeof paymentFormSchema>

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  plan: any
  billingCycle: 'monthly' | 'yearly'
  paymentMethods: any[]
  appliedCoupon?: any
  onPaymentComplete: () => void
  onCouponApplied: (coupon: any) => void
}

export function PaymentModal({
  isOpen,
  onClose,
  plan,
  billingCycle,
  paymentMethods,
  appliedCoupon,
  onPaymentComplete,
  onCouponApplied
}: PaymentModalProps) {
  const t = useTranslations('subscription.payment')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'confirmation'>('details')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null)
  const [paymentCalculation, setPaymentCalculation] = useState({
    baseAmount: 0,
    discountAmount: 0,
    finalAmount: 0
  })

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      transaction_id: '',
      sender_number: '',
      notes: ''
    }
  })

  // Calculate pricing
  useEffect(() => {
    const baseAmount = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
    const discountAmount = appliedCoupon?.discount_amount || 0
    const finalAmount = Math.max(baseAmount - discountAmount, 0)

    setPaymentCalculation({
      baseAmount,
      discountAmount,
      finalAmount
    })
  }, [plan, billingCycle, appliedCoupon])

  const handlePaymentMethodSelect = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId)
    setSelectedPaymentMethod(method)
    form.setValue('payment_method_id', methodId)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t('copiedToClipboard'))
  }

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsSubmitting(true)
      
      // Submit payment data to your API
      const response = await fetch('/api/subscription/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          plan_id: plan.id,
          billing_cycle: billingCycle,
          base_amount: paymentCalculation.baseAmount,
          discount_amount: paymentCalculation.discountAmount,
          final_amount: paymentCalculation.finalAmount,
          coupon_id: appliedCoupon?.id || null
        })
      })

      if (!response.ok) throw new Error('Payment submission failed')

      const result = await response.json()
      
      toast.success(t('paymentSubmittedSuccess'))
      setCurrentStep('confirmation')
      
      // Auto-close and refresh after success
      setTimeout(() => {
        onPaymentComplete()
      }, 2000)

    } catch (error) {
      console.error('Payment submission error:', error)
      toast.error(t('paymentSubmissionError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>{t('upgradeSubscription')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('upgradeDescription', { plan: plan.display_name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4">
            {['details', 'payment', 'confirmation'].map((step, index) => (
              <div key={step} className="flex items-center space-x-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  currentStep === step 
                    ? "bg-blue-600 text-white" 
                    : index < ['details', 'payment', 'confirmation'].indexOf(currentStep)
                    ? "bg-green-600 text-white"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                )}>
                  {index < ['details', 'payment', 'confirmation'].indexOf(currentStep) ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div className={cn(
                    "w-12 h-0.5",
                    index < ['details', 'payment', 'confirmation'].indexOf(currentStep) 
                      ? "bg-green-600" 
                      : "bg-slate-200 dark:bg-slate-700"
                  )} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Plan Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('planSummary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{plan.display_name}</span>
                      <Badge variant="outline">{billingCycle === 'monthly' ? t('monthly') : t('yearly')}</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{t('basePrice')}</span>
                        <span>৳{paymentCalculation.baseAmount}</span>
                      </div>
                      
                      {appliedCoupon && (
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center space-x-1">
                            <Gift className="h-4 w-4" />
                            <span>{t('discount')} ({appliedCoupon.code})</span>
                          </span>
                          <span>-৳{paymentCalculation.discountAmount}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between font-bold text-lg">
                        <span>{t('totalAmount')}</span>
                        <span>৳{paymentCalculation.finalAmount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Coupon Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Gift className="h-5 w-5" />
                      <span>{t('couponCode')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CouponInput
                      planName={plan.plan_name}
                      billingCycle={billingCycle}
                      baseAmount={paymentCalculation.baseAmount}
                      appliedCoupon={appliedCoupon}
                      onCouponApplied={onCouponApplied}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={() => setCurrentStep('payment')} size="lg">
                    {t('continueToPayment')}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Payment Methods */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{t('selectPaymentMethod')}</CardTitle>
                        <CardDescription>{t('paymentMethodDescription')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="payment_method_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={(value: string) => {
                                    field.onChange(value)
                                    handlePaymentMethodSelect(value)
                                  }}
                                  defaultValue={field.value}
                                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                >
                                  {paymentMethods.map((method) => (
                                    <div key={method.id} className="relative">
                                      <RadioGroupItem
                                        value={method.id}
                                        id={method.id}
                                        className="peer sr-only"
                                      />
                                      <Label
                                        htmlFor={method.id}
                                        className="flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer hover:border-blue-300 peer-checked:border-blue-600 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-950/20 transition-all"
                                      >
                                        <Smartphone className="h-8 w-8 mb-2 text-slate-600" />
                                        <span className="font-medium">{method.display_name}</span>
                                        <span className="text-sm text-slate-500 text-center mt-1">
                                          {method.description}
                                        </span>
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Payment Instructions */}
                    {selectedPaymentMethod && (
                      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardHeader>
                          <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
                            {t('paymentInstructions')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{t('sendMoneyTo')}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(selectedPaymentMethod.account_info.number)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <div className="font-mono text-lg font-bold">
                                {selectedPaymentMethod.account_info.number}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {selectedPaymentMethod.account_info.name}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start space-x-3">
                              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div className="space-y-2 text-sm">
                                <p className="font-medium text-amber-800 dark:text-amber-200">
                                  {t('importantInstructions')}
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                                  <li>{t('sendExactAmount', { amount: paymentCalculation.finalAmount })}</li>
                                  <li>{t('saveTransactionId')}</li>
                                  <li>{t('fillFormBelow')}</li>
                                  <li>{t('verificationTime')}</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Payment Details Form */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{t('paymentDetails')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="transaction_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('transactionId')}</FormLabel>
                                <FormControl>
                                  <Input placeholder="ABC123DEF456" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="sender_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('senderNumber')}</FormLabel>
                                <FormControl>
                                  <Input placeholder="01712345678" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('additionalNotes')} ({t('optional')})</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder={t('notesPlaceholder')}
                                  className="resize-none"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCurrentStep('details')}
                      >
                        {t('back')}
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('submitting')}
                          </>
                        ) : (
                          <>
                            <Receipt className="h-4 w-4 mr-2" />
                            {t('submitPayment')}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}

            {currentStep === 'confirmation' && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {t('paymentSubmitted')}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {t('paymentSubmittedDescription')}
                </p>

                <Card className="text-left">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('whatHappensNext')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">1</span>
                        </div>
                        <span>{t('step1Description')}</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">2</span>
                        </div>
                        <span>{t('step2Description')}</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">3</span>
                        </div>
                        <span>{t('step3Description')}</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}