'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Crown, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Star,
  Users,
  CreditCard,
  TrendingUp,
  Gift,
  ArrowRight,
  RefreshCw,
  Settings,
  History,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'sonner'

export function SubscriptionCard() {
  const t = useTranslations('dashboard')
  const { user } = useAuth()
  const { 
    subscriptionStatus, 
    loading, 
    error, 
    refreshSubscription,
    fetchPaymentHistory 
  } = useSubscription()
  
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadPaymentHistory()
    }
  }, [user?.id])

  const loadPaymentHistory = async () => {
    try {
      const history = await fetchPaymentHistory()
      setPaymentHistory(history.slice(0, 3)) // Show latest 3 payments
    } catch (error) {
      console.error('Error loading payment history:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshSubscription()
      await loadPaymentHistory()
      toast.success('Subscription updated')
    } catch (error) {
      console.error('Error refreshing subscription:', error)
      toast.error('Failed to refresh')
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
                "p-2 rounded-lg bg-gradient-to-br text-white",
                planColorClass
              )}>
                <PlanIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg capitalize">
                  {subscriptionStatus.current_plan} Plan
                </CardTitle>
                <CardDescription>
                  Subscription Management
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(subscriptionStatus.status)}>
                {subscriptionStatus.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptionStatus.expires_at && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span>Expires</span>
                </div>
                <p className="font-semibold">
                  {format(new Date(subscriptionStatus.expires_at), 'MMM dd, yyyy')}
                </p>
                
                {subscriptionStatus.days_remaining !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Days left
                      </span>
                      <span className="font-medium">
                        {subscriptionStatus.days_remaining}
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

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4" />
                <span>Plan Status</span>
              </div>
              <div>
                <Badge className={getStatusColor(subscriptionStatus.status)} variant="outline">
                  {subscriptionStatus.status === 'active' ? 'Active' : 
                   subscriptionStatus.status === 'pending' ? 'Pending' :
                   subscriptionStatus.status === 'expired' ? 'Expired' : 'Free'}
                </Badge>
                {subscriptionStatus.can_upgrade && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Upgrade available
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pending Payment Alert */}
          {subscriptionStatus.pending_payment_id && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                You have a pending payment under review
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-2 text-amber-800 dark:text-amber-200 font-semibold"
                  onClick={() => setShowDetails(true)}
                >
                  View details
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Recent Payments (if any) */}
          {showDetails && paymentHistory.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Recent Payments
              </h4>
              
              <div className="space-y-2">
                {paymentHistory.map((payment) => (
                  <div 
                    key={payment.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium">
                          ৳{payment.final_amount}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {format(new Date(payment.created_at), 'MMM dd')}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn("text-xs", getPaymentStatusColor(payment.status))}>
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Link href="/dashboard/subscription" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </Link>
            
            {subscriptionStatus.current_plan === 'free' && (
              <Link href="/dashboard/subscription" className="flex-1">
                <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Star className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              </Link>
            )}

            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}