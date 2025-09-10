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
    const { code, base_amount = 0 } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Coupon code is required' },
        { status: 400 }
      )
    }

    // Call the database function to validate coupon with proper scope handling
    const { data, error } = await supabase
      .rpc('validate_coupon_usage', {
        p_user_id: user.id,
        p_coupon_code: code.trim(),
        p_base_amount: parseFloat(base_amount.toString()) || 0
      })

    if (error) {
      console.error('Coupon validation error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to validate coupon' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, is_valid: false, message: 'Invalid coupon code' },
        { status: 200 }
      )
    }

    const result = data[0]
    
    if (!result.is_valid) {
      return NextResponse.json(
        { 
          success: false, 
          is_valid: false,
          message: result.message,
          coupon: {
            id: result.coupon_id,
            code: code.toUpperCase(),
            description: result.description
          }
        },
        { status: 200 }
      )
    }

    // Return successful validation
    return NextResponse.json({
      success: true,
      is_valid: true,
      coupon_id: result.coupon_id,
      discount_type: result.discount_type,
      discount_value: result.discount_value,
      discount_amount: result.discount_amount,
      code: code.toUpperCase(),
      description: result.description,
      message: result.message
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}