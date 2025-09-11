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

    console.log('Profile check:', { user: user.id, profile, profileError })

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { success: false, message: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (!profile?.[0]?.role_name || !['admin', 'superadmin'].includes(profile[0].role_name)) {
      console.log('Permission denied:', { 
        hasProfile: !!profile?.[0], 
        roleName: profile?.[0]?.role_name,
        allowedRoles: ['admin', 'superadmin']
      })
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use admin function to fetch payments (bypasses RLS)
    const { data: payments, error } = await supabase
      .rpc('admin_get_subscription_payments', {
        p_status: status === 'all' ? null : status,
        p_limit: limit,
        p_offset: offset
      })

    if (error) {
      console.error('Payments fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    // Get total count using admin function
    const { data: totalCount, error: countError } = await supabase
      .rpc('admin_get_subscription_payments_count', {
        p_status: status === 'all' ? null : status
      })

    if (countError) {
      console.error('Count fetch error:', countError)
    }

    // Transform data to match expected format
    const transformedPayments = (payments || []).map((payment: any) => ({
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
      notes: payment.notes,
      status: payment.status,
      admin_notes: payment.admin_notes,
      rejection_reason: payment.rejection_reason,
      submitted_at: payment.submitted_at,
      verified_at: payment.verified_at,
      approved_at: payment.approved_at,
      rejected_at: payment.rejected_at,
      verified_by: payment.verified_by,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      currency: payment.currency,
      user: {
        full_name: payment.user_full_name,
        email: payment.user_email
      },
      plan: {
        display_name: payment.plan_display_name,
        plan_name: payment.plan_name
      },
      payment_method: {
        display_name: payment.payment_method_display_name,
        method_name: payment.payment_method_name
      },
      coupon: payment.coupon_code ? {
        code: payment.coupon_code,
        type: payment.coupon_type,
        value: payment.coupon_value
      } : null
    }))

    return NextResponse.json({
      success: true,
      payments: transformedPayments,
      total: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0)
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

    console.log('Profile check PATCH:', { user: user.id, profile, profileError })

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { success: false, message: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (!profile?.[0]?.role_name || !['admin', 'superadmin'].includes(profile[0].role_name)) {
      console.log('Permission denied PATCH:', { 
        hasProfile: !!profile?.[0], 
        roleName: profile?.[0]?.role_name,
        allowedRoles: ['admin', 'superadmin']
      })
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { payment_id, status, admin_notes, rejection_reason } = body

    if (!payment_id || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['verified', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status,
      admin_notes: admin_notes || null,
      verified_by: user.id,
      verified_at: new Date().toISOString()
    }

    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason
      updateData.rejected_at = new Date().toISOString()
    } else if (status === 'approved') {
      updateData.approved_at = new Date().toISOString()
    }

    // Update payment record using admin function
    const { data: updateResult, error } = await supabase
      .rpc('admin_update_payment_status', {
        p_payment_id: payment_id,
        p_status: status,
        p_admin_notes: admin_notes,
        p_rejection_reason: rejection_reason,
        p_admin_user_id: user.id
      })

    if (error) {
      console.error('Payment update error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update payment status' },
        { status: 500 }
      )
    }

    const data = updateResult && updateResult.length > 0 ? updateResult[0] : null
    if (!data) {
      throw new Error('Failed to update payment')
    }

    // If approved, update user subscription (this would trigger database functions)
    if (status === 'approved') {
      // Call stored procedure to handle subscription upgrade
      const { error: upgradeError } = await supabase
        .rpc('approve_subscription_payment', {
          p_payment_id: payment_id
        })

      if (upgradeError) {
        console.error('Subscription upgrade error:', upgradeError)
        // Note: We could rollback the status update here if needed
      }
    }

    return NextResponse.json({
      success: true,
      payment: data,
      message: `Payment ${status} successfully`
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}