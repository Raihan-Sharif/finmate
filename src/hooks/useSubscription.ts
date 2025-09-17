'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface SubscriptionStatus {
  current_plan: string
  status: string
  expires_at: string | null
  days_remaining: number | null
  can_upgrade: boolean
  pending_payment_id: string | null
}

export interface SubscriptionPlan {
  id: string
  plan_name: string
  display_name: string
  description: string
  price_monthly: number
  price_yearly: number
  features: string[]
  max_accounts: number
  max_family_members: number
  allowed_account_types: string[]
  is_popular: boolean
  is_active: boolean
  sort_order: number
}

export interface PaymentMethod {
  id: string
  method_name: string
  display_name: string
  description: string
  account_info: {
    number: string
    name: string
    type: string
  }
  instructions: string
  logo_url: string | null
  is_active: boolean
  sort_order: number
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch subscription status
  const fetchSubscriptionStatus = async () => {
    if (!user?.id) return

    try {
      // Get current user subscription
      const { data: userSub, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .single()

      if (subError && subError.code !== 'PGRST116') {
        throw subError
      }

      // Get pending payments
      const { data: pendingPayment, error: paymentError } = await supabase
        .from('subscription_payments')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'submitted'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (paymentError && paymentError.code !== 'PGRST116') {
        console.warn('Payment fetch error:', paymentError)
      }

      // Calculate subscription status
      const status: SubscriptionStatus = {
        current_plan: userSub?.plan_id ? 'premium' : 'free',
        status: userSub ? 'active' : 'inactive',
        expires_at: userSub?.end_date || null,
        days_remaining: userSub ? Math.ceil((new Date(userSub.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
        can_upgrade: !userSub,
        pending_payment_id: pendingPayment?.id || null
      }

      setSubscriptionStatus(status)
    } catch (error: any) {
      console.error('Error fetching subscription status:', error)
      setError(error.message || 'Failed to load subscription status')
    }
  }

  // Fetch subscription plans
  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error

      setSubscriptionPlans(data || [])
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error)
      setError(error.message || 'Failed to load subscription plans')
    }
  }

  // Fetch payment methods (hardcoded since table doesn't exist)
  const fetchPaymentMethods = async () => {
    try {
      // Since payment_methods table doesn't exist, provide default methods
      const defaultMethods: PaymentMethod[] = [
        {
          id: 'manual',
          method_name: 'manual',
          display_name: 'Manual Payment',
          description: 'Transfer money manually and provide transaction details',
          account_info: {
            number: 'Contact admin',
            name: 'FinMate Support',
            type: 'manual'
          },
          instructions: 'Please contact support for payment instructions',
          logo_url: null,
          is_active: true,
          sort_order: 1
        }
      ]

      setPaymentMethods(defaultMethods)
    } catch (error: any) {
      console.error('Error setting payment methods:', error)
      setError(error.message || 'Failed to load payment methods')
    }
  }

  // Submit payment for subscription upgrade
  const submitPayment = async (paymentData: {
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
  }) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: user.id,
          ...paymentData,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          currency: 'BDT'
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error: any) {
      console.error('Error submitting payment:', error)
      throw new Error(error.message || 'Failed to submit payment')
    }
  }

  // Validate and apply coupon
  const validateCoupon = async (couponData: {
    code: string
    plan_name: string
    billing_cycle: 'monthly' | 'yearly'
    base_amount: number
  }) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      // Check if coupon exists and is valid
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponData.code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        throw new Error('Invalid or expired coupon code')
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error('Coupon has expired')
      }

      // Check usage limits
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        throw new Error('Coupon usage limit reached')
      }

      // Check minimum amount
      if (coupon.minimum_amount && couponData.base_amount < coupon.minimum_amount) {
        throw new Error(`Minimum amount required: ৳${coupon.minimum_amount}`)
      }

      // Calculate discount
      let discountAmount = coupon.value
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount)
      }

      return {
        coupon_id: coupon.id,
        code: coupon.code,
        discount_amount: discountAmount,
        final_amount: Math.max(0, couponData.base_amount - discountAmount)
      }
    } catch (error: any) {
      console.error('Error validating coupon:', error)
      throw new Error(error.message || 'Failed to validate coupon')
    }
  }

  // Get user's payment history
  const fetchPaymentHistory = async () => {
    if (!user?.id) return []

    try {
      // Get payment data without joins first
      const { data: payments, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!payments || payments.length === 0) return []

      // Get related data separately
      const planIds = [...new Set(payments.map(p => p.plan_id).filter(Boolean))]
      const couponIds = [...new Set(payments.map(p => p.coupon_id).filter(Boolean))]

      const [plansData, couponsData] = await Promise.all([
        planIds.length > 0 ? supabase
          .from('subscription_plans')
          .select('id, display_name')
          .in('id', planIds) : Promise.resolve({ data: [] }),
        couponIds.length > 0 ? supabase
          .from('coupons')
          .select('id, code')
          .in('id', couponIds) : Promise.resolve({ data: [] })
      ])

      // Create lookup maps
      const plansMap = new Map(plansData.data?.map(p => [p.id, p]) || [])
      const couponsMap = new Map(couponsData.data?.map(c => [c.id, c]) || [])

      // Combine data
      return payments.map(payment => ({
        ...payment,
        plan: plansMap.get(payment.plan_id) || null,
        payment_method: { display_name: 'Manual Payment' },
        coupon: couponsMap.get(payment.coupon_id) || null
      }))
    } catch (error: any) {
      console.error('Error fetching payment history:', error)
      return []
    }
  }

  // Create family group (for Max plan) - simplified implementation
  const createFamilyGroup = async (familyName?: string) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      // For now, just return a success message since family features are not fully implemented
      return {
        success: true,
        message: 'Family group feature is coming soon',
        family_name: familyName || 'My Family'
      }
    } catch (error: any) {
      console.error('Error creating family group:', error)
      throw new Error(error.message || 'Failed to create family group')
    }
  }

  // Invite family member - simplified implementation
  const inviteFamilyMember = async (email: string, role: 'spouse' | 'child' | 'member' = 'member') => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      // For now, just return a success message since family features are not fully implemented
      return {
        success: true,
        message: 'Family invitation feature is coming soon',
        email,
        role
      }
    } catch (error: any) {
      console.error('Error inviting family member:', error)
      throw new Error(error.message || 'Failed to invite family member')
    }
  }

  // Get family members - simplified implementation
  const fetchFamilyMembers = async () => {
    if (!user?.id) return []

    try {
      // For now, return empty array since family features are not fully implemented
      return []
    } catch (error: any) {
      console.error('Error fetching family members:', error)
      return []
    }
  }

  // Initialize data
  const refreshSubscription = async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        fetchSubscriptionStatus(),
        fetchSubscriptionPlans(),
        fetchPaymentMethods()
      ])
    } catch (error: any) {
      setError(error.message || 'Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      refreshSubscription()
    }
  }, [user?.id])

  // Real-time subscription updates
  useEffect(() => {
    if (!user?.id) return

    const subscription = supabase
      .channel('subscription-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_payments',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchSubscriptionStatus()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  return {
    subscriptionStatus,
    subscriptionPlans,
    paymentMethods,
    loading,
    error,
    submitPayment,
    validateCoupon,
    fetchPaymentHistory,
    createFamilyGroup,
    inviteFamilyMember,
    fetchFamilyMembers,
    refreshSubscription
  }
}