'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search,
  Filter,
  Download,
  User,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  FileText,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

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

export function SubscriptionPaymentsAdmin() {
  const t = useTranslations('admin.subscription')
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([])
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/subscription/payments')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch payments')
      }

      // Transform the data to match expected format
      const transformedPayments = (result.payments || []).map((payment: any) => ({
        ...payment,
        plan: payment.plan || { display_name: 'Unknown Plan' },
        payment_method: payment.payment_method || { display_name: 'Unknown Method' },
        coupon: payment.coupon || null,
        profiles: payment.user || { full_name: 'Unknown User', email: 'unknown@example.com' }
      }))

      setPayments(transformedPayments)
      setFilteredPayments(transformedPayments)
    } catch (error: any) {
      console.error('Error fetching payments:', error)
      toast.error(error.message || t('fetchError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  // Filter and search logic
  useEffect(() => {
    let filtered = [...payments]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(payment =>
        payment.profiles.email.toLowerCase().includes(query) ||
        payment.profiles.full_name?.toLowerCase().includes(query) ||
        payment.transaction_id.toLowerCase().includes(query) ||
        payment.sender_number.includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
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

      if (dateFilter !== 'all') {
        filtered = filtered.filter(payment => 
          new Date(payment.created_at) >= filterDate
        )
      }
    }

    setFilteredPayments(filtered)
  }, [payments, searchQuery, statusFilter, dateFilter])

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

      toast.success(t('statusUpdated'))
      fetchPayments() // Refresh the list
      setShowDetailModal(false)
    } catch (error: any) {
      console.error('Error updating payment status:', error)
      toast.error(error.message || t('updateError'))
    } finally {
      setProcessingId(null)
    }
  }

  const openDetailModal = (payment: PaymentRecord) => {
    setSelectedPayment(payment)
    setAdminNotes(payment.admin_notes || '')
    setShowDetailModal(true)
  }

  const getStats = () => {
    const pending = payments.filter(p => p.status === 'pending' || p.status === 'submitted').length
    const verified = payments.filter(p => p.status === 'verified').length
    const approved = payments.filter(p => p.status === 'approved').length
    const rejected = payments.filter(p => p.status === 'rejected').length
    
    return { pending, verified, approved, rejected }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl animate-pulse">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('pendingReview')}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('verified')}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {stats.verified}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('approved')}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {stats.approved}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('rejected')}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {stats.rejected}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="shadow-lg border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{t('paymentRequests')}</CardTitle>
                <CardDescription>
                  {t('managePaymentRequests')}
                </CardDescription>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  {t('export')}
                </Button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t('searchPayments')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="submitted">{t('submitted')}</SelectItem>
                  <SelectItem value="verified">{t('verified')}</SelectItem>
                  <SelectItem value="approved">{t('approved')}</SelectItem>
                  <SelectItem value="rejected">{t('rejected')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('filterByDate')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTime')}</SelectItem>
                  <SelectItem value="today">{t('today')}</SelectItem>
                  <SelectItem value="week">{t('thisWeek')}</SelectItem>
                  <SelectItem value="month">{t('thisMonth')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noPayments')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                            <CreditCard className="h-3 w-3" />
                            <span>{payment.payment_method.display_name}</span>
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
                      <Badge className={cn("text-xs", getStatusColor(payment.status))}>
                        {t(payment.status)}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(payment)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>{t('view')}</span>
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
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>{t('paymentDetails')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('reviewAndProcessPayment')}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('customer')}
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
                      {t('plan')}
                    </Label>
                    <p className="text-sm font-medium">
                      {selectedPayment.plan.display_name} - {selectedPayment.billing_cycle}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('paymentMethod')}
                    </Label>
                    <p className="text-sm font-medium">
                      {selectedPayment.payment_method.display_name}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('amount')}
                    </Label>
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
                </div>
              </div>

              {/* Transaction Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold mb-3">{t('transactionDetails')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">{t('transactionId')}</Label>
                    <p className="font-mono">{selectedPayment.transaction_id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">{t('senderNumber')}</Label>
                    <p className="font-mono">{selectedPayment.sender_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">{t('submittedAt')}</Label>
                    <p>{selectedPayment.submitted_at ? format(new Date(selectedPayment.submitted_at), 'PPpp') : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400">{t('status')}</Label>
                    <Badge className={cn("text-xs", getStatusColor(selectedPayment.status))}>
                      {t(selectedPayment.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="admin-notes">{t('adminNotes')}</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={t('addNotesPlaceholder')}
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
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          {t('processing')}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('markAsVerified')}
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
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          {t('processing')}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('approve')}
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
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        {t('processing')}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('reject')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}