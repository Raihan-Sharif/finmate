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
  payment_method_id?: string;
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
  verified_by?: string;
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
  days_since_submission?: number | null;
  subscription_status: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id?: string;
  billing_cycle?: 'monthly' | 'yearly';
  payment_id?: string;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  end_date: string;
  created_at: string;
  updated_at: string;
  user_data?: {
    full_name: string;
    email: string;
    phone_number?: string;
  };
  plan_data?: {
    plan_name: string;
    display_name: string;
    price_monthly: number;
    price_yearly: number;
    features: any[];
  };
  payment_data?: {
    transaction_id: string;
    final_amount: number;
    payment_date: string;
    payment_status: string;
  };
  days_remaining?: number;
  is_expired?: boolean;
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
 * 🎯 Get subscription payments with advanced filtering using direct SQL
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

    // Verify admin permissions first
    const { data: profile, error: profileError } = await supabase.rpc('get_user_profile', { p_user_id: adminUserId });
    if (profileError || !profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      throw new Error('Insufficient permissions');
    }

    // Direct query to subscription_payments
    let query = supabase
      .from('subscription_payments')
      .select(`
        id,
        user_id,
        plan_id,
        payment_method_id,
        billing_cycle,
        transaction_id,
        sender_number,
        base_amount,
        discount_amount,
        final_amount,
        coupon_id,
        status,
        admin_notes,
        rejection_reason,
        submitted_at,
        verified_at,
        approved_at,
        rejected_at,
        verified_by,
        currency,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: paymentsData, error: paymentsError } = await query;

    if (paymentsError) {
      console.error('Error fetching subscription payments:', paymentsError);
      throw paymentsError;
    }

    if (!paymentsData || paymentsData.length === 0) {
      console.log('No payment data found, returning empty result');
      return {
        payments: [],
        total: 0,
        hasMore: false,
      };
    }

    // Get related data separately
    const userIds = [...new Set(paymentsData.map(p => p.user_id))];
    const planIds = [...new Set(paymentsData.map(p => p.plan_id).filter(Boolean))];
    const methodIds = [...new Set(paymentsData.map(p => p.payment_method_id).filter(Boolean))];
    const couponIds = [...new Set(paymentsData.map(p => p.coupon_id).filter(Boolean))];

    // Fetch user data
    const { data: usersData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone_number')
      .in('user_id', userIds);

    // Fetch plan data
    let plansData: any[] = [];
    if (planIds.length > 0) {
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, plan_name, display_name, price_monthly, price_yearly')
        .in('id', planIds);
      plansData = plans || [];
    }

    // Fetch payment method data
    let methodsData: any[] = [];
    if (methodIds.length > 0) {
      const { data: methods } = await supabase
        .from('payment_methods')
        .select('id, method_name, display_name')
        .in('id', methodIds);
      methodsData = methods || [];
    }

    // Fetch coupon data
    let couponsData: any[] = [];
    if (couponIds.length > 0) {
      const { data: coupons } = await supabase
        .from('coupons')
        .select('id, code, type, value')
        .in('id', couponIds);
      couponsData = coupons || [];
    }

    // Create lookup maps
    const userMap = new Map(usersData?.map(u => [u.user_id, u]) || []);
    const planMap = new Map(plansData.map(p => [p.id, p]));
    const methodMap = new Map(methodsData.map(m => [m.id, m]));
    const couponMap = new Map(couponsData.map(c => [c.id, c]));

    // Transform payments data
    let transformedPayments: SubscriptionPayment[] = paymentsData.map(payment => {
      const user = userMap.get(payment.user_id) || { full_name: '', email: '', phone_number: '' };
      const plan = planMap.get(payment.plan_id) || { plan_name: '', display_name: '', price_monthly: 0, price_yearly: 0 };
      const method = methodMap.get(payment.payment_method_id) || { method_name: '', display_name: '' };
      const coupon = couponMap.get(payment.coupon_id);

      return {
        ...payment,
        user_full_name: user.full_name || 'Unknown User',
        user_email: user.email || 'unknown@example.com',
        user_phone: user.phone_number || payment.sender_number || '',
        plan_name: plan.plan_name || 'unknown',
        plan_display_name: plan.display_name || 'Unknown Plan',
        plan_price_monthly: plan.price_monthly || 0,
        plan_price_yearly: plan.price_yearly || 0,
        payment_method_name: method.method_name || 'manual',
        payment_method_display_name: method.display_name || 'Manual Payment',
        coupon_code: coupon?.code,
        coupon_type: coupon?.type,
        coupon_value: coupon?.value,
        days_since_submission: payment.submitted_at ?
          Math.floor((new Date().getTime() - new Date(payment.submitted_at).getTime()) / (1000 * 60 * 60 * 24)) : null,
        subscription_status: 'active' // Default
      } as SubscriptionPayment;
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      transformedPayments = transformedPayments.filter(payment =>
        payment.user_full_name.toLowerCase().includes(searchLower) ||
        payment.user_email.toLowerCase().includes(searchLower) ||
        payment.transaction_id.toLowerCase().includes(searchLower) ||
        payment.sender_number.includes(search) ||
        payment.plan_display_name.toLowerCase().includes(searchLower)
      );
    }

    // Get total count
    let countQuery = supabase
      .from('subscription_payments')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: totalCount } = await countQuery;

    return {
      payments: transformedPayments,
      total: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0),
    };
  } catch (error) {
    console.error('Error in getSubscriptionPayments:', error);
    throw error;
  }
}

/**
 * 🎯 Update payment status with automatic subscription management using direct SQL
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

    // Verify admin permissions
    const { data: profile, error: profileError } = await supabase.rpc('get_user_profile', { p_user_id: adminUserId });
    if (profileError || !profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      throw new Error('Insufficient permissions');
    }

    // Validate status
    const validStatuses = ['pending', 'submitted', 'verified', 'approved', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status provided');
    }

    // Build update object
    const updateData: any = {
      status: status as any,
      updated_at: new Date().toISOString()
    };

    // Set timestamp fields based on status
    switch (status) {
      case 'verified':
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = adminUserId;
        break;
      case 'approved':
        updateData.approved_at = new Date().toISOString();
        updateData.verified_by = adminUserId;
        break;
      case 'rejected':
        updateData.rejected_at = new Date().toISOString();
        updateData.verified_by = adminUserId;
        if (rejectionReason) {
          updateData.rejection_reason = rejectionReason;
        }
        break;
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    // Update the payment record
    const { data: updatedPayment, error: updateError } = await supabase
      .from('subscription_payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment:', updateError);
      throw updateError;
    }

    // If payment is approved, create/upgrade user subscription
    if (status === 'approved' && updatedPayment) {
      try {
        // Get payment and plan data
        const { data: paymentData, error: paymentError } = await supabase
          .from('subscription_payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (paymentError) {
          throw new Error(`Failed to fetch payment data: ${paymentError.message}`);
        }

        if (!paymentData?.plan_id) {
          throw new Error('Payment data or plan_id is missing');
        }

        // Get plan data separately
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', paymentData.plan_id)
          .single();

        if (planError) {
          console.error('Could not fetch plan data:', planError);
        }

        const planName = planData?.plan_name || 'unknown';

        // Calculate end date
        const endDate = new Date();
        if (paymentData.billing_cycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Create/update user subscription
        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: paymentData.user_id,
            plan_id: paymentData.plan_id,
            billing_cycle: paymentData.billing_cycle,
            payment_id: paymentId,
            status: 'active',
            end_date: endDate.toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (subscriptionError) {
          throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
        }

        // Add to subscription history
        const { error: historyError } = await supabase
          .from('subscription_history')
          .insert({
            user_id: paymentData.user_id,
            plan_id: paymentData.plan_id,
            plan_name: planName || 'unknown',
            action_type: 'subscription_activated',
            amount_paid: paymentData.final_amount,
            payment_id: paymentId,
            effective_date: new Date().toISOString(),
          });

        if (historyError) {
          console.error('Failed to add subscription history:', historyError);
          // Don't fail the operation for history logging issues
        }

        console.log('Subscription created successfully for payment:', paymentId);
      } catch (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        // Don't fail the payment update, just log the error
      }
    }

    return {
      success: true,
      message: 'Payment status updated successfully',
      payment_id: paymentId,
      new_status: status,
      user_id: updatedPayment.user_id
    };
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    throw error;
  }
}

/**
 * 🎯 Get comprehensive subscription analytics using direct SQL
 */
export async function getSubscriptionAnalytics(
  adminUserId: string
): Promise<SubscriptionAnalytics> {
  try {
    // Verify admin permissions
    const { data: profile, error: profileError } = await supabase.rpc('get_user_profile', { p_user_id: adminUserId });
    if (profileError || !profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      throw new Error('Insufficient permissions');
    }

    // Get total revenue from approved payments
    const { data: revenueData } = await supabase
      .from('subscription_payments')
      .select('final_amount, created_at, billing_cycle')
      .eq('status', 'approved');

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.final_amount, 0) || 0;

    // Calculate monthly and yearly revenue
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyRevenue = revenueData?.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    }).reduce((sum, payment) => sum + payment.final_amount, 0) || 0;

    const yearlyRevenue = revenueData?.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate.getFullYear() === currentYear;
    }).reduce((sum, payment) => sum + payment.final_amount, 0) || 0;

    // Get pending payments count
    const { count: pendingPayments } = await supabase
      .from('subscription_payments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'submitted', 'verified']);

    // Get today's approved payments
    const today = new Date().toISOString().split('T')[0];
    const { count: approvedToday } = await supabase
      .from('subscription_payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('approved_at', `${today}T00:00:00.000Z`)
      .lt('approved_at', `${today}T23:59:59.999Z`);

    // Get active subscriptions count
    const { count: activeSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString());

    // Get expired subscriptions count
    const { count: expiredSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .or('status.eq.expired,end_date.lt.' + new Date().toISOString());

    // Get plan statistics
    const { data: planStatsData } = await supabase
      .from('subscription_payments')
      .select(`
        plan_id,
        final_amount,
        subscription_plans!inner(
          id,
          plan_name,
          display_name
        )
      `)
      .eq('status', 'approved');

    const planStatsMap = new Map();
    planStatsData?.forEach((payment: any) => {
      const planId = payment.plan_id;
      const planName = payment.subscription_plans?.plan_name || 'Unknown';

      if (!planStatsMap.has(planId)) {
        planStatsMap.set(planId, {
          plan_id: planId,
          plan_name: planName,
          total_revenue: 0,
          subscriber_count: 0,
          avg_revenue_per_user: 0
        });
      }

      const stats = planStatsMap.get(planId);
      stats.total_revenue += payment.final_amount;
      stats.subscriber_count += 1;
    });

    const planStats = Array.from(planStatsMap.values()).map(stats => ({
      ...stats,
      avg_revenue_per_user: stats.subscriber_count > 0 ? stats.total_revenue / stats.subscriber_count : 0
    }));

    // Calculate monthly growth
    const lastMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);

    const lastMonthRevenue = revenueData?.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate >= lastMonth && paymentDate <= lastMonthEnd;
    }).reduce((sum, payment) => sum + payment.final_amount, 0) || 0;

    const growthPercentage = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    return {
      total_revenue: totalRevenue,
      monthly_revenue: monthlyRevenue,
      yearly_revenue: yearlyRevenue,
      pending_payments: pendingPayments || 0,
      approved_payments_today: approvedToday || 0,
      active_subscriptions: activeSubscriptions || 0,
      expired_subscriptions: expiredSubscriptions || 0,
      plan_stats: planStats,
      monthly_growth: {
        current_month: monthlyRevenue,
        previous_month: lastMonthRevenue,
        growth_percentage: Math.round(growthPercentage * 100) / 100,
      },
    };
  } catch (error) {
    console.error('Error in getSubscriptionAnalytics:', error);
    throw error;
  }
}

/**
 * 🎯 Get user subscriptions with filtering using direct SQL
 */
export async function getUserSubscriptions(
  adminUserId: string,
  options: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ subscriptions: UserSubscription[]; total: number; hasMore: boolean }> {
  try {
    const { status = 'all', search, limit = 50, offset = 0 } = options;

    // Verify admin permissions
    const { data: profile, error: profileError } = await supabase.rpc('get_user_profile', { p_user_id: adminUserId });
    if (profileError || !profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      throw new Error('Insufficient permissions');
    }

    // Build subscription query
    let query = supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: subscriptions, error: subscriptionsError } = await query;

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      throw subscriptionsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscription data found, returning empty result');
      return {
        subscriptions: [],
        total: 0,
        hasMore: false,
      };
    }

    // Get related data
    const userIds = [...new Set(subscriptions.map(s => s.user_id))];
    const planIds = [...new Set(subscriptions.map(s => s.plan_id).filter(Boolean))];
    const paymentIds = subscriptions.filter(s => s.payment_id).map(s => s.payment_id);

    // Fetch user data
    const { data: usersData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone_number')
      .in('user_id', userIds);

    // Fetch plan data
    let plansData: any[] = [];
    if (planIds.length > 0) {
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('id, plan_name, display_name, price_monthly, price_yearly, features')
        .in('id', planIds);
      plansData = plans || [];
    }

    // Fetch payment data
    let paymentsData: any[] = [];
    if (paymentIds.length > 0) {
      const { data: payments } = await supabase
        .from('subscription_payments')
        .select('id, transaction_id, final_amount, created_at, status')
        .in('id', paymentIds);
      paymentsData = payments || [];
    }

    // Create lookup maps
    const userMap = new Map(usersData?.map(u => [u.user_id, u]) || []);
    const planMap = new Map(plansData.map(p => [p.id, p]));
    const paymentMap = new Map(paymentsData.map(p => [p.id, p]));

    // Transform subscriptions data
    let transformedSubscriptions: UserSubscription[] = subscriptions.map(subscription => {
      const user = userMap.get(subscription.user_id) || { full_name: '', email: '', phone_number: '' };
      const plan = planMap.get(subscription.plan_id) || { plan_name: '', display_name: '', price_monthly: 0, price_yearly: 0, features: [] };
      const payment = subscription.payment_id ? paymentMap.get(subscription.payment_id) : null;

      const daysRemaining = subscription.end_date ?
        Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
      const isExpired = subscription.end_date ? new Date(subscription.end_date) < new Date() : false;

      return {
        ...subscription,
        user_data: {
          full_name: user.full_name || 'Unknown User',
          email: user.email || 'unknown@example.com',
          phone_number: user.phone_number
        },
        plan_data: {
          plan_name: plan.plan_name || 'unknown',
          display_name: plan.display_name || 'Unknown Plan',
          price_monthly: plan.price_monthly || 0,
          price_yearly: plan.price_yearly || 0,
          features: plan.features || []
        },
        payment_data: payment ? {
          transaction_id: payment.transaction_id,
          final_amount: payment.final_amount,
          payment_date: payment.created_at,
          payment_status: payment.status
        } : null,
        days_remaining: daysRemaining,
        is_expired: isExpired
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      transformedSubscriptions = transformedSubscriptions.filter(sub =>
        sub.user_data?.full_name?.toLowerCase().includes(searchLower) ||
        sub.user_data?.email?.toLowerCase().includes(searchLower) ||
        sub.user_data?.phone_number?.includes(search) ||
        sub.plan_data?.display_name?.toLowerCase().includes(searchLower) ||
        sub.payment_data?.transaction_id?.toLowerCase().includes(searchLower)
      );
    }

    // Get total count
    let countQuery = supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: totalCount } = await countQuery;

    return {
      subscriptions: transformedSubscriptions,
      total: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0),
    };
  } catch (error) {
    console.error('Error in getUserSubscriptions:', error);
    throw error;
  }
}

/**
 * 🎯 Manage user subscription (activate, suspend, cancel, extend) using direct SQL
 */
export async function manageUserSubscription(
  adminUserId: string,
  subscriptionId: string,
  action: 'activate' | 'suspend' | 'cancel' | 'extend',
  options: {
    extendMonths?: number;
  } = {}
): Promise<SubscriptionManagement> {
  try {
    const { extendMonths } = options;

    // Verify admin permissions
    const { data: profile, error: profileError } = await supabase.rpc('get_user_profile', { p_user_id: adminUserId });
    if (profileError || !profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      throw new Error('Insufficient permissions');
    }

    // Validate action
    const validActions = ['activate', 'suspend', 'cancel', 'extend'];
    if (!validActions.includes(action)) {
      throw new Error('Invalid action provided');
    }

    // Get current subscription
    const { data: currentSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !currentSub) {
      throw new Error('Subscription not found');
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Handle different actions
    switch (action) {
      case 'activate':
        updateData.status = 'active';
        break;
      case 'suspend':
        updateData.status = 'suspended';
        break;
      case 'cancel':
        updateData.status = 'cancelled';
        break;
      case 'extend':
        if (!extendMonths || extendMonths < 1) {
          throw new Error('Valid extend_months is required for extend action');
        }
        const currentEndDate = new Date(currentSub.end_date || new Date());
        currentEndDate.setMonth(currentEndDate.getMonth() + extendMonths);
        updateData.end_date = currentEndDate.toISOString();
        updateData.status = 'active'; // Reactivate if extending
        break;
    }

    // Update the subscription
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      throw updateError;
    }

    // Add to subscription history
    const { error: historyError } = await supabase
      .from('subscription_history')
      .insert({
        user_id: currentSub.user_id,
        plan_id: currentSub.plan_id,
        plan_name: `${action}_action`,
        action_type: action,
        effective_date: new Date().toISOString(),
      });

    if (historyError) {
      console.error('Error adding to history:', historyError);
      // Don't fail the update for history logging issues
    }

    return {
      success: true,
      message: `Subscription ${action} completed successfully`,
      subscription_status: updatedSubscription.status,
      end_date: updatedSubscription.end_date
    };
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