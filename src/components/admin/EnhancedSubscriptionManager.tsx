'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CouponManager } from './CouponManager'
import { PaymentMethodManager } from './PaymentMethodManager'
import { SubscriptionPlansManager } from './SubscriptionPlansManager'
import {
  CreditCard,
  Gift,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Loader2,
  BarChart3,
  Crown,
  Package,
  Smartphone,
  Copy,
  RefreshCw,
  FileText,
  User,
  Building2,
  CreditCardIcon,
  Settings,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface PaymentRecord {
  id: string
  user_id: string
  plan_id: string
  payment_method_id: string
  plan: {
    name: string
    display_name: string
    price_monthly?: number
    price_yearly?: number
  }
  payment_method: {
    name: string
    display_name: string
  }
  coupon?: {
    code: string
    type: string
    value: number
  }
  billing_cycle: 'monthly' | 'yearly'
  base_amount: number
  discount_amount: number
  final_amount: number
  currency: string
  transaction_id: string
  sender_number: string
  status: 'pending' | 'submitted' | 'verified' | 'approved' | 'rejected' | 'expired'
  submitted_at?: string
  verified_at?: string
  approved_at?: string
  rejected_at?: string
  admin_notes?: string
  rejection_reason?: string
  profiles: {
    full_name: string
    email: string
  }
  created_at: string
  updated_at: string
}

interface SubscriptionRecord {
  id: string
  user_id: string
  plan_id: string
  billing_cycle: 'monthly' | 'yearly'
  status: 'active' | 'suspended' | 'cancelled' | 'expired'
  start_date: string
  end_date: string
  payment_id?: string
  created_at: string
  updated_at: string
  user: {
    full_name: string
    email: string
    phone_number?: string
  }
  plan: {
    name: string
    display_name: string
    price_monthly: number
    price_yearly: number
    features: string[]
  }
  payment?: {
    transaction_id: string
    final_amount: number
    payment_date: string
    payment_status: string
  }
  days_remaining: number
  is_expired: boolean
}

interface SubscriptionStats {
  total_payments: number
  pending_review: number
  approved_payments: number
  rejected_payments: number
  total_revenue: number
  monthly_revenue: number
  growth_rate: number
}

export function EnhancedSubscriptionManager() {
  const t = useTranslations('common')
  const { user } = useAuth()

  // Data states
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([])
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionRecord[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)

  // UI states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')

  // Subscription filters
  const [subscriptionSearchQuery, setSubscriptionSearchQuery] = useState('')
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<string>('all')

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionRecord | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [extendMonths, setExtendMonths] = useState<number>(1)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchQuery, statusFilter, dateFilter, paymentMethodFilter])

  useEffect(() => {
    filterSubscriptions()
  }, [subscriptions, subscriptionSearchQuery, subscriptionStatusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchPayments(),
        fetchSubscriptions()
      ])
      calculateStats()
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    try {
      setRefreshing(true)
      await Promise.all([
        fetchPayments(),
        fetchSubscriptions()
      ])
      calculateStats()
      toast.success('Data refreshed successfully')
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast.error('Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/subscription/payments')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch payments')
      }

      setPayments(result.payments || [])
    } catch (error) {
      console.error('fetchPayments error:', error)
      throw error
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscription/subscriptions')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch subscriptions')
      }

      setSubscriptions(result.subscriptions || [])
    } catch (error) {
      console.error('fetchSubscriptions error:', error)
      // Don't throw error for subscriptions - it's not critical
      setSubscriptions([])
    }
  }

  const calculateStats = () => {
    const pendingReview = payments.filter(p => ['pending', 'submitted', 'verified'].includes(p.status)).length
    const approved = payments.filter(p => p.status === 'approved').length
    const rejected = payments.filter(p => p.status === 'rejected').length

    const totalRevenue = payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.final_amount, 0)

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const monthlyRevenue = payments
      .filter(p =>
        p.status === 'approved' &&
        p.approved_at &&
        new Date(p.approved_at) >= thisMonth
      )
      .reduce((sum, p) => sum + p.final_amount, 0)

    const lastMonth = new Date(thisMonth)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    const lastMonthRevenue = payments
      .filter(p =>
        p.status === 'approved' &&
        p.approved_at &&
        new Date(p.approved_at) >= lastMonth &&
        new Date(p.approved_at) < thisMonth
      )
      .reduce((sum, p) => sum + p.final_amount, 0)

    const growthRate = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0

    setStats({
      total_payments: payments.length,
      pending_review: pendingReview,
      approved_payments: approved,
      rejected_payments: rejected,
      total_revenue: totalRevenue,
      monthly_revenue: monthlyRevenue,
      growth_rate: growthRate
    })
  }

  const filterPayments = () => {
    let filtered = [...payments]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(payment =>
        payment.profiles.email.toLowerCase().includes(query) ||
        payment.profiles.full_name?.toLowerCase().includes(query) ||
        payment.transaction_id.toLowerCase().includes(query) ||
        payment.sender_number.includes(query) ||
        payment.plan.display_name.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.payment_method.name === paymentMethodFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        default:
          break
      }

      if (dateFilter !== 'all') {
        filtered = filtered.filter(payment =>
          new Date(payment.created_at) >= filterDate
        )
      }
    }

    setFilteredPayments(filtered)
  }

  const filterSubscriptions = () => {
    let filtered = [...subscriptions]

    // Search filter
    if (subscriptionSearchQuery.trim()) {
      const query = subscriptionSearchQuery.toLowerCase()
      filtered = filtered.filter(subscription =>
        subscription.user.email.toLowerCase().includes(query) ||
        subscription.user.full_name?.toLowerCase().includes(query) ||
        subscription.user.phone_number?.includes(query) ||
        subscription.plan.display_name.toLowerCase().includes(query) ||
        subscription.payment?.transaction_id?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (subscriptionStatusFilter !== 'all') {
      filtered = filtered.filter(subscription => subscription.status === subscriptionStatusFilter)
    }

    setFilteredSubscriptions(filtered)
  }

  const updatePaymentStatus = async (paymentId: string, status: 'verified' | 'approved' | 'rejected', notes?: string) => {
    try {
      setProcessingId(paymentId)

      const response = await fetch('/api/admin/subscription/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          status,
          admin_notes: notes || null,
          rejection_reason: status === 'rejected' ? notes : null
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update payment status')
      }

      toast.success(`Payment ${status} successfully`)
      await loadData()
      setShowPaymentModal(false)
    } catch (error: any) {
      console.error('Error updating payment status:', error)
      toast.error(error.message || 'Failed to update payment')
    } finally {
      setProcessingId(null)
    }
  }

  const openPaymentModal = (payment: PaymentRecord) => {
    setSelectedPayment(payment)
    setAdminNotes(payment.admin_notes || '')
    setShowPaymentModal(true)
  }

  const updateSubscriptionStatus = async (subscriptionId: string, action: 'activate' | 'suspend' | 'cancel' | 'extend', extendMonths?: number) => {
    try {
      setProcessingId(subscriptionId)

      const response = await fetch('/api/admin/subscription/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          action,
          extend_months: extendMonths
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update subscription')
      }

      toast.success(`Subscription ${action} completed successfully`)
      await loadData()
      setShowSubscriptionModal(false)
    } catch (error: any) {
      console.error('Error updating subscription:', error)
      toast.error(error.message || 'Failed to update subscription')
    } finally {
      setProcessingId(null)
    }
  }

  const openSubscriptionModal = (subscription: SubscriptionRecord) => {
    setSelectedSubscription(subscription)
    setShowSubscriptionModal(true)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
      case 'submitted':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'verified':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'expired':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      case 'suspended':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'expired':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const getPaymentMethodIcon = (methodName: string) => {
    switch (methodName.toLowerCase()) {
      case 'bkash':
        return <Smartphone className="h-4 w-4 text-pink-600" />
      case 'nagad':
        return <Smartphone className="h-4 w-4 text-orange-600" />
      case 'rocket':
        return <Smartphone className="h-4 w-4 text-purple-600" />
      case 'upay':
        return <Smartphone className="h-4 w-4 text-green-600" />
      case 'bank':
        return <Building2 className="h-4 w-4 text-blue-600" />
      case 'card':
        return <CreditCardIcon className="h-4 w-4 text-indigo-600" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const uniquePaymentMethods = [...new Set(payments.map(p => p.payment_method.name))]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Loading subscription management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Enhanced Subscription Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Comprehensive payment processing and subscription management
          </p>
        </div>
        <Button
          onClick={refreshData}
          disabled={refreshing}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Subscriptions</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Plans</span>
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex items-center space-x-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Coupons</span>
          </TabsTrigger>
          <TabsTrigger value="methods" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Methods</span>
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="shadow-xl border-0 bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <CardContent className="pt-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="h-6 w-6" />
                          <span className="text-sm font-medium opacity-90">Total Revenue</span>
                        </div>
                        <div className="text-3xl font-bold">
                          ৳{stats.total_revenue.toLocaleString()}
                        </div>
                        <div className="text-sm opacity-80 mt-1">
                          ৳{stats.monthly_revenue.toLocaleString()} this month
                        </div>
                      </div>
                      <TrendingUp className="h-8 w-8 opacity-60" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <CardContent className="pt-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-6 w-6" />
                          <span className="text-sm font-medium opacity-90">Approved</span>
                        </div>
                        <div className="text-3xl font-bold">{stats.approved_payments}</div>
                        <div className="text-sm opacity-80 mt-1">Active subscriptions</div>
                      </div>
                      <Crown className="h-8 w-8 opacity-60" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="shadow-xl border-0 bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <CardContent className="pt-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-6 w-6" />
                          <span className="text-sm font-medium opacity-90">Pending Review</span>
                        </div>
                        <div className="text-3xl font-bold">{stats.pending_review}</div>
                        <div className="text-sm opacity-80 mt-1">Awaiting action</div>
                      </div>
                      <AlertTriangle className="h-8 w-8 opacity-60" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <CardContent className="pt-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-6 w-6" />
                          <span className="text-sm font-medium opacity-90">Growth Rate</span>
                        </div>
                        <div className="text-3xl font-bold">
                          {stats.growth_rate > 0 ? '+' : ''}{stats.growth_rate.toFixed(1)}%
                        </div>
                        <div className="text-sm opacity-80 mt-1">vs last month</div>
                      </div>
                      <BarChart3 className="h-8 w-8 opacity-60" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Quick Actions and Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span>Recent Payment Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {payment.profiles?.full_name?.[0] || payment.profiles?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{payment.profiles.full_name || payment.profiles.email}</p>
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            {getPaymentMethodIcon(payment.payment_method.name)}
                            <span>৳{payment.final_amount}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={cn("text-xs", getStatusColor(payment.status))}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Payment Methods Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uniquePaymentMethods.map((method) => {
                    const methodPayments = payments.filter(p => p.payment_method.name === method)
                    const methodRevenue = methodPayments
                      .filter(p => p.status === 'approved')
                      .reduce((sum, p) => sum + p.final_amount, 0)

                    return (
                      <div key={method} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center space-x-3">
                          {getPaymentMethodIcon(method)}
                          <div>
                            <p className="text-sm font-medium capitalize">{method}</p>
                            <p className="text-xs text-slate-500">{methodPayments.length} payments</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">৳{methodRevenue.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">Revenue</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Advanced Payment Management</CardTitle>
                  <CardDescription>Process and track subscription payments with enhanced filters</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>

              {/* Enhanced Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search payments, users, transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {uniquePaymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(method)}
                          <span className="capitalize">{method}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No payments found</h3>
                  <p>Try adjusting your filters or search criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                      onClick={() => openPaymentModal(payment)}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg">
                            {payment.profiles?.full_name?.[0] || payment.profiles?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {payment.profiles.full_name || payment.profiles.email}
                            </h4>
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              {payment.plan.display_name}
                            </Badge>
                            <Badge className={cn("text-xs px-2 py-0.5", getStatusColor(payment.status))}>
                              {payment.status}
                            </Badge>
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                              {getPaymentMethodIcon(payment.payment_method.name)}
                              <span className="capitalize">{payment.payment_method.display_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">৳{payment.final_amount.toLocaleString()}</span>
                              {payment.discount_amount > 0 && (
                                <span className="text-green-600">(-৳{payment.discount_amount})</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(payment.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                            {payment.coupon && (
                              <div className="flex items-center space-x-1">
                                <Gift className="h-3 w-3 text-purple-500" />
                                <span className="text-purple-600 font-mono">{payment.coupon.code}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openPaymentModal(payment)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          <span>Review</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    <span>Active Subscription Management</span>
                  </CardTitle>
                  <CardDescription>
                    Monitor and manage user subscription statuses and billing cycles
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export List
                  </Button>
                </div>
              </div>

              {/* Subscription Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search users, plans, transactions..."
                    value={subscriptionSearchQuery}
                    onChange={(e) => setSubscriptionSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={subscriptionStatusFilter} onValueChange={setSubscriptionStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                  Total: {filteredSubscriptions.length} subscriptions
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
                  <p>Try adjusting your filters or search criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubscriptions.map((subscription, index) => (
                    <motion.div
                      key={subscription.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                      onClick={() => openSubscriptionModal(subscription)}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg">
                            {subscription.user?.full_name?.[0] || subscription.user?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {subscription.user.full_name || subscription.user.email}
                            </h4>
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              {subscription.plan.display_name}
                            </Badge>
                            <Badge className={cn("text-xs px-2 py-0.5", getSubscriptionStatusColor(subscription.status))}>
                              {subscription.status}
                            </Badge>
                            {subscription.is_expired && (
                              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                Expired
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span className="capitalize">{subscription.billing_cycle}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">
                                ৳{subscription.billing_cycle === 'monthly'
                                  ? subscription.plan.price_monthly.toLocaleString()
                                  : subscription.plan.price_yearly.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {subscription.days_remaining > 0
                                  ? `${subscription.days_remaining} days left`
                                  : 'Expired'
                                }
                              </span>
                            </div>
                            {subscription.payment && (
                              <div className="flex items-center space-x-1">
                                <CreditCard className="h-3 w-3" />
                                <span className="font-mono text-xs">{subscription.payment.transaction_id}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openSubscriptionModal(subscription)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          <span>Manage</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <SubscriptionPlansManager />
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-6">
          <CouponManager />
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <PaymentMethodManager />
        </TabsContent>
      </Tabs>

      {/* Enhanced Payment Detail Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment Processing Center</span>
            </DialogTitle>
            <DialogDescription>
              Review payment details and update status with comprehensive tracking
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Enhanced Payment Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Customer Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Customer Name
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedPayment.profiles.full_name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Email Address
                      </Label>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-mono">{selectedPayment.profiles.email}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(selectedPayment.profiles.email)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        User ID
                      </Label>
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {selectedPayment.user_id}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Package className="h-4 w-4" />
                      <span>Subscription Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Plan
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedPayment.plan.display_name}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {selectedPayment.billing_cycle} billing
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Payment Method
                      </Label>
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(selectedPayment.payment_method.name)}
                        <span className="text-sm font-medium">{selectedPayment.payment_method.display_name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Transaction Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Transaction & Payment Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">Transaction ID</Label>
                        <div className="flex items-center space-x-2">
                          <p className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {selectedPayment.transaction_id}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(selectedPayment.transaction_id)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">Sender Number</Label>
                        <div className="flex items-center space-x-2">
                          <p className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {selectedPayment.sender_number}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(selectedPayment.sender_number)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">Submitted At</Label>
                        <p className="text-sm">
                          {selectedPayment.submitted_at
                            ? format(new Date(selectedPayment.submitted_at), 'PPpp')
                            : 'Not submitted yet'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">Payment Breakdown</Label>
                        <div className="space-y-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                          <div className="flex justify-between">
                            <span>Base Amount</span>
                            <span className="font-mono">৳{selectedPayment.base_amount.toLocaleString()}</span>
                          </div>
                          {selectedPayment.discount_amount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount ({selectedPayment.coupon?.code})</span>
                              <span className="font-mono">-৳{selectedPayment.discount_amount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Final Amount</span>
                            <span className="font-mono">৳{selectedPayment.final_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">Current Status</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={cn("text-sm px-3 py-1", getStatusColor(selectedPayment.status))}>
                            {selectedPayment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="admin-notes" className="text-sm font-medium">
                  Admin Notes & Comments
                </Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add detailed notes about this payment, verification status, or any issues..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Enhanced Action Buttons */}
              {selectedPayment.status !== 'approved' && selectedPayment.status !== 'rejected' && (
                <div className="flex space-x-3 pt-4 border-t">
                  {selectedPayment.status === 'submitted' && (
                    <Button
                      onClick={() => updatePaymentStatus(selectedPayment.id, 'verified', adminNotes)}
                      disabled={processingId === selectedPayment.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    >
                      {processingId === selectedPayment.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Verified
                        </>
                      )}
                    </Button>
                  )}

                  {selectedPayment.status === 'verified' && (
                    <Button
                      onClick={() => updatePaymentStatus(selectedPayment.id, 'approved', adminNotes)}
                      disabled={processingId === selectedPayment.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                    >
                      {processingId === selectedPayment.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Payment
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    onClick={() => updatePaymentStatus(selectedPayment.id, 'rejected', adminNotes)}
                    disabled={processingId === selectedPayment.id}
                    variant="destructive"
                    className="flex-1 shadow-lg"
                  >
                    {processingId === selectedPayment.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Payment
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscription Management Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Crown className="h-5 w-5" />
              <span>Subscription Management</span>
            </DialogTitle>
            <DialogDescription>
              Manage user subscription status, billing, and access control
            </DialogDescription>
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-6">
              {/* Subscription Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Subscriber Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Name
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedSubscription.user.full_name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Email
                      </Label>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-mono">{selectedSubscription.user.email}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(selectedSubscription.user.email)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {selectedSubscription.user.phone_number && (
                      <div>
                        <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Phone
                        </Label>
                        <p className="text-sm">{selectedSubscription.user.phone_number}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Crown className="h-4 w-4" />
                      <span>Subscription Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Plan
                      </Label>
                      <p className="text-sm font-medium">{selectedSubscription.plan.display_name}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {selectedSubscription.billing_cycle} billing
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={cn("text-sm px-3 py-1", getSubscriptionStatusColor(selectedSubscription.status))}>
                          {selectedSubscription.status}
                        </Badge>
                        {selectedSubscription.is_expired && (
                          <Badge variant="destructive" className="text-sm px-3 py-1">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Duration
                      </Label>
                      <p className="text-sm">
                        {selectedSubscription.days_remaining > 0
                          ? `${selectedSubscription.days_remaining} days remaining`
                          : 'Subscription expired'
                        }
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedSubscription.end_date ? format(new Date(selectedSubscription.end_date), 'PPP') : 'No end date'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Information */}
              {selectedSubscription.payment && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">Transaction ID</Label>
                        <p className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {selectedSubscription.payment.transaction_id}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">Amount Paid</Label>
                        <p className="text-sm font-medium">৳{selectedSubscription.payment.final_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 dark:text-slate-400">Payment Date</Label>
                        <p className="text-sm">
                          {format(new Date(selectedSubscription.payment.payment_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Extend Subscription */}
              {selectedSubscription.status === 'active' && (
                <div className="space-y-2">
                  <Label htmlFor="extend-months" className="text-sm font-medium">
                    Extend Subscription (Months)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="extend-months"
                      type="number"
                      min="1"
                      max="12"
                      value={extendMonths}
                      onChange={(e) => setExtendMonths(parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                    <span className="text-sm text-slate-500">months</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                {selectedSubscription.status === 'suspended' && (
                  <Button
                    onClick={() => updateSubscriptionStatus(selectedSubscription.id, 'activate')}
                    disabled={processingId === selectedSubscription.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  >
                    {processingId === selectedSubscription.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Reactivate
                      </>
                    )}
                  </Button>
                )}

                {selectedSubscription.status === 'active' && (
                  <>
                    <Button
                      onClick={() => updateSubscriptionStatus(selectedSubscription.id, 'extend', extendMonths)}
                      disabled={processingId === selectedSubscription.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    >
                      {processingId === selectedSubscription.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Extend {extendMonths} month{extendMonths > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => updateSubscriptionStatus(selectedSubscription.id, 'suspend')}
                      disabled={processingId === selectedSubscription.id}
                      variant="outline"
                      className="flex-1 shadow-lg"
                    >
                      {processingId === selectedSubscription.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Suspend
                        </>
                      )}
                    </Button>
                  </>
                )}

                {selectedSubscription.status !== 'cancelled' && (
                  <Button
                    onClick={() => updateSubscriptionStatus(selectedSubscription.id, 'cancel')}
                    disabled={processingId === selectedSubscription.id}
                    variant="destructive"
                    className="flex-1 shadow-lg"
                  >
                    {processingId === selectedSubscription.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}