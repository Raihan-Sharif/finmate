'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Smartphone, 
  QrCode, 
  CreditCard, 
  Banknote,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  Loader2,
  Shield,
  Clock,
  Phone,
  Receipt,
  Gift,
  Percent,
  DollarSign,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import CouponInput from './CouponInputSimple'

interface PaymentMethod {
  id: string
  name: string
  displayName: string
  icon: React.ReactNode
  color: string
  description: string
  instructions: string[]
  accountNumber?: string
  qrCodeUrl?: string
  minimumAmount?: number
  processingTime: string
  fees: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'bkash',
    name: 'bKash',
    displayName: 'bKash',
    icon: <Smartphone className="h-6 w-6" />,
    color: 'from-pink-500 to-red-500',
    description: 'Send money via bKash mobile banking',
    instructions: [
      'Open your bKash app',
      'Select "Send Money"',
      'Enter the merchant number below',
      'Enter the exact amount',
      'Complete the transaction',
      'Note down the Transaction ID (TrxID)'
    ],
    accountNumber: '01712345678',
    processingTime: '5-10 minutes',
    fees: 'No additional fees'
  },
  {
    id: 'nagad',
    name: 'nagad',
    displayName: 'Nagad',
    icon: <Smartphone className="h-6 w-6" />,
    color: 'from-orange-500 to-red-600',
    description: 'Send money via Nagad mobile banking',
    instructions: [
      'Open your Nagad app',
      'Select "Send Money"',
      'Enter the merchant number below',
      'Enter the exact amount',
      'Complete the transaction',
      'Note down the Transaction ID'
    ],
    accountNumber: '01798765432',
    processingTime: '5-10 minutes',
    fees: 'No additional fees'
  },
  {
    id: 'rocket',
    name: 'rocket',
    displayName: 'Rocket',
    icon: <Smartphone className="h-6 w-6" />,
    color: 'from-purple-500 to-indigo-600',
    description: 'Send money via Rocket mobile banking',
    instructions: [
      'Open your Rocket app',
      'Select "Send Money"',
      'Enter the merchant number below',
      'Enter the exact amount',
      'Complete the transaction',
      'Note down the Transaction ID'
    ],
    accountNumber: '017123456-7',
    processingTime: '10-15 minutes',
    fees: 'No additional fees'
  },
  {
    id: 'bank_transfer',
    name: 'bank_transfer',
    displayName: 'Bank Transfer',
    icon: <CreditCard className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-600',
    description: 'Direct bank transfer to our account',
    instructions: [
      'Login to your online banking',
      'Select "Fund Transfer"',
      'Enter account details below',
      'Enter the exact amount',
      'Complete the transfer',
      'Note down the Transaction Reference'
    ],
    accountNumber: 'Bank Asia - 0123456789012',
    processingTime: '1-2 hours',
    fees: 'Bank charges may apply'
  }
]

interface PaymentMethodSelectorProps {
  selectedPlan: string
  billingCycle: 'monthly' | 'yearly'
  price: number
  originalPrice: number
  appliedCoupon: any
  onPaymentSubmit: (paymentData: any) => void
  onBack: () => void
  loading: boolean
}

