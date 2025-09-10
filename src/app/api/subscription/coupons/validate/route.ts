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
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Coupon code is required' },
        { status: 400 }
      )
    }

    // Get coupon from database
    const { data: couponData, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !couponData) {
      return NextResponse.json(
        { success: false, is_valid: false, message: 'Invalid or expired coupon code' },
        { status: 200 }
      )
    }

    // Check if coupon is expired
    if (couponData.expires_at && new Date(couponData.expires_at) <= new Date()) {
      return NextResponse.json(
        { success: false, is_valid: false, message: 'Coupon has expired' },
        { status: 200 }
      )
    }

    // Check usage limits (simplified check)
    if (couponData.max_uses && couponData.used_count >= couponData.max_uses) {
      return NextResponse.json(
        { success: false, is_valid: false, message: 'Coupon usage limit exceeded' },
        { status: 200 }
      )
    }

    // Check user-specific usage
    if (couponData.max_uses_per_user) {
      const { count } = await supabase
        .from('subscription_payments')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', couponData.id)
        .eq('user_id', user.id)
        .in('status', ['verified', 'approved'])

      if (count && count >= couponData.max_uses_per_user) {
        return NextResponse.json(
          { success: false, is_valid: false, message: 'You have already used this coupon' },
          { status: 200 }
        )
      }
    }
    
    return NextResponse.json({
      success: true,
      is_valid: true,
      coupon_id: couponData.id,
      discount_type: couponData.type,
      discount_value: couponData.value,
      description: couponData.description,
      message: 'Valid coupon code'
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}