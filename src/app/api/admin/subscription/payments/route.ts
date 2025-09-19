import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin permissions
    const { data: profile, error: profileError } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { success: false, message: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (!profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'all'

    // Try the new enhanced function first, fallback to direct query if not available
    let paymentsData, paymentsError;

    try {
      // Try enhanced function with parameters
      const result = await supabase
        .rpc('admin_get_subscription_payments', {
          p_admin_user_id: user.id,
          p_status: status === 'all' ? null : status,
          p_search: null,
          p_limit: 100,
          p_offset: 0
        });

      paymentsData = result.data;
      paymentsError = result.error;

      // If function exists but returns error, log it and use fallback
      if (paymentsError) {
        console.log('Enhanced function error, using fallback:', paymentsError.message);
        throw new Error('Function returned error');
      }
    } catch (enhancedError) {
      console.log('Enhanced function not available, trying fallback...', enhancedError);

      // Fallback to direct query - use correct relationship path
      const { data: directData, error: directError } = await supabase
        .from('subscription_payments')
        .select(`
          *,
          subscription_plans (
            plan_name,
            display_name,
            price_monthly,
            price_yearly
          ),
          payment_methods (
            method_name,
            display_name
          ),
          coupons (
            code,
            type,
            value
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (directData) {
        // Get user data separately since the foreign key goes to auth.users
        const userIds = [...new Set(directData.map(p => p.user_id))];
        const { data: usersData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone_number')
          .in('user_id', userIds);

        // Create a user lookup map
        const userMap = new Map();
        usersData?.forEach(user => {
          userMap.set(user.user_id, user);
        });

        // Transform direct data to match function output
        paymentsData = directData.map(payment => {
          const user = userMap.get(payment.user_id) || {};
          return {
            ...payment,
            user_full_name: user.full_name || '',
            user_email: user.email || 'unknown@example.com',
            user_phone: user.phone_number || payment.sender_number || '',
            plan_name: payment.subscription_plans?.plan_name || 'unknown',
            plan_display_name: payment.subscription_plans?.display_name || 'Unknown Plan',
            plan_price_monthly: payment.subscription_plans?.price_monthly || 0,
            plan_price_yearly: payment.subscription_plans?.price_yearly || 0,
            payment_method_name: payment.payment_methods?.method_name || 'manual',
            payment_method_display_name: payment.payment_methods?.display_name || 'Manual Payment',
            coupon_code: payment.coupons?.code,
            coupon_type: payment.coupons?.type,
            coupon_value: payment.coupons?.value,
            days_since_submission: payment.submitted_at ?
              Math.floor((new Date().getTime() - new Date(payment.submitted_at).getTime()) / (1000 * 60 * 60 * 24)) : null,
            subscription_status: 'no_subscription' // Default for fallback
          };
        });
      }
      paymentsError = directError;
    }

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    // Filter by status if specified (done in JavaScript since the function returns all)
    let filteredPayments = paymentsData || []
    if (status && status !== 'all') {
      filteredPayments = filteredPayments.filter((payment: any) => payment.status === status)
    }

    // Transform the data for frontend consumption (the function already returns structured data)
    const transformedPayments = filteredPayments.map((payment: any) => ({
      id: payment.id,
      user_id: payment.user_id,
      plan_id: payment.plan_id,
      payment_method_id: payment.payment_method_id,
      billing_cycle: payment.billing_cycle,
      transaction_id: payment.transaction_id,
      sender_number: payment.sender_number,
      base_amount: payment.base_amount,
      discount_amount: payment.discount_amount,
      final_amount: payment.final_amount,
      coupon_id: payment.coupon_id,
      status: payment.status,
      admin_notes: payment.admin_notes,
      rejection_reason: payment.rejection_reason,
      submitted_at: payment.submitted_at,
      verified_at: payment.verified_at,
      approved_at: payment.approved_at,
      rejected_at: payment.rejected_at,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      currency: payment.currency || 'BDT',
      plan: {
        name: payment.plan_name || 'unknown',
        display_name: payment.plan_display_name || 'Unknown Plan',
        price_monthly: payment.plan_price_monthly || 0,
        price_yearly: payment.plan_price_yearly || 0
      },
      payment_method: {
        name: payment.payment_method_name || 'manual',
        display_name: payment.payment_method_display_name || 'Manual Payment'
      },
      coupon: payment.coupon_code ? {
        code: payment.coupon_code,
        type: payment.coupon_type || 'percentage', // Use actual type from database
        value: payment.coupon_value
      } : null,
      profiles: {
        full_name: payment.user_full_name || 'Unknown User',
        email: payment.user_email || 'unknown@example.com'
      }
    }))

    return NextResponse.json({
      success: true,
      payments: transformedPayments,
      total: transformedPayments.length,
      hasMore: false
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin permissions
    const { data: profile, error: profileError } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { success: false, message: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (!profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { payment_id, status, admin_notes, rejection_reason } = body

    if (!payment_id || !status) {
      return NextResponse.json(
        { success: false, message: 'Payment ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'submitted', 'verified', 'approved', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status provided' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {
      status: status as any,
      updated_at: new Date().toISOString()
    }

    // Set timestamp fields based on status
    switch (status) {
      case 'verified':
        updateData.verified_at = new Date().toISOString()
        updateData.verified_by = user.id
        break
      case 'approved':
        updateData.approved_at = new Date().toISOString()
        updateData.verified_by = user.id
        break
      case 'rejected':
        updateData.rejected_at = new Date().toISOString()
        updateData.verified_by = user.id
        if (rejection_reason) {
          updateData.rejection_reason = rejection_reason
        }
        break
    }

    // Add admin notes if provided
    if (admin_notes) {
      updateData.admin_notes = admin_notes
    }

    // Update the payment record
    const { data: updatedPayment, error: updateError } = await supabase
      .from('subscription_payments')
      .update(updateData)
      .eq('id', payment_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating payment:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update payment status' },
        { status: 500 }
      )
    }

    // If payment is approved, create/upgrade user subscription
    if (status === 'approved' && updatedPayment) {
      try {
        // Try enhanced function first
        const { error: upgradeError } = await supabase
          .rpc('upgrade_user_subscription', {
            p_user_id: updatedPayment.user_id,
            p_payment_id: payment_id
          });

        if (upgradeError) {
          console.error('Enhanced upgrade function failed, using fallback...');

          // Fallback: Manual subscription creation
          const { data: paymentData, error: paymentError } = await supabase
            .from('subscription_payments')
            .select(`
              *,
              subscription_plans (*)
            `)
            .eq('id', payment_id)
            .single();

          if (!paymentError && paymentData?.plan_id) {
            const endDate = new Date();
            if (paymentData.billing_cycle === 'monthly') {
              endDate.setMonth(endDate.getMonth() + 1);
            } else {
              endDate.setFullYear(endDate.getFullYear() + 1);
            }

            // Create/update user subscription
            await supabase
              .from('user_subscriptions')
              .upsert({
                user_id: paymentData.user_id,
                plan_id: paymentData.plan_id,
                billing_cycle: paymentData.billing_cycle,
                payment_id: payment_id,
                status: 'active',
                end_date: endDate.toISOString(),
                updated_at: new Date().toISOString(),
              });

            // Add to subscription history
            await supabase
              .from('subscription_history')
              .insert({
                user_id: paymentData.user_id,
                plan_id: paymentData.plan_id,
                plan_name: paymentData.subscription_plans?.plan_name || 'unknown',
                action_type: 'subscription_activated',
                amount_paid: paymentData.final_amount,
                payment_id: payment_id,
                effective_date: new Date().toISOString(),
              });
          }
        }
      } catch (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        // Don't fail the payment update, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully',
      payment: updatedPayment
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}