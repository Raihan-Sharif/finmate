'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Gift, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Percent,
  DollarSign,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface CouponInputProps {
  onCouponApplied: (coupon: any) => void
  appliedCoupon?: any
  disabled?: boolean
}

export default function CouponInput({
  onCouponApplied,
  appliedCoupon,
  disabled = false
}: CouponInputProps) {
  const t = useTranslations('subscription')
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showInput, setShowInput] = useState(false)

  const validateCoupon = async () => {
    if (!code.trim()) {
      setValidationError('Please enter a coupon code')
      return
    }

    try {
      setIsValidating(true)
      setValidationError(null)

      const response = await fetch('/api/subscription/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase().trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Invalid coupon code')
      }

      if (result.is_valid) {
        onCouponApplied({
          id: result.coupon_id,
          code: code.toUpperCase().trim(),
          discount_type: result.discount_type,
          discount_value: result.discount_value,
          description: result.description
        })
        setCode('')
        setShowInput(false)
        toast.success(`Coupon "${code.toUpperCase()}" applied successfully!`)
      } else {
        setValidationError(result.message || 'Invalid or expired coupon code')
      }

    } catch (error: any) {
      console.error('Coupon validation error:', error)
      setValidationError(error.message || 'Failed to validate coupon code')
    } finally {
      setIsValidating(false)
    }
  }

  const removeCoupon = () => {
    onCouponApplied(null)
    setValidationError(null)
    setCode('')
    toast.success('Coupon removed')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      validateCoupon()
    }
  }

  if (appliedCoupon) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800/50 rounded-lg shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 font-mono text-sm">
                  {appliedCoupon.code}
                </Badge>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Applied!
                </span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                {appliedCoupon.description || 
                 `${appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% discount` : `৳${appliedCoupon.discount_value} off`}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeCoupon}
            className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {!showInput ? (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowInput(true)}
            disabled={disabled}
            className="group hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 border-dashed border-2 hover:border-purple-300"
          >
            <Gift className="h-4 w-4 mr-2 group-hover:text-purple-600" />
            Have a coupon code?
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Enter coupon code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    setValidationError(null)
                  }}
                  onKeyPress={handleKeyPress}
                  className="pl-10 font-mono uppercase"
                  disabled={disabled || isValidating}
                />
                <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <Button
                onClick={validateCoupon}
                disabled={disabled || isValidating || !code.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowInput(false)
                  setCode('')
                  setValidationError(null)
                }}
              >
                Cancel
              </Button>
            </div>

            {/* Validation Error */}
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Sample Coupons */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Try these sample codes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCode('WELCOME25')}
                      className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    >
                      WELCOME25
                    </button>
                    <button
                      onClick={() => setCode('NEWUSER50')}
                      className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    >
                      NEWUSER50
                    </button>
                    <button
                      onClick={() => setCode('FREEPRO')}
                      className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 rounded hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors text-green-700 dark:text-green-300"
                    >
                      FREEPRO (100% off)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}