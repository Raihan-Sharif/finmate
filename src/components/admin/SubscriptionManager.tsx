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
import { Switch } from '@/components/ui/switch'
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
  Plus,
  Edit,
  Trash2,
  Copy,
  Percent,
  User,
  Smartphone,
  FileText,
  Loader2,
  BarChart3,
  Crown,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { SubscriptionDebug } from './SubscriptionDebug'

// Types
interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  billing_cycle: 'monthly' | 'yearly'
  status: 'active' | 'cancelled' | 'suspended' | 'expired'
  start_date?: string
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
    features: any[]
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

interface PaymentRecord {
  id: string
  user_id: string
  plan: { display_name: string }
  payment_method: { display_name: string }
  coupon?: { code: string }
  billing_cycle: 'monthly' | 'yearly'
  base_amount: number
  discount_amount: number
  final_amount: number
  currency: string
  transaction_id: string
  sender_number: string
  payment_proof_url?: string
  status: 'pending' | 'submitted' | 'verified' | 'approved' | 'rejected' | 'expired'
  submitted_at?: string
  verified_at?: string
  approved_at?: string
  rejected_at?: string
  expired_at: string
  admin_notes?: string
  verified_by?: string
  profiles: {
    full_name: string
    email: string
  }
  created_at: string
  updated_at: string
}

interface Coupon {
  id: string
  code: string
  description: string
  type: 'percentage' | 'fixed'
  value: number
  max_uses?: number
  max_uses_per_user?: number
  used_count: number
  minimum_amount?: number
  max_discount_amount?: number
  expires_at?: string
  is_active: boolean
  scope: 'public' | 'private' | 'user_specific'
  allowed_users?: string[]
  created_at: string
  updated_at: string
}

interface SubscriptionStats {
  total_payments: number
  pending_payments: number
  approved_payments: number
  rejected_payments: number
  total_revenue: number
  monthly_revenue: number
  active_coupons: number
  total_coupons: number
  active_subscriptions: number
}

