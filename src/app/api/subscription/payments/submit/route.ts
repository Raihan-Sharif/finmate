import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      plan,
      billing_cycle,
      payment_method,
      payment_details,
      applied_coupon_id,
      upgrade_reason
    } = body

    // Extract payment details - handle both old and new formats
    const transaction_id = payment_details?.transaction_id || body.transaction_id
    const sender_number = payment_details?.sender_number || body.sender_number
    const amount = payment_details?.amount || body.amount || body.final_amount
    const coupon = payment_details?.coupon || null
    const discount_amount = payment_details?.discount_amount || 0

    // Validate required fields
    if (!plan || !billing_cycle || !payment_method || !transaction_id || 
        !sender_number || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment information' },
        { status: 400 }
      )
    }

    // Validate transaction ID format (basic validation)
    if (transaction_id.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Invalid transaction ID format' },
        { status: 400 }
      )
    }

    // Validate phone number format for Bangladesh
    const phoneRegex = /^(\+88)?01[3-9]\d{8}$/
    if (!phoneRegex.test(sender_number.replace(/\s/g, ''))) {
      return NextResponse.json(
        { success: false, message: 'Invalid mobile number format' },
        { status: 400 }
      )
    }

    // Get subscription plan details
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, plan_name, price_monthly, price_yearly')
      .eq('plan_name', plan)
      .single()

    if (planError || !planData) {
      return NextResponse.json(
        { success: false, message: 'Invalid subscription plan' },
        { status: 400 }
      )
    }

    // Get payment method details
    const { data: paymentMethodData, error: paymentMethodError } = await supabase
      .from('payment_methods')
      .select('id, method_name')
      .eq('method_name', payment_method)
      .single()

    if (paymentMethodError || !paymentMethodData) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Check if transaction ID already exists
    const { data: existingPayment } = await supabase
      .from('subscription_payments')
      .select('id')
      .eq('transaction_id', transaction_id)
      .single()

    if (existingPayment) {
      return NextResponse.json(
        { success: false, message: 'Transaction ID already exists' },
        { status: 400 }
      )
    }

    // Calculate amounts
    const baseAmount = billing_cycle === 'yearly' ? planData.price_yearly : planData.price_monthly
    const finalDiscountAmount = discount_amount || Math.max(0, baseAmount - amount)
    const couponId = applied_coupon_id || coupon?.id || null
    
    // Insert payment record
    const { data, error } = await supabase
      .from('subscription_payments')
      .insert({
        user_id: user.id,
        plan_id: planData.id,
        payment_method_id: paymentMethodData.id,
        billing_cycle,
        transaction_id,
        sender_number: sender_number.replace(/\s/g, ''),
        base_amount: baseAmount,
        discount_amount: finalDiscountAmount,
        final_amount: amount,
        coupon_id: couponId,
        notes: upgrade_reason ? `Upgrade reason: ${upgrade_reason}` : null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        currency: 'BDT'
      })
      .select()
      .single()

    if (error) {
      console.error('Payment submission error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to submit payment. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payment_id: data.id,
      message: 'Payment submitted successfully. It will be verified within 12-24 hours.',
      estimated_processing_time: '12-24 hours'
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}