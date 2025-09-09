'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { 
  Gift, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Percent,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const couponFormSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(50, 'Coupon code is too long')
})

type CouponFormData = z.infer<typeof couponFormSchema>

interface CouponInputProps {
  planName: string
  billingCycle: 'monthly' | 'yearly'
  baseAmount: number
  appliedCoupon?: any
  onCouponApplied: (coupon: any) => void
}

export function CouponInput({
  planName,
  billingCycle,
  baseAmount,
  appliedCoupon,
  onCouponApplied
}: CouponInputProps) {
  const t = useTranslations('subscription.coupon')
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: ''
    }
  })

  const validateCoupon = async (data: CouponFormData) => {
    try {
      setIsValidating(true)
      setValidationError(null)

      const response = await fetch('/api/subscription/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.code.toUpperCase(),
          plan_name: planName,
          billing_cycle: billingCycle,
          base_amount: baseAmount
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || t('invalidCoupon'))
      }

      if (result.is_valid) {
        onCouponApplied({
          id: result.coupon_id,
          code: data.code.toUpperCase(),
          discount_amount: result.discount_amount,
          type: result.type,
          value: result.value
        })
        toast.success(t('couponAppliedSuccess'))
        form.reset()
      } else {
        setValidationError(result.message || t('invalidCoupon'))
      }

    } catch (error: any) {
      console.error('Coupon validation error:', error)
      setValidationError(error.message || t('validationError'))
    } finally {
      setIsValidating(false)
    }
  }

  const removeCoupon = () => {
    onCouponApplied(null)
    setValidationError(null)
    form.reset()
    toast.success(t('couponRemoved'))
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {appliedCoupon ? (
          <motion.div
            key="applied-coupon"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 font-mono">
                        {appliedCoupon.code}
                      </Badge>
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        {t('couponApplied')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300">
                      {appliedCoupon.type === 'percentage' ? (
                        <>
                          <Percent className="h-4 w-4" />
                          <span>{appliedCoupon.value}% {t('discount')}</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4" />
                          <span>৳{appliedCoupon.value} {t('discount')}</span>
                        </>
                      )}
                      <span className="text-green-600 font-semibold">
                        (-৳{appliedCoupon.discount_amount})
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeCoupon}
                  className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="coupon-input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(validateCoupon)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <Input
                              {...field}
                              placeholder={t('enterCouponCode')}
                              className="pl-10 uppercase"
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                            <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          </div>
                          <Button
                            type="submit"
                            disabled={isValidating || !field.value}
                            className="px-6"
                          >
                            {isValidating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t('validating')}
                              </>
                            ) : (
                              t('apply')
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Error */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Available Coupons Hint */}
      {!appliedCoupon && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <Gift className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {t('availableCoupons')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  WELCOME25 - {t('firstTime25')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  YEARLY20 - {t('yearly20')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  NEWUSER50 - {t('newUser50')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}