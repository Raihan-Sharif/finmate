/**
 * 🎯 SUBSCRIPTION ADMIN MANAGEMENT SERVICE
 * Comprehensive service for admin subscription management
 * Supports payment processing, user management, analytics, and more
 */

import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database_professional';

// Types for subscription management
export interface SubscriptionPayment {
  id: string;
  user_id: string;
  plan_id: string;
  payment_method_id: string;
  billing_cycle: 'monthly' | 'yearly';
  transaction_id: string;
  sender_number: string;
  base_amount: number;
  discount_amount: number;
  final_amount: number;
  coupon_id?: string;
  status: 'pending' | 'submitted' | 'verified' | 'approved' | 'rejected' | 'expired';
  admin_notes?: string;
  rejection_reason?: string;
  submitted_at?: string;
  verified_at?: string;
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
  currency: string;
  user_full_name: string;
  user_email: string;
  plan_name: string;
  plan_display_name: string;
  plan_price_monthly: number;
  plan_price_yearly: number;
  payment_method_name: string;
  payment_method_display_name: string;
  coupon_code?: string;
  coupon_type?: string;
  coupon_value?: number;
  user_phone: string;
  days_since_submission?: number;
  subscription_status: string;
}

export interface SubscriptionAnalytics {
  total_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
  pending_payments: number;
  approved_payments_today: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  plan_stats: Array<{
    plan_name: string;
    plan_id: string;
    total_revenue: number;
    subscriber_count: number;
    avg_revenue_per_user: number;
  }>;
  monthly_growth: {
    current_month: number;
    previous_month: number;
    growth_percentage: number;
  };
}

export interface PaymentStatusUpdate {
  success: boolean;
  message: string;
  payment_id?: string;
  new_status?: string;
  user_id?: string;
}

export interface SubscriptionManagement {
  success: boolean;
  message: string;
  subscription_status?: string;
  end_date?: string;
}

export interface PaymentsResponse {
  payments: SubscriptionPayment[];
  total: number;
  hasMore: boolean;
}

/**
 * 🎯 Get subscription payments with advanced filtering
 */
export async function getSubscriptionPayments(
  adminUserId: string,
  options: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<PaymentsResponse> {
  try {
    const { status = 'all', search, limit = 50, offset = 0 } = options;

    // Get payments
    const { data: payments, error: paymentsError } = await supabase.rpc(
      'admin_get_subscription_payments',
      {
        p_admin_user_id: adminUserId,
        p_status: status,
        p_search: search || null,
        p_limit: limit,
        p_offset: offset,
      }
    );

    if (paymentsError) {
      console.error('Error fetching subscription payments:', paymentsError);
      throw paymentsError;
    }

    // Get total count
    const { data: total, error: countError } = await supabase.rpc(
      'admin_get_subscription_payments_count',
      {
        p_admin_user_id: adminUserId,
        p_status: status,
        p_search: search || null,
      }
    );

    if (countError) {
      console.error('Error fetching payments count:', countError);
      throw countError;
    }

    return {
      payments: payments || [],
      total: total || 0,
      hasMore: (offset + limit) < (total || 0),
    };
  } catch (error) {
    console.error('Error in getSubscriptionPayments:', error);
    throw error;
  }
}

/**
 * 🎯 Update payment status with automatic subscription management
 */
export async function updatePaymentStatus(
  adminUserId: string,
  paymentId: string,
  status: string,
  options: {
    adminNotes?: string;
    rejectionReason?: string;
  } = {}
): Promise<PaymentStatusUpdate> {
  try {
    const { adminNotes, rejectionReason } = options;

    const { data, error } = await supabase.rpc('admin_update_payment_status', {
      p_admin_user_id: adminUserId,
      p_payment_id: paymentId,
      p_status: status,
      p_admin_notes: adminNotes || null,
      p_rejection_reason: rejectionReason || null,
    });

    if (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }

    return data?.[0] || { success: false, message: 'Unknown error occurred' };
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    throw error;
  }
}

/**
 * 🎯 Get comprehensive subscription analytics
 */
export async function getSubscriptionAnalytics(
  adminUserId: string
): Promise<SubscriptionAnalytics> {
  try {
    const { data, error } = await supabase.rpc('admin_get_subscription_analytics', {
      p_admin_user_id: adminUserId,
    });

    if (error) {
      console.error('Error fetching subscription analytics:', error);
      throw error;
    }

    return data?.[0] || {
      total_revenue: 0,
      monthly_revenue: 0,
      yearly_revenue: 0,
      pending_payments: 0,
      approved_payments_today: 0,
      active_subscriptions: 0,
      expired_subscriptions: 0,
      plan_stats: [],
      monthly_growth: {
        current_month: 0,
        previous_month: 0,
        growth_percentage: 0,
      },
    };
  } catch (error) {
    console.error('Error in getSubscriptionAnalytics:', error);
    throw error;
  }
}

/**
 * 🎯 Manage user subscription (activate, suspend, cancel, extend)
 */
export async function manageUserSubscription(
  adminUserId: string,
  userId: string,
  action: 'activate' | 'suspend' | 'cancel' | 'extend',
  options: {
    planId?: string;
    extendMonths?: number;
  } = {}
): Promise<SubscriptionManagement> {
  try {
    const { planId, extendMonths } = options;

    const { data, error } = await supabase.rpc('admin_manage_user_subscription', {
      p_admin_user_id: adminUserId,
      p_user_id: userId,
      p_action: action,
      p_plan_id: planId || null,
      p_extend_months: extendMonths || null,
    });

    if (error) {
      console.error('Error managing user subscription:', error);
      throw error;
    }

    return data?.[0] || { success: false, message: 'Unknown error occurred' };
  } catch (error) {
    console.error('Error in manageUserSubscription:', error);
    throw error;
  }
}

/**
 * 🎯 Get subscription plans
 */
export async function getSubscriptionPlans() {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSubscriptionPlans:', error);
    throw error;
  }
}

/**
 * 🎯 Get payment methods
 */
export async function getPaymentMethods() {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPaymentMethods:', error);
    throw error;
  }
}

/**
 * 🎯 Get payment status options
 */
export function getPaymentStatusOptions() {
  return [
    { value: 'all', label: 'All Payments', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'submitted', label: 'Submitted', color: 'blue' },
    { value: 'verified', label: 'Verified', color: 'purple' },
    { value: 'approved', label: 'Approved', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'expired', label: 'Expired', color: 'gray' },
  ];
}

/**
 * 🎯 Format currency
 */
export function formatCurrency(amount: number, currency: string = 'BDT'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'BDT' ? 'USD' : currency, // Fallback for BDT
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 🎯 Get status color for UI
 */
export function getStatusColor(status: string): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    submitted: 'bg-blue-100 text-blue-800 border-blue-200',
    verified: 'bg-purple-100 text-purple-800 border-purple-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    expired: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return colors[status as keyof typeof colors] || colors.pending;
}

/**
 * 🎯 Calculate discount percentage
 */
export function calculateDiscountPercentage(baseAmount: number, discountAmount: number): number {
  if (baseAmount === 0) return 0;
  return Math.round((discountAmount / baseAmount) * 100);
}