export default function PaymentMethodSelector({
  selectedPlan,
  billingCycle,
  price,
  originalPrice,
  appliedCoupon,
  onPaymentSubmit,
  onBack,
  loading
}: PaymentMethodSelectorProps) {
  const t = useTranslations('subscription')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [senderNumber, setSenderNumber] = useState('')
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [localAppliedCoupon, setLocalAppliedCoupon] = useState(appliedCoupon)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleCouponApplied = (coupon: any) => {
    setLocalAppliedCoupon(coupon)
  }

  const calculateFinalPrice = () => {
    if (!localAppliedCoupon) return price
    
    let discount = 0
    if (localAppliedCoupon.discount_type === 'percentage') {
      discount = (price * localAppliedCoupon.discount_value) / 100
    } else {
      discount = localAppliedCoupon.discount_value
    }
    
    return Math.max(0, price - discount)
  }

  const finalPrice = calculateFinalPrice()
  const discountAmount = price - finalPrice

  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!selectedMethod) {
      errors.method = 'Please select a payment method'
    }
    
    if (!transactionId.trim()) {
      errors.transactionId = 'Transaction ID is required'
    } else if (transactionId.trim().length < 6) {
      errors.transactionId = 'Transaction ID must be at least 6 characters'
    }
    
    if (!senderNumber.trim()) {
      errors.senderNumber = 'Your phone number is required'
    } else if (!/^01[3-9]\d{8}$/.test(senderNumber.trim())) {
      errors.senderNumber = 'Please enter a valid Bangladeshi phone number'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    const paymentData = {
      method: selectedMethod?.id,
      transaction_id: transactionId.trim(),
      sender_number: senderNumber.trim(),
      amount: finalPrice,
      currency: 'BDT',
      coupon: localAppliedCoupon,
      discount_amount: discountAmount,
      original_amount: price,
      payment_method_details: {
        method_name: selectedMethod?.displayName,
        merchant_account: selectedMethod?.accountNumber
      }
    }

    onPaymentSubmit(paymentData)
  }

  const hasDiscount = appliedCoupon && price < originalPrice

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Plans
        </Button>
        
        <div>
          <h2 className="text-3xl font-bold mb-2">Complete Your Payment</h2>
          <p className="text-slate-600 dark:text-slate-400">
            You're upgrading to <strong>{selectedPlan.toUpperCase()}</strong> plan
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Select Payment Method</span>
              </CardTitle>
              <CardDescription>
                Choose your preferred payment method to complete the subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <motion.div
                    key={method.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedMethod?.id === method.id
                          ? 'ring-2 ring-purple-500 shadow-lg'
                          : 'hover:shadow-md border-slate-200 dark:border-slate-700'
                      }`}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${method.color} text-white`}>
                            {method.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{method.displayName}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              {method.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{method.processingTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Shield className="h-3 w-3" />
                                <span>{method.fees}</span>
                              </div>
                            </div>
                          </div>
                          {selectedMethod?.id === method.id && (
                            <Check className="h-5 w-5 text-purple-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          {selectedMethod && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Receipt className="h-5 w-5" />
                    <span>Payment Instructions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Account/Merchant Number */}
                  {selectedMethod.accountNumber && (
                    <div className="space-y-2">
                      <Label className="font-medium">
                        {selectedMethod.id === 'bank_transfer' ? 'Account Details' : 'Merchant Number'}
                      </Label>
                      <div className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                        <code className="flex-1 font-mono text-lg font-semibold">
                          {selectedMethod.accountNumber}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(selectedMethod.accountNumber!, 'Account number')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Amount to Send */}
                  <div className="space-y-2">
                    <Label className="font-medium">Amount to Send</Label>
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          {localAppliedCoupon && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <span className="line-through">৳{price}</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                {localAppliedCoupon.code}
                              </Badge>
                            </div>
                          )}
                          <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                            ৳{finalPrice}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(finalPrice.toString(), 'Amount')}
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      {localAppliedCoupon && discountAmount > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          You save ৳{discountAmount} with coupon "{localAppliedCoupon.code}"
                        </p>
                      )}
                      {hasDiscount && !localAppliedCoupon && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Original: ৳{originalPrice} • You save: ৳{originalPrice - price}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step by Step Instructions */}
                  <div className="space-y-2">
                    <Label className="font-medium">Step-by-Step Instructions</Label>
                    <ol className="space-y-2">
                      {selectedMethod.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {instruction}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> Make sure to send the exact amount (৳{price}) and note down the transaction ID. 
                      Your subscription will be activated after verification.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Transaction Form */}
          {selectedMethod && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Payment Confirmation</CardTitle>
                  <CardDescription>
                    Please provide your payment details after completing the transaction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Coupon Input */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800/30">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center">
                        <Gift className="h-4 w-4 mr-2" />
                        Apply Coupon Code
                      </h4>
                      <CouponInput
                        onCouponApplied={handleCouponApplied}
                        appliedCoupon={localAppliedCoupon}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transactionId">
                        Transaction ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="transactionId"
                        placeholder="Enter transaction ID from your payment app"
                        value={transactionId}
                        onChange={(e) => {
                          setTransactionId(e.target.value)
                          if (formErrors.transactionId) {
                            setFormErrors(prev => ({ ...prev, transactionId: '' }))
                          }
                        }}
                        className={formErrors.transactionId ? 'border-red-500' : ''}
                      />
                      {formErrors.transactionId && (
                        <p className="text-red-500 text-sm">{formErrors.transactionId}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="senderNumber">
                        Your Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="senderNumber"
                        placeholder="01XXXXXXXXX"
                        value={senderNumber}
                        onChange={(e) => {
                          setSenderNumber(e.target.value)
                          if (formErrors.senderNumber) {
                            setFormErrors(prev => ({ ...prev, senderNumber: '' }))
                          }
                        }}
                        className={formErrors.senderNumber ? 'border-red-500' : ''}
                      />
                      {formErrors.senderNumber && (
                        <p className="text-red-500 text-sm">{formErrors.senderNumber}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Enter the phone number you used to send the payment
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Submit Payment Details
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Plan</span>
                    <span className="font-semibold capitalize">{selectedPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing</span>
                    <span className="capitalize">{billingCycle}</span>
                  </div>
                  {localAppliedCoupon && discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>Original Price</span>
                        <span className="line-through">৳{price}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({localAppliedCoupon.code})</span>
                        <span>-৳{discountAmount}</span>
                      </div>
                    </>
                  )}
                  {hasDiscount && (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>Original Price</span>
                        <span className="line-through">৳{originalPrice}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span>-৳{originalPrice - price}</span>
                      </div>
                    </>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>৳{finalPrice}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Activated within 12-24 hours</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-purple-500" />
                    <span>24/7 customer support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}