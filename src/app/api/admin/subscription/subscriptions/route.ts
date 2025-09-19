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
    const search = url.searchParams.get('search') || null
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Fetch user subscriptions without joins to avoid foreign key issues
    let query = supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: subscriptions, error: subscriptionsError } = await query

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    // Get user data, plan data, and payment data separately
    let filteredSubscriptions = subscriptions || []
    if (filteredSubscriptions.length > 0) {
      // Get user data
      const userIds = [...new Set(filteredSubscriptions.map(s => s.user_id))];
      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone_number')
        .in('user_id', userIds);

      // Get plan data
      const planIds = [...new Set(filteredSubscriptions.map(s => s.plan_id).filter(Boolean))];
      let plansData: any[] = [];
      if (planIds.length > 0) {
        const { data: plans } = await supabase
          .from('subscription_plans')
          .select('id, plan_name, display_name, price_monthly, price_yearly, features')
          .in('id', planIds);
        plansData = plans || [];
      }

      // Get payment data for subscriptions with payment_id
      const paymentIds = filteredSubscriptions
        .filter(s => s.payment_id)
        .map(s => s.payment_id);
      let paymentsData: any[] = [];
      if (paymentIds.length > 0) {
        const { data: payments } = await supabase
          .from('subscription_payments')
          .select('id, transaction_id, final_amount, created_at, status')
          .in('id', paymentIds);
        paymentsData = payments || [];
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

      const paymentMap = new Map();
      paymentsData.forEach(payment => {
        paymentMap.set(payment.id, payment);
      });

      // Add user, plan, and payment data to subscriptions
      filteredSubscriptions = filteredSubscriptions.map(sub => ({
        ...sub,
        user_data: userMap.get(sub.user_id) || {},
        plan_data: planMap.get(sub.plan_id) || {},
        payment_data: sub.payment_id ? paymentMap.get(sub.payment_id) : null
      }));

      // Apply search filter after adding user data
      if (search) {
        const searchLower = search.toLowerCase()
        filteredSubscriptions = filteredSubscriptions.filter(sub =>
          sub.user_data?.full_name?.toLowerCase().includes(searchLower) ||
          sub.user_data?.email?.toLowerCase().includes(searchLower) ||
          sub.user_data?.phone_number?.includes(search) ||
          sub.plan_data?.display_name?.toLowerCase().includes(searchLower) ||
          sub.payment_data?.transaction_id?.toLowerCase().includes(searchLower)
        )
      }
    }

    // Transform the data for frontend consumption
    const transformedSubscriptions = filteredSubscriptions.map((subscription: any) => ({
      id: subscription.id,
      user_id: subscription.user_id,
      plan_id: subscription.plan_id,
      billing_cycle: subscription.billing_cycle,
      status: subscription.status,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      payment_id: subscription.payment_id,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
      user: {
        full_name: subscription.user_data?.full_name || 'Unknown User',
        email: subscription.user_data?.email || 'unknown@example.com',
        phone_number: subscription.user_data?.phone_number || null
      },
      plan: {
        name: subscription.plan_data?.plan_name || 'unknown',
        display_name: subscription.plan_data?.display_name || 'Unknown Plan',
        price_monthly: subscription.plan_data?.price_monthly || 0,
        price_yearly: subscription.plan_data?.price_yearly || 0,
        features: subscription.plan_data?.features || []
      },
      payment: subscription.payment_data ? {
        transaction_id: subscription.payment_data.transaction_id,
        final_amount: subscription.payment_data.final_amount,
        payment_date: subscription.payment_data.created_at,
        payment_status: subscription.payment_data.status
      } : null,
      days_remaining: subscription.end_date ?
        Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0,
      is_expired: subscription.end_date ? new Date(subscription.end_date) < new Date() : false
    }))

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      subscriptions: transformedSubscriptions,
      total: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0),
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        per_page: limit,
        total_pages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update subscription status
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
    const { subscription_id, action, extend_months } = body

    if (!subscription_id || !action) {
      return NextResponse.json(
        { success: false, message: 'Subscription ID and action are required' },
        { status: 400 }
      )
    }

    // Validate action
    const validActions = ['activate', 'suspend', 'cancel', 'extend']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action provided' },
        { status: 400 }
      )
    }

    // Get current subscription
    const { data: currentSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .single()

    if (subError || !currentSub) {
      return NextResponse.json(
        { success: false, message: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Handle different actions
    switch (action) {
      case 'activate':
        updateData.status = 'active'
        break
      case 'suspend':
        updateData.status = 'suspended'
        break
      case 'cancel':
        updateData.status = 'cancelled'
        break
      case 'extend':
        if (!extend_months || extend_months < 1) {
          return NextResponse.json(
            { success: false, message: 'Valid extend_months is required for extend action' },
            { status: 400 }
          )
        }
        const currentEndDate = new Date(currentSub.end_date || new Date())
        currentEndDate.setMonth(currentEndDate.getMonth() + extend_months)
        updateData.end_date = currentEndDate.toISOString()
        updateData.status = 'active' // Reactivate if extending
        break
    }

    // Update the subscription
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscription_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update subscription' },
        { status: 500 }
      )
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
      })

    if (historyError) {
      console.error('Error adding to history:', historyError)
      // Don't fail the update for history logging issues
    }

    return NextResponse.json({
      success: true,
      message: `Subscription ${action} completed successfully`,
      subscription: updatedSubscription
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}