export function SubscriptionManager() {
  const t = useTranslations('common')
  const { user } = useAuth()
  
  // Data states
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Payment filters
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [paymentDateFilter, setPaymentDateFilter] = useState<string>('all')
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([])
  
  // Coupon states
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false)
  const [showEditCouponModal, setShowEditCouponModal] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)

  // Subscription filters
  const [subscriptionSearchQuery, setSubscriptionSearchQuery] = useState('')
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<string>('all')
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<UserSubscription[]>([])
  
  // Payment detail modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  
  // Coupon form data
  const [couponFormData, setCouponFormData] = useState({
    code: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    max_uses: '',
    max_uses_per_user: '',
    minimum_amount: '',
    max_discount_amount: '',
    expires_at: '',
    scope: 'public' as 'public' | 'private' | 'user_specific',
    is_active: true
  })

  // Load all data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  // Filter subscriptions when filters change
  useEffect(() => {
    filterSubscriptions()
  }, [subscriptions, subscriptionSearchQuery, subscriptionStatusFilter])

  // Filter payments when filters change
  useEffect(() => {
    filterPayments()
  }, [payments, paymentSearchQuery, paymentStatusFilter, paymentDateFilter])

  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchPayments(),
        fetchCoupons(),
        fetchSubscriptions(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error loading subscription data:', error)
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/subscription/payments')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch payments')
      }

      const transformedPayments = (result.payments || []).map((payment: any) => ({
        ...payment,
        plan: {
          name: payment.plan_name || payment.plan?.name || 'unknown',
          display_name: payment.plan_display_name || payment.plan?.display_name || 'Unknown Plan',
          price_monthly: payment.plan_price_monthly || payment.plan?.price_monthly || 0,
          price_yearly: payment.plan_price_yearly || payment.plan?.price_yearly || 0
        },
        payment_method: {
          name: payment.payment_method_name || payment.payment_method?.name || 'manual',
          display_name: payment.payment_method_display_name || payment.payment_method?.display_name || 'Manual Payment'
        },
        coupon: payment.coupon_code ? {
          code: payment.coupon_code,
          type: payment.coupon_type || 'percentage',
          value: payment.coupon_value || 0
        } : (payment.coupon || null),
        profiles: {
          full_name: payment.user_full_name || payment.profiles?.full_name || payment.user?.full_name || 'Unknown User',
          email: payment.user_email || payment.profiles?.email || payment.user?.email || 'unknown@example.com'
        }
      }))

      setPayments(transformedPayments)
    } catch (error: any) {
      console.error('Error fetching payments:', error)
      throw error
    }
  }

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch coupons')
      }

      setCoupons(result.coupons || [])
    } catch (error: any) {
      console.error('Error fetching coupons:', error)
      throw error
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscription/subscriptions')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch subscriptions')
      }

      setSubscriptions(result.subscriptions || [])
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error)
      throw error
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch overview data from API endpoint
      const response = await fetch('/api/admin/subscription/overview')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch overview data')
      }

      const overview = result.overview

      // Calculate additional stats from loaded data
      const totalPayments = payments.length
      const pendingPayments = payments.filter(p => ['pending', 'submitted', 'verified'].includes(p.status)).length
      const approvedPayments = payments.filter(p => p.status === 'approved').length
      const rejectedPayments = payments.filter(p => p.status === 'rejected').length

      const activeCoupons = coupons.filter(c => c.is_active).length

      setStats({
        total_payments: totalPayments || overview.pending_payments + overview.active_subscriptions,
        pending_payments: pendingPayments || overview.pending_payments,
        approved_payments: approvedPayments || overview.active_subscriptions,
        rejected_payments: rejectedPayments,
        total_revenue: overview.total_revenue || 0,
        monthly_revenue: overview.monthly_revenue || 0,
        active_coupons: activeCoupons || overview.active_coupons,
        total_coupons: coupons.length || overview.active_coupons,
        active_subscriptions: overview.active_subscriptions || approvedPayments
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Fallback to local calculation if API fails
      const totalPayments = payments.length
      const pendingPayments = payments.filter(p => ['pending', 'submitted', 'verified'].includes(p.status)).length
      const approvedPayments = payments.filter(p => p.status === 'approved').length
      const rejectedPayments = payments.filter(p => p.status === 'rejected').length

      const totalRevenue = payments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.final_amount, 0)

      const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const monthlyRevenue = payments
        .filter(p =>
          p.status === 'approved' &&
          new Date(p.approved_at!) >= thisMonthStart
        )
        .reduce((sum, p) => sum + p.final_amount, 0)

      const activeCoupons = coupons.filter(c => c.is_active).length

      setStats({
        total_payments: totalPayments,
        pending_payments: pendingPayments,
        approved_payments: approvedPayments,
        rejected_payments: rejectedPayments,
        total_revenue: totalRevenue,
        monthly_revenue: monthlyRevenue,
        active_coupons: activeCoupons,
        total_coupons: coupons.length,
        active_subscriptions: approvedPayments
      })
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]

    // Search filter
    if (paymentSearchQuery.trim()) {
      const query = paymentSearchQuery.toLowerCase()
      filtered = filtered.filter(payment =>
        payment.profiles.email.toLowerCase().includes(query) ||
        payment.profiles.full_name?.toLowerCase().includes(query) ||
        payment.transaction_id.toLowerCase().includes(query) ||
        payment.sender_number.includes(query)
      )
    }

    // Status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === paymentStatusFilter)
    }

    // Date filter
    if (paymentDateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (paymentDateFilter) {
        case 'today':
          filterDate.setDate(now.getDate())
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

      if (paymentDateFilter !== 'all') {
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
        subscription.plan.display_name?.toLowerCase().includes(query) ||
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
      await loadAllData() // Refresh all data
      setShowPaymentModal(false)
    } catch (error: any) {
      console.error('Error updating payment status:', error)
      toast.error(error.message || 'Failed to update payment')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCreateCoupon = async () => {
    try {
      setProcessingId('create-coupon')
      
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponFormData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create coupon')
      }

      toast.success('Coupon created successfully!')
      setShowCreateCouponModal(false)
      resetCouponForm()
      await loadAllData()
    } catch (error: any) {
      console.error('Error creating coupon:', error)
      toast.error(error.message || 'Failed to create coupon')
    } finally {
      setProcessingId(null)
    }
  }

  const handleEditCoupon = async () => {
    if (!selectedCoupon) return
    
    try {
      setProcessingId(selectedCoupon.id)
      
      const response = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_id: selectedCoupon.id,
          ...couponFormData
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update coupon')
      }

      toast.success('Coupon updated successfully!')
      setShowEditCouponModal(false)
      setSelectedCoupon(null)
      resetCouponForm()
      await loadAllData()
    } catch (error: any) {
      console.error('Error updating coupon:', error)
      toast.error(error.message || 'Failed to update coupon')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return

    try {
      setProcessingId(coupon.id)

      const response = await fetch(`/api/admin/coupons?id=${coupon.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete coupon')
      }

      toast.success('Coupon deleted successfully!')
      await loadAllData()
    } catch (error: any) {
      console.error('Error deleting coupon:', error)
      toast.error(error.message || 'Failed to delete coupon')
    } finally {
      setProcessingId(null)
    }
  }

  const handleSubscriptionAction = async (subscriptionId: string, action: 'activate' | 'suspend' | 'cancel' | 'extend', extendMonths?: number) => {
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
      await loadAllData() // Refresh all data
    } catch (error: any) {
      console.error('Error updating subscription:', error)
      toast.error(error.message || 'Failed to update subscription')
    } finally {
      setProcessingId(null)
    }
  }

  const resetCouponForm = () => {
    setCouponFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: 0,
      max_uses: '',
      max_uses_per_user: '',
      minimum_amount: '',
      max_discount_amount: '',
      expires_at: '',
      scope: 'public',
      is_active: true
    })
  }

  const openPaymentModal = (payment: PaymentRecord) => {
    setSelectedPayment(payment)
    setAdminNotes(payment.admin_notes || '')
    setShowPaymentModal(true)
  }

  const openEditCouponModal = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setCouponFormData({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      max_uses: coupon.max_uses?.toString() || '',
      max_uses_per_user: coupon.max_uses_per_user?.toString() || '',
      minimum_amount: coupon.minimum_amount?.toString() || '',
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      expires_at: coupon.expires_at ? format(new Date(coupon.expires_at), 'yyyy-MM-dd') : '',
      scope: coupon.scope || 'public',
      is_active: coupon.is_active
    })
    setShowEditCouponModal(true)
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

  const getCouponStatusColor = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
    
    if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    }
    
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
    }
    
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  }

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
            Subscription Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage payments, subscriptions, and coupons in one place
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Payments</span>
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex items-center space-x-2">
            <Gift className="h-4 w-4" />
            <span>Coupons</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>Subscriptions</span>
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Debug</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span className="text-sm font-medium">Total Revenue</span>
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      ৳{stats.total_revenue.toLocaleString()}
                    </div>
                    <div className="text-sm opacity-80 mt-1">
                      ৳{stats.monthly_revenue.toLocaleString()} this month
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Active Subscriptions</span>
                    </div>
                    <div className="text-2xl font-bold mt-2">{stats.active_subscriptions}</div>
                    <div className="text-sm opacity-80 mt-1">{stats.approved_payments} approved</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm font-medium">Pending Review</span>
                    </div>
                    <div className="text-2xl font-bold mt-2">{stats.pending_payments}</div>
                    <div className="text-sm opacity-80 mt-1">Needs attention</div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Gift className="h-5 w-5" />
                      <span className="text-sm font-medium">Active Coupons</span>
                    </div>
                    <div className="text-2xl font-bold mt-2">{stats.active_coupons}</div>
                    <div className="text-sm opacity-80 mt-1">{stats.total_coupons} total coupons</div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{payment.profiles.full_name}</p>
                        <p className="text-slate-500">৳{payment.final_amount}</p>
                      </div>
                      <Badge className={cn("text-xs", getStatusColor(payment.status))}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Top Performing Coupons</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coupons
                    .sort((a, b) => b.used_count - a.used_count)
                    .slice(0, 5)
                    .map((coupon) => (
                      <div key={coupon.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium font-mono">{coupon.code}</p>
                          <p className="text-slate-500">{coupon.description.substring(0, 30)}...</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{coupon.used_count}</p>
                          <p className="text-slate-500 text-xs">uses</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Payment Management</CardTitle>
                  <CardDescription>Review and process subscription payments</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
              
              {/* Payment Filters */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search payments..."
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
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
                
                <Select value={paymentDateFilter} onValueChange={setPaymentDateFilter}>
                  <SelectTrigger className="w-full sm:w-48">
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
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payments found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      onClick={() => openPaymentModal(payment)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {payment.profiles?.full_name?.[0] || payment.profiles?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {payment.profiles.full_name || payment.profiles.email}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {payment.plan.display_name}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>৳{payment.final_amount}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(payment.created_at), 'MMM dd, yyyy')}</span>
                            </span>
                            {payment.coupon && (
                              <span className="flex items-center space-x-1">
                                <Gift className="h-3 w-3" />
                                <span>{payment.coupon.code}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={cn("text-xs", getStatusColor(payment.status))}>
                          {payment.status}
                        </Badge>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openPaymentModal(payment)
                          }}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Coupon Management</h2>
              <p className="text-gray-600">Create and manage discount coupons</p>
            </div>
            <Button 
              onClick={() => setShowCreateCouponModal(true)} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </div>

          <div className="grid gap-4">
            <AnimatePresence>
              {coupons.map((coupon) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    !coupon.is_active && "opacity-60"
                  )}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            <Gift className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-lg font-mono">{coupon.code}</CardTitle>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(coupon.code)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <CardDescription>{coupon.description}</CardDescription>
                          </div>
                        </div>
                        <Badge className={getCouponStatusColor(coupon)}>
                          {!coupon.is_active 
                            ? 'Inactive' 
                            : coupon.expires_at && new Date(coupon.expires_at) <= new Date()
                            ? 'Expired'
                            : coupon.max_uses && coupon.used_count >= coupon.max_uses
                            ? 'Limit Reached'
                            : 'Active'
                          }
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <Label className="text-xs text-gray-500">Discount</Label>
                          <div className="flex items-center">
                            {coupon.type === 'percentage' ? (
                              <Percent className="h-3 w-3 mr-1" />
                            ) : (
                              <DollarSign className="h-3 w-3 mr-1" />
                            )}
                            <span className="font-semibold">
                              {coupon.type === 'percentage' ? `${coupon.value}%` : `৳${coupon.value}`}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-500">Usage</Label>
                          <div className="font-semibold">
                            {coupon.used_count}{coupon.max_uses && ` / ${coupon.max_uses}`}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-500">Min Amount</Label>
                          <div className="font-semibold">
                            {coupon.minimum_amount ? `৳${coupon.minimum_amount}` : 'None'}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-500">Max Discount</Label>
                          <div className="font-semibold">
                            {coupon.max_discount_amount ? `৳${coupon.max_discount_amount}` : 'Unlimited'}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-500">Expires</Label>
                          <div className="font-semibold text-xs">
                            {coupon.expires_at ? format(new Date(coupon.expires_at), 'MMM dd, yyyy') : 'Never'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditCouponModal(coupon)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCoupon(coupon)}
                          disabled={processingId === coupon.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {processingId === coupon.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {coupons.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No coupons found</h3>
                    <p className="text-gray-600">Create your first coupon to get started.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">User Subscriptions</h2>
              <p className="text-gray-600">Manage user subscriptions and access levels</p>
            </div>
          </div>

          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-5 w-5" />
                    <span>User Subscriptions</span>
                  </CardTitle>
                  <CardDescription>
                    View and manage all user subscriptions
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Subscription Filters */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search subscriptions..."
                    value={subscriptionSearchQuery}
                    onChange={(e) => setSubscriptionSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={subscriptionStatusFilter} onValueChange={setSubscriptionStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
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
              </div>
            </CardHeader>

            <CardContent>
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No subscriptions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubscriptions.map((subscription, index) => (
                    <motion.div
                      key={subscription.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                            subscription.status === 'active' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                            subscription.status === 'suspended' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                            'bg-gradient-to-br from-red-500 to-red-600'
                          )}>
                            {subscription.user?.full_name?.[0] || subscription.user?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {subscription.user.full_name || subscription.user.email}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {subscription.plan.display_name}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{subscription.billing_cycle}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{subscription.days_remaining} days left</span>
                            </span>
                            {subscription.payment && (
                              <span className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>৳{subscription.payment.final_amount}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge className={cn("text-xs", getStatusColor(subscription.status))}>
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </Badge>

                        <div className="flex space-x-1">
                          {subscription.status === 'active' ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSubscriptionAction(subscription.id, 'suspend')}
                                disabled={processingId === subscription.id}
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              >
                                {processingId === subscription.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Suspend'
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const months = parseInt(prompt('Extend by how many months?') || '0')
                                  if (months > 0) handleSubscriptionAction(subscription.id, 'extend', months)
                                }}
                                disabled={processingId === subscription.id}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                Extend
                              </Button>
                            </>
                          ) : subscription.status === 'suspended' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSubscriptionAction(subscription.id, 'activate')}
                              disabled={processingId === subscription.id}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {processingId === subscription.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Activate'
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSubscriptionAction(subscription.id, 'activate')}
                              disabled={processingId === subscription.id}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {processingId === subscription.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Reactivate'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debug Tab */}
        <TabsContent value="debug" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">System Debug</h2>
              <p className="text-gray-600">Debug subscription system and create sample data</p>
            </div>
          </div>

          <SubscriptionDebug />
        </TabsContent>
      </Tabs>

      {/* Payment Detail Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment Details</span>
            </DialogTitle>
            <DialogDescription>
              Review and process this payment request
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Customer
                    </Label>
                    <p className="text-sm font-medium">
                      {selectedPayment.profiles.full_name || selectedPayment.profiles.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedPayment.profiles.email}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Plan
                    </Label>
                    <p className="text-sm font-medium">
                      {selectedPayment.plan.display_name} - {selectedPayment.billing_cycle}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Payment Method
                    </Label>
                    <p className="text-sm font-medium">
                      {selectedPayment.payment_method.display_name}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </Label>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Base Amount</span>
                        <span>৳{selectedPayment.base_amount}</span>
                      </div>
                      {selectedPayment.discount_amount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount ({selectedPayment.coupon?.code})</span>
                          <span>-৳{selectedPayment.discount_amount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Total</span>
                        <span>৳{selectedPayment.final_amount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold mb-3">Transaction Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">Transaction ID</Label>
                    <p className="font-mono">{selectedPayment.transaction_id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">Sender Number</Label>
                    <p className="font-mono">{selectedPayment.sender_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">Submitted At</Label>
                    <p>{selectedPayment.submitted_at ? format(new Date(selectedPayment.submitted_at), 'PPpp') : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">Status</Label>
                    <Badge className={cn("text-xs", getStatusColor(selectedPayment.status))}>
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this payment..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              {selectedPayment.status !== 'approved' && selectedPayment.status !== 'rejected' && (
                <div className="flex space-x-2">
                  {selectedPayment.status === 'submitted' && (
                    <Button
                      onClick={() => updatePaymentStatus(selectedPayment.id, 'verified', adminNotes)}
                      disabled={processingId === selectedPayment.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processingId === selectedPayment.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => updatePaymentStatus(selectedPayment.id, 'rejected', adminNotes)}
                    disabled={processingId === selectedPayment.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processingId === selectedPayment.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Coupon Modal */}
      <Dialog open={showCreateCouponModal || showEditCouponModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateCouponModal(false)
          setShowEditCouponModal(false)
          setSelectedCoupon(null)
          resetCouponForm()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showCreateCouponModal ? 'Create New Coupon' : 'Edit Coupon'}
            </DialogTitle>
            <DialogDescription>
              {showCreateCouponModal 
                ? 'Create a new discount coupon for subscriptions.' 
                : 'Update the coupon details.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                placeholder="SAVE20"
                value={couponFormData.code}
                onChange={(e) => setCouponFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                disabled={showEditCouponModal} // Don't allow editing code
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Discount Type *</Label>
              <Select 
                value={couponFormData.type} 
                onValueChange={(value: 'percentage' | 'fixed') => 
                  setCouponFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">
                {couponFormData.type === 'percentage' ? 'Percentage Value *' : 'Fixed Amount (৳) *'}
              </Label>
              <Input
                id="value"
                type="number"
                min="0"
                max={couponFormData.type === 'percentage' ? '100' : undefined}
                placeholder={couponFormData.type === 'percentage' ? '20' : '50'}
                value={couponFormData.value}
                onChange={(e) => setCouponFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_uses">Maximum Uses</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                placeholder="100"
                value={couponFormData.max_uses}
                onChange={(e) => setCouponFormData(prev => ({ ...prev, max_uses: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_uses_per_user">Max Uses Per User</Label>
              <Input
                id="max_uses_per_user"
                type="number"
                min="1"
                placeholder="1"
                value={couponFormData.max_uses_per_user}
                onChange={(e) => setCouponFormData(prev => ({ ...prev, max_uses_per_user: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimum_amount">Minimum Amount (৳)</Label>
              <Input
                id="minimum_amount"
                type="number"
                min="0"
                placeholder="100"
                value={couponFormData.minimum_amount}
                onChange={(e) => setCouponFormData(prev => ({ ...prev, minimum_amount: e.target.value }))}
              />
            </div>
            
            {couponFormData.type === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="max_discount_amount">Max Discount Amount (৳)</Label>
                <Input
                  id="max_discount_amount"
                  type="number"
                  min="0"
                  placeholder="500"
                  value={couponFormData.max_discount_amount}
                  onChange={(e) => setCouponFormData(prev => ({ ...prev, max_discount_amount: e.target.value }))}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiry Date</Label>
              <Input
                id="expires_at"
                type="date"
                value={couponFormData.expires_at}
                onChange={(e) => setCouponFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Get 20% off on any subscription plan"
                value={couponFormData.description}
                onChange={(e) => setCouponFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2 flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={couponFormData.is_active}
                onCheckedChange={(checked) => setCouponFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active (users can use this coupon)</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateCouponModal(false)
                setShowEditCouponModal(false)
                resetCouponForm()
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={showCreateCouponModal ? handleCreateCoupon : handleEditCoupon}
              disabled={processingId === 'create-coupon' || processingId === selectedCoupon?.id}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {processingId === 'create-coupon' || processingId === selectedCoupon?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {showCreateCouponModal ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  {showCreateCouponModal ? 'Create Coupon' : 'Update Coupon'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}