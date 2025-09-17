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

    // Use the simplified admin function to get subscription payments with all related data
    const { data: paymentsData, error: paymentsError } = await supabase
      .rpc('admin_get_subscription_payments')

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