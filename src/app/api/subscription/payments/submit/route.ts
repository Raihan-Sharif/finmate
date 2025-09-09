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
      plan_id,
      payment_method_id,
      billing_cycle,
      transaction_id,
      sender_number,
      base_amount,
      discount_amount,
      final_amount,
      coupon_id,
      notes
    } = body

    // Validate required fields
    if (!plan_id || !payment_method_id || !billing_cycle || !transaction_id || 
        !sender_number || final_amount === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment information' },
        { status: 400 }
      )
    }

    // Validate transaction ID format (basic validation)
    if (transaction_id.length < 8) {
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

    // Insert payment record
    const { data, error } = await supabase
      .from('subscription_payments')
      .insert({
        user_id: user.id,
        plan_id,
        payment_method_id,
        billing_cycle,
        transaction_id,
        sender_number: sender_number.replace(/\s/g, ''),
        base_amount: parseFloat(base_amount.toString()),
        discount_amount: parseFloat((discount_amount || 0).toString()),
        final_amount: parseFloat(final_amount.toString()),
        coupon_id: coupon_id || null,
        notes: notes || null,
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
      message: 'Payment submitted successfully. It will be verified within 24 hours.'
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}