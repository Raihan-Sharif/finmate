'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Crown, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Star,
  Users,
  CreditCard,
  Download,
  Eye,
  RefreshCw,
  Gift,
  DollarSign,
  FileText,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

export function SubscriptionOverview() {
  const t = useTranslations('subscription')
  const { user } = useAuth()
  const { 
    subscriptionStatus, 
    loading, 
    error, 
    fetchPaymentHistory,
    refreshSubscription 
  } = useSubscription()
  
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadPaymentHistory()
    }
  }, [user?.id])

  const loadPaymentHistory = async () => {
    try {
      setHistoryLoading(true)
      const history = await fetchPaymentHistory()
      setPaymentHistory(history)
    } catch (error) {
      console.error('Error loading payment history:', error)
      toast.error('Failed to load payment history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshSubscription()
      await loadPaymentHistory()
      toast.success('Subscription data refreshed')
    } catch (error) {
      console.error('Error refreshing subscription:', error)
      toast.error('Failed to refresh subscription data')
    } finally {
      setRefreshing(false)
    }
  }

  const getPlanIcon = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'premium':
        return Star
      case 'pro':
        return Crown
      case 'max':
        return Users
      default:
        return CreditCard
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'premium':
        return 'from-blue-500 to-indigo-600'
      case 'pro':
        return 'from-purple-500 to-pink-600'
      case 'max':
        return 'from-emerald-500 to-teal-600'
      default:
        return 'from-slate-500 to-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'free':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'verified':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'submitted':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const getDaysRemainingPercentage = () => {
    if (!subscriptionStatus?.expires_at || !subscriptionStatus?.days_remaining) return 0
    
    const now = new Date()
    const expiresAt = new Date(subscriptionStatus.expires_at)
    const totalDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (totalDays <= 0) return 0
    
    const daysRemaining = subscriptionStatus.days_remaining
    return Math.max(0, Math.min(100, (daysRemaining / 30) * 100))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!subscriptionStatus) {
    return null
  }

  const PlanIcon = getPlanIcon(subscriptionStatus.current_plan)
  const planColorClass = getPlanColor(subscriptionStatus.current_plan)

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-3 rounded-lg bg-gradient-to-br text-white",
                  planColorClass
                )}>
                  <PlanIcon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl capitalize">
                    {subscriptionStatus.current_plan} Plan
                  </CardTitle>
                  <CardDescription>
                    {t('currentSubscription')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(subscriptionStatus.status)}>
                  {t(`status.${subscriptionStatus.status}`)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                  {t('refresh')}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Subscription Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionStatus.expires_at && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <span>{t('expirationDate')}</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {format(new Date(subscriptionStatus.expires_at), 'PPP')}
                  </p>
                  
                  {subscriptionStatus.days_remaining !== null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {t('daysRemaining')}
                        </span>
                        <span className="font-medium">
                          {subscriptionStatus.days_remaining} {t('days')}
                        </span>
                      </div>
                      <Progress 
                        value={getDaysRemainingPercentage()} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t('planStatus')}</span>
                </div>
                <div className="space-y-2">
                  <Badge className={getStatusColor(subscriptionStatus.status)} variant="outline">
                    {subscriptionStatus.status === 'active' ? t('activeSubscription') : 
                     subscriptionStatus.status === 'pending' ? t('pendingActivation') :
                     subscriptionStatus.status === 'expired' ? t('subscriptionExpired') :
                     t('freeUser')}
                  </Badge>
                  {subscriptionStatus.can_upgrade && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('upgradeAvailable')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                  <DollarSign className="h-4 w-4" />
                  <span>{t('billing')}</span>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {subscriptionStatus.current_plan === 'free' ? t('free') : t('paidPlan')}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {subscriptionStatus.current_plan === 'free' 
                      ? t('noCharges') 
                      : t('activeBilling')}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Payment Alert */}
            {subscriptionStatus.pending_payment_id && (
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  {t('pendingPaymentAlert')}
                  <Button variant="link" className="p-0 h-auto ml-2 text-amber-800 dark:text-amber-200 font-semibold">
                    {t('checkProgress')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{t('paymentHistory')}</CardTitle>
                <CardDescription>
                  {t('viewAllPayments')}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPaymentHistory}
                disabled={historyLoading}
              >
                {historyLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {t('refresh')}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                      </div>
                      <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">{t('noPaymentHistory')}</p>
                <p className="text-sm">{t('noPaymentHistoryDescription')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
                          <CreditCard className="h-5 w-5" />
                        </div>
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {payment.plan?.display_name || 'Unknown Plan'}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {payment.billing_cycle}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center space-x-1">
                            <Smartphone className="h-3 w-3" />
                            <span>{payment.payment_method?.display_name || 'Unknown Method'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>৳{payment.final_amount}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(payment.created_at), 'MMM dd, yyyy')}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={cn("text-xs", getPaymentStatusColor(payment.status))}>
                        {t(`paymentStatus.${payment.status}`)}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Detail Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPayment(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{t('paymentDetails')}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPayment(null)}
                    className="h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('plan')}
                    </label>
                    <p className="text-sm font-medium">
                      {selectedPayment.plan?.display_name || 'Unknown Plan'} - {selectedPayment.billing_cycle}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('amount')}
                    </label>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{t('baseAmount')}</span>
                        <span>৳{selectedPayment.base_amount}</span>
                      </div>
                      {selectedPayment.discount_amount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>{t('discount')} ({selectedPayment.coupon?.code})</span>
                          <span>-৳{selectedPayment.discount_amount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>{t('total')}</span>
                        <span>৳{selectedPayment.final_amount}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('paymentMethod')}
                    </label>
                    <p className="text-sm font-medium">
                      {selectedPayment.payment_method?.display_name || 'Unknown Method'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('transactionId')}
                    </label>
                    <p className="text-sm font-mono font-medium">
                      {selectedPayment.transaction_id}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('status')}
                    </label>
                    <Badge className={cn("text-xs", getPaymentStatusColor(selectedPayment.status))}>
                      {t(`paymentStatus.${selectedPayment.status}`)}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('submittedAt')}
                    </label>
                    <p className="text-sm">
                      {format(new Date(selectedPayment.created_at), 'PPpp')}
                    </p>
                  </div>
                  
                  {selectedPayment.admin_notes && (
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t('adminNotes')}
                      </label>
                      <p className="text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded">
                        {selectedPayment.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}