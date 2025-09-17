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
    
    if (!profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      console.log('Permission denied:', { 
        hasProfile: !!profile?.[0], 
        roleName: profile?.[0]?.role_name,
        allowedRoles: ['admin', 'super_admin']
      })
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all coupons using direct query
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

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
    
    if (!profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      console.log('Permission denied:', { 
        hasProfile: !!profile?.[0], 
        roleName: profile?.[0]?.role_name,
        allowedRoles: ['admin', 'super_admin']
      })
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

    // Create coupon using direct insert
    const { data: couponResult, error } = await supabase
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        description: description,
        value: parseFloat(value),
        max_uses: max_uses ? parseInt(max_uses) : null,
        max_uses_per_user: max_uses_per_user ? parseInt(max_uses_per_user) : null,
        minimum_amount: minimum_amount ? parseFloat(minimum_amount) : 0,
        max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        scope: scope || 'public',
        is_active: is_active !== false
      })
      .select()
      .single()

    if (error) throw error

    const coupon = couponResult
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
    
    if (!profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      console.log('Permission denied:', { 
        hasProfile: !!profile?.[0], 
        roleName: profile?.[0]?.role_name,
        allowedRoles: ['admin', 'super_admin']
      })
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

    // Build update object with only provided fields
    const updateData: any = { updated_at: new Date().toISOString() }

    if (description !== undefined) updateData.description = description
    if (value !== undefined) updateData.value = parseFloat(value)
    if (max_uses !== undefined) updateData.max_uses = max_uses ? parseInt(max_uses) : null
    if (max_uses_per_user !== undefined) updateData.max_uses_per_user = max_uses_per_user ? parseInt(max_uses_per_user) : null
    if (minimum_amount !== undefined) updateData.minimum_amount = minimum_amount ? parseFloat(minimum_amount) : 0
    if (max_discount_amount !== undefined) updateData.max_discount_amount = max_discount_amount ? parseFloat(max_discount_amount) : null
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at).toISOString() : null
    if (scope !== undefined) updateData.scope = scope
    if (is_active !== undefined) updateData.is_active = is_active

    // Update coupon using direct update
    const { data: couponResult, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', coupon_id)
      .select()
      .single()

    if (error) throw error

    const coupon = couponResult
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
    
    if (!profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      console.log('Permission denied:', { 
        hasProfile: !!profile?.[0], 
        roleName: profile?.[0]?.role_name,
        allowedRoles: ['admin', 'super_admin']
      })
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

    // Delete coupon using direct delete
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId)

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