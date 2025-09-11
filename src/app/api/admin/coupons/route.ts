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

    // Check if user is admin
    const { data: profile } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })
    
    if (!profile || profile.length === 0 || profile[0].role_name !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all coupons using admin function (bypasses RLS)
    const { data: coupons, error } = await supabase
      .rpc('admin_get_all_coupons')

    if (error) throw error

    return NextResponse.json({
      success: true,
      coupons: coupons || []
    })

  } catch (error: any) {
    console.error('Admin coupons fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

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

    // Check if user is admin
    const { data: profile } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })
    
    if (!profile || profile.length === 0 || profile[0].role_name !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      code,
      description,
      type,
      value,
      max_uses,
      max_uses_per_user,
      minimum_amount,
      max_discount_amount,
      expires_at,
      scope,
      is_active
    } = body

    // Validate required fields
    if (!code || !description || !type || value === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if coupon code already exists
    const { data: existingCoupon } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code.toUpperCase())
      .single()

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon code already exists' },
        { status: 400 }
      )
    }

    // Create coupon using admin function (bypasses RLS)
    const { data: couponResult, error } = await supabase
      .rpc('admin_create_coupon', {
        p_code: code.toUpperCase(),
        p_description: description,
        p_type: type,
        p_value: parseFloat(value),
        p_max_uses: max_uses ? parseInt(max_uses) : null,
        p_max_uses_per_user: max_uses_per_user ? parseInt(max_uses_per_user) : null,
        p_minimum_amount: minimum_amount ? parseFloat(minimum_amount) : null,
        p_max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
        p_expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        p_scope: scope || 'public',
        p_is_active: is_active !== false
      })

    if (error) throw error

    const coupon = couponResult && couponResult.length > 0 ? couponResult[0] : null
    if (!coupon) throw new Error('Failed to create coupon')

    return NextResponse.json({
      success: true,
      coupon,
      message: 'Coupon created successfully'
    })

  } catch (error: any) {
    console.error('Admin coupon creation error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create coupon' },
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

    // Check if user is admin
    const { data: profile } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })
    
    if (!profile || profile.length === 0 || profile[0].role_name !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      coupon_id,
      description,
      type,
      value,
      max_uses,
      max_uses_per_user,
      minimum_amount,
      max_discount_amount,
      expires_at,
      scope,
      is_active
    } = body

    if (!coupon_id) {
      return NextResponse.json(
        { success: false, message: 'Coupon ID is required' },
        { status: 400 }
      )
    }

    // Update coupon using admin function (bypasses RLS)
    const { data: couponResult, error } = await supabase
      .rpc('admin_update_coupon', {
        p_coupon_id: coupon_id,
        p_description: description,
        p_type: type,
        p_value: value !== undefined ? parseFloat(value) : null,
        p_max_uses: max_uses !== undefined ? (max_uses ? parseInt(max_uses) : null) : null,
        p_max_uses_per_user: max_uses_per_user !== undefined ? (max_uses_per_user ? parseInt(max_uses_per_user) : null) : null,
        p_minimum_amount: minimum_amount !== undefined ? (minimum_amount ? parseFloat(minimum_amount) : null) : null,
        p_max_discount_amount: max_discount_amount !== undefined ? (max_discount_amount ? parseFloat(max_discount_amount) : null) : null,
        p_expires_at: expires_at !== undefined ? (expires_at ? new Date(expires_at).toISOString() : null) : null,
        p_scope: scope,
        p_is_active: is_active
      })

    if (error) throw error

    const coupon = couponResult && couponResult.length > 0 ? couponResult[0] : null
    if (!coupon) throw new Error('Failed to update coupon')

    return NextResponse.json({
      success: true,
      coupon,
      message: 'Coupon updated successfully'
    })

  } catch (error: any) {
    console.error('Admin coupon update error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })
    
    if (!profile || profile.length === 0 || profile[0].role_name !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const couponId = searchParams.get('id')

    if (!couponId) {
      return NextResponse.json(
        { success: false, message: 'Coupon ID is required' },
        { status: 400 }
      )
    }

    // Check if coupon is used in any payments
    const { data: usedPayments } = await supabase
      .from('subscription_payments')
      .select('id')
      .eq('coupon_id', couponId)
      .limit(1)

    if (usedPayments && usedPayments.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete coupon that has been used in payments' },
        { status: 400 }
      )
    }

    // Delete coupon using admin function (bypasses RLS)
    const { data: result, error } = await supabase
      .rpc('admin_delete_coupon', {
        p_coupon_id: couponId
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    })

  } catch (error: any) {
    console.error('Admin coupon deletion error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}