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
    const { data: profile } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })

    if (!profile?.[0]?.role_name || !['admin', 'superadmin'].includes(profile[0].role_name)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('subscription_payments')
      .select(`
        *,
        user:profiles!user_id(full_name, email),
        plan:subscription_plans(display_name, plan_name),
        payment_method:payment_methods(display_name, method_name),
        coupon:coupons(code, type, value)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: payments, error } = await query

    if (error) {
      console.error('Payments fetch error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('subscription_payments')
      .select('*', { count: 'exact', head: true })

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      payments: payments || [],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0)
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
    const { data: profile } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })

    if (!profile?.[0]?.role_name || !['admin', 'superadmin'].includes(profile[0].role_name)) {
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

    // Update payment record
    const { data, error } = await supabase
      .from('subscription_payments')
      .update(updateData)
      .eq('id', payment_id)
      .select()
      .single()

    if (error) {
      console.error('Payment update error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update payment status' },
        { status: 500 }
      )
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