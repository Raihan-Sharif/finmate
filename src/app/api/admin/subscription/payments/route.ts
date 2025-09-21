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

    // Use direct query approach for better reliability
    let paymentsData, paymentsError;

    try {
      console.log('=== PAYMENTS API DEBUG START ===');
      console.log('Request params:', { status });
      console.log('Admin user ID:', user.id);

      // Try the fixed database function first
      console.log('Attempting to use fixed admin_get_subscription_payments function...');

      try {
        const functionResult = await supabase
          .rpc('admin_get_subscription_payments', {
            p_admin_user_id: user.id,
            p_status: status === 'all' ? null : status,
            p_search: null,
            p_limit: 100,
            p_offset: 0
          });

        console.log('Function call result:', {
          success: !functionResult.error,
          dataCount: functionResult.data?.length || 0,
          error: functionResult.error?.message || null,
          sampleRecord: functionResult.data?.[0] || null
        });

        if (!functionResult.error && functionResult.data) {
          // Function worked! Transform the data
          const transformedPayments = functionResult.data.map((payment: any) => ({
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
            verified_by: null, // Not in function return
            currency: payment.currency,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
            // Transformed nested objects for compatibility
            profiles: {
              full_name: payment.user_full_name,
              email: payment.user_email,
              phone_number: payment.user_phone
            },
            plan: {
              plan_name: payment.plan_name,
              display_name: payment.plan_display_name,
              price_monthly: payment.plan_price_monthly,
              price_yearly: payment.plan_price_yearly
            },
            payment_method: {
              method_name: payment.payment_method_name,
              display_name: payment.payment_method_display_name
            },
            coupon: payment.coupon_code ? {
              code: payment.coupon_code,
              type: payment.coupon_type,
              value: payment.coupon_value
            } : null,
            // Additional computed fields
            user_full_name: payment.user_full_name,
            user_email: payment.user_email,
            plan_name: payment.plan_name,
            plan_display_name: payment.plan_display_name,
            payment_method_name: payment.payment_method_name,
            days_since_submission: payment.days_since_submission,
            subscription_status: payment.subscription_status
          }));

          console.log('=== FUNCTION SUCCESS - USING DATABASE FUNCTION ===');
          console.log('Transformed payments count:', transformedPayments.length);
          console.log('Sample transformed payment:', transformedPayments[0] || null);
          console.log('=== PAYMENTS API DEBUG END ===');

          return NextResponse.json({
            success: true,
            payments: transformedPayments,
            total: transformedPayments.length,
            hasMore: false,
            source: 'database_function'
          });
        }
      } catch (functionError) {
        console.error('Database function failed:', functionError);
      }

      console.log('Function failed, falling back to direct query approach...');

      // Direct query - fetch all columns including payment_method_id
      const { data: directData, error: directError } = await supabase
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
        .limit(100);

      console.log('Direct query result:', {
        dataCount: directData?.length || 0,
        error: directError,
        hasData: !!directData,
        sampleRecord: directData?.[0] || null
      });

      if (directError) {
        console.error('Direct query error details:', directError);
      }

      // Initialize data arrays for fallback approach
      let usersData: any[] = [];
      let plansData: any[] = [];
      let methodsData: any[] = [];
      let couponsData: any[] = [];

      if (directData) {
        // Get all related data separately to avoid foreign key issues

        // Get user data
        const userIds = [...new Set(directData.map(p => p.user_id))];
        const { data: users } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone_number')
          .in('user_id', userIds);
        usersData = users || [];

        // Get plan data
        const planIds = [...new Set(directData.map(p => p.plan_id).filter(Boolean))];
        if (planIds.length > 0) {
          const { data: plans } = await supabase
            .from('subscription_plans')
            .select('id, plan_name, display_name, price_monthly, price_yearly')
            .in('id', planIds);
          plansData = plans || [];
        }

        // Get payment method data
        const methodIds = [...new Set(directData.map(p => p.payment_method_id).filter(Boolean))];
        if (methodIds.length > 0) {
          const { data: methods } = await supabase
            .from('payment_methods')
            .select('id, method_name, display_name')
            .in('id', methodIds);
          methodsData = methods || [];
        }

        // Get coupon data
        const couponIds = [...new Set(directData.map(p => p.coupon_id).filter(Boolean))];
        if (couponIds.length > 0) {
          const { data: coupons } = await supabase
            .from('coupons')
            .select('id, code, type, value')
            .in('id', couponIds);
          couponsData = coupons || [];
        }

        // Create lookup maps
        const userMap = new Map();
        usersData?.forEach(user => {
          userMap.set(user.user_id, user);
        });

        const planMap = new Map();
        plansData.forEach(plan => {
          planMap.set(plan.id, plan);
        });

        const methodMap = new Map();
        methodsData.forEach(method => {
          methodMap.set(method.id, method);
        });

        const couponMap = new Map();
        couponsData.forEach(coupon => {
          couponMap.set(coupon.id, coupon);
        });

        // Transform direct data to match function output
        paymentsData = directData.map(payment => {
          const user = userMap.get(payment.user_id) || {};
          const plan = planMap.get(payment.plan_id) || {};
          const method = methodMap.get(payment.payment_method_id) || {};
          const coupon = couponMap.get(payment.coupon_id);

          return {
            ...payment,
            user_full_name: user.full_name || '',
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
            subscription_status: 'no_subscription' // Default for fallback
          };
        });
      }
      paymentsError = directError;
    } catch (error: any) {
      console.error('Direct query failed:', error);
      paymentsError = error;
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

    console.log('=== PAYMENTS TRANSFORMATION DEBUG ===');
    console.log('Final API response:', {
      success: true,
      paymentsCount: transformedPayments.length,
      samplePayment: transformedPayments[0] || null
    });
    console.log('=== PAYMENTS API DEBUG END ===');

    return NextResponse.json({
      success: true,
      payments: transformedPayments,
      total: transformedPayments.length,
      hasMore: false,
      source: 'direct_query_fallback'
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

    // Build update object according to database schema
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
        console.log('Creating user subscription for approved payment...');

        // Manual subscription creation (more reliable than function call)
        try {
        // Get payment and plan data
        const { data: paymentData, error: paymentError } = await supabase
          .from('subscription_payments')
          .select('*')
          .eq('id', payment_id)
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
            payment_id: payment_id,
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
            plan_name: planData?.plan_name || 'unknown',
            action_type: 'subscription_activated',
            amount_paid: paymentData.final_amount,
            payment_id: payment_id,
            effective_date: new Date().toISOString(),
          });

        if (historyError) {
          console.error('Failed to add subscription history:', historyError);
          // Don't fail the operation for history logging issues
        }

        console.log('Subscription created successfully for payment:', payment_id);

        } catch (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
          // Don't fail the payment update, just log the error
        }
      } catch (error) {
        console.error('Error in subscription creation process:', error);
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