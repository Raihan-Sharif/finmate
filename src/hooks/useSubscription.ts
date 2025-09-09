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
      const { data, error } = await supabase
        .rpc('get_subscription_status', { p_user_id: user.id })

      if (error) throw error

      if (data && data.length > 0) {
        setSubscriptionStatus(data[0])
      }
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

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error

      setPaymentMethods(data || [])
    } catch (error: any) {
      console.error('Error fetching payment methods:', error)
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
      const { data, error } = await supabase
        .rpc('apply_coupon', {
          p_user_id: user.id,
          p_coupon_code: couponData.code,
          p_plan_name: couponData.plan_name,
          p_billing_cycle: couponData.billing_cycle,
          p_base_amount: couponData.base_amount
        })

      if (error) throw error

      return data && data.length > 0 ? data[0] : null
    } catch (error: any) {
      console.error('Error validating coupon:', error)
      throw new Error(error.message || 'Failed to validate coupon')
    }
  }

  // Get user's payment history
  const fetchPaymentHistory = async () => {
    if (!user?.id) return []

    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select(`
          *,
          plan:subscription_plans(display_name),
          payment_method:payment_methods(display_name),
          coupon:coupons(code)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching payment history:', error)
      return []
    }
  }

  // Create family group (for Max plan)
  const createFamilyGroup = async (familyName?: string) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .rpc('create_family_group', {
          p_user_id: user.id,
          p_family_name: familyName || 'My Family'
        })

      if (error) throw error

      return data
    } catch (error: any) {
      console.error('Error creating family group:', error)
      throw new Error(error.message || 'Failed to create family group')
    }
  }

  // Invite family member
  const inviteFamilyMember = async (email: string, role: 'spouse' | 'child' | 'member' = 'member') => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .rpc('invite_family_member', {
          p_inviter_id: user.id,
          p_email: email,
          p_role: role
        })

      if (error) throw error

      return data // Returns invitation code
    } catch (error: any) {
      console.error('Error inviting family member:', error)
      throw new Error(error.message || 'Failed to invite family member')
    }
  }

  // Get family members
  const fetchFamilyMembers = async () => {
    if (!user?.id) return []

    try {
      const { data, error } = await supabase
        .rpc('get_family_members', { p_user_id: user.id })

      if (error) throw error

      return data || []
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