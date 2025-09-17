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

    // Get query parameters for filtering and pagination
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || null
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Build the query for subscription payments (simplified without joins)
    let paymentsQuery = supabase
      .from('subscription_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add status filter if provided
    if (status && status !== 'all') {
      paymentsQuery = paymentsQuery.eq('status', status)
    }

    const { data: paymentsData, error: paymentsError } = await paymentsQuery

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    // Get related data separately to avoid join issues
    const userIds = paymentsData ? [...new Set(paymentsData.map(p => p.user_id).filter(Boolean))] : []
    const planIds = paymentsData ? [...new Set(paymentsData.map(p => p.plan_id).filter(Boolean))] : []
    const couponIds = paymentsData ? [...new Set(paymentsData.map(p => p.coupon_id).filter(Boolean))] : []

    // Fetch related data
    const [profilesData, plansData, couponsData] = await Promise.all([
      userIds.length > 0 ? supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds) : Promise.resolve({ data: [] }),
      planIds.length > 0 ? supabase
        .from('subscription_plans')
        .select('id, plan_name, display_name, price_monthly, price_yearly')
        .in('id', planIds) : Promise.resolve({ data: [] }),
      couponIds.length > 0 ? supabase
        .from('coupons')
        .select('id, code, value')
        .in('id', couponIds) : Promise.resolve({ data: [] })
    ])

    // Create lookup maps
    const profilesMap = new Map(profilesData.data?.map(p => [p.user_id, p]) || [])
    const plansMap = new Map(plansData.data?.map(p => [p.id, p]) || [])
    const couponsMap = new Map(couponsData.data?.map(c => [c.id, c]) || [])

    // Get user emails separately (simplified approach)
    const userEmails: Record<string, string> = {}
    for (const userId of userIds) {
      try {
        // Try to get email from auth, but don't fail if it doesn't work
        const { data: authUser } = await supabase.auth.admin.getUserById(userId)
        if (authUser.user?.email) {
          userEmails[userId] = authUser.user.email
        } else {
          userEmails[userId] = `user-${userId.slice(-8)}@example.com`
        }
      } catch (error) {
        // Fallback email
        userEmails[userId] = `user-${userId.slice(-8)}@example.com`
      }
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('subscription_payments')
      .select('*', { count: 'exact', head: true })

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error('Error fetching payments count:', countError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payments count' },
        { status: 500 }
      )
    }

    // Transform the data for frontend consumption
    const transformedPayments = (paymentsData || []).map((payment: any) => {
      const profile = profilesMap.get(payment.user_id)
      const plan = plansMap.get(payment.plan_id)
      const coupon = couponsMap.get(payment.coupon_id)

      return {
        id: payment.id,
        user_id: payment.user_id,
        plan_id: payment.plan_id,
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
        plan: plan ? {
          name: plan.plan_name,
          display_name: plan.display_name,
          price_monthly: plan.price_monthly,
          price_yearly: plan.price_yearly
        } : {
          name: 'unknown',
          display_name: 'Unknown Plan',
          price_monthly: 0,
          price_yearly: 0
        },
        payment_method: {
          name: 'manual',
          display_name: 'Manual Payment'
        },
        coupon: coupon ? {
          code: coupon.code,
          type: 'percentage', // Default since type column doesn't exist
          value: coupon.value
        } : null,
        profiles: {
          full_name: profile?.full_name || 'Unknown User',
          email: userEmails[payment.user_id] || 'unknown@example.com'
        }
      }
    })

    return NextResponse.json({
      success: true,
      payments: transformedPayments,
      total: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0),
      pagination: {
        offset,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
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

    // If payment is approved, upgrade user subscription
    if (status === 'approved') {
      const { error: upgradeError } = await supabase
        .rpc('upgrade_user_subscription', {
          p_user_id: updatedPayment.user_id,
          p_payment_id: payment_id
        })

      if (upgradeError) {
        console.error('Error upgrading subscription:', upgradeError)
        // Note: We still return success for the payment update, but log the upgrade error
        console.warn('Payment approved but subscription upgrade failed:', upgradeError)
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