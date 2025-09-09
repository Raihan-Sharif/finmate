'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface AdminPayment {
  id: string
  user_id: string
  plan_id: string
  payment_method_id: string
  billing_cycle: 'monthly' | 'yearly'
  transaction_id: string
  sender_number: string
  base_amount: number
  discount_amount: number
  final_amount: number
  coupon_id?: string
  notes?: string
  status: 'submitted' | 'verified' | 'approved' | 'rejected'
  admin_notes?: string
  rejection_reason?: string
  submitted_at: string
  verified_at?: string
  approved_at?: string
  rejected_at?: string
  verified_by?: string
  created_at: string
  updated_at: string
  user: {
    full_name: string
    email: string
  }
  plan: {
    display_name: string
    plan_name: string
  }
  payment_method: {
    display_name: string
    method_name: string
  }
  coupon?: {
    code: string
    type: string
    value: number
  }
}

export function useAdminSubscription() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  // Fetch payments for admin panel
  const fetchPayments = async (filters: {
    status?: string
    limit?: number
    offset?: number
  } = {}) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.offset) params.set('offset', filters.offset.toString())

      const response = await fetch(`/api/admin/subscription/payments?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch payments')
      }

      if (filters.offset && filters.offset > 0) {
        // Append for pagination
        setPayments(prev => [...prev, ...result.payments])
      } else {
        // Replace for new search/filter
        setPayments(result.payments)
      }
      
      setTotal(result.total)
      setHasMore(result.hasMore)

    } catch (error: any) {
      console.error('Error fetching payments:', error)
      setError(error.message || 'Failed to load payments')
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  // Update payment status (verify, approve, reject)
  const updatePaymentStatus = async (
    paymentId: string,
    status: 'verified' | 'approved' | 'rejected',
    adminNotes?: string,
    rejectionReason?: string
  ) => {
    try {
      const response = await fetch('/api/admin/subscription/payments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_id: paymentId,
          status,
          admin_notes: adminNotes,
          rejection_reason: rejectionReason
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update payment status')
      }

      // Update local state
      setPayments(prev => 
        prev.map(payment => 
          payment.id === paymentId 
            ? { ...payment, ...result.payment }
            : payment
        )
      )

      const statusText = status.charAt(0).toUpperCase() + status.slice(1)
      toast.success(`Payment ${statusText.toLowerCase()} successfully`)

      return result.payment

    } catch (error: any) {
      console.error('Error updating payment status:', error)
      toast.error(error.message || 'Failed to update payment status')
      throw error
    }
  }

  // Get payment statistics
  const getPaymentStats = () => {
    const stats = {
      total: payments.length,
      submitted: payments.filter(p => p.status === 'submitted').length,
      verified: payments.filter(p => p.status === 'verified').length,
      approved: payments.filter(p => p.status === 'approved').length,
      rejected: payments.filter(p => p.status === 'rejected').length,
      totalAmount: payments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.final_amount, 0)
    }

    return {
      ...stats,
      pendingReview: stats.submitted + stats.verified,
      approvalRate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0
    }
  }

  // Load more payments (pagination)
  const loadMore = async (status?: string) => {
    const filters: { limit: number; offset: number; status?: string } = {
      limit: 50,
      offset: payments.length
    }
    if (status) filters.status = status
    await fetchPayments(filters)
  }

  // Refresh payments
  const refreshPayments = async (status?: string) => {
    const filters: { limit: number; offset: number; status?: string } = {
      limit: 50,
      offset: 0
    }
    if (status) filters.status = status
    await fetchPayments(filters)
  }

  // Initial load
  useEffect(() => {
    if (user?.id) {
      refreshPayments()
    }
  }, [user?.id])

  return {
    payments,
    loading,
    error,
    hasMore,
    total,
    fetchPayments,
    updatePaymentStatus,
    getPaymentStats,
    loadMore,
    refreshPayments
  }
}