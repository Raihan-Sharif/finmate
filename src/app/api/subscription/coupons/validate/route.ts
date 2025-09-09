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
    const { code, plan_name, billing_cycle, base_amount } = body

    if (!code || !plan_name || !billing_cycle || !base_amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call the database function to validate and apply coupon
    const { data, error } = await supabase
      .rpc('apply_coupon', {
        p_user_id: user.id,
        p_coupon_code: code.toUpperCase(),
        p_plan_name: plan_name,
        p_billing_cycle: billing_cycle,
        p_base_amount: base_amount
      })

    if (error) {
      console.error('Coupon validation error:', error)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, is_valid: false, message: 'Invalid or expired coupon code' },
        { status: 200 }
      )
    }

    const couponResult = data[0]
    
    return NextResponse.json({
      success: true,
      is_valid: couponResult.is_valid,
      coupon_id: couponResult.coupon_id,
      discount_amount: couponResult.discount_amount,
      type: couponResult.coupon_type,
      value: couponResult.coupon_value,
      message: couponResult.is_valid ? 'Coupon applied successfully' : couponResult.message
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}