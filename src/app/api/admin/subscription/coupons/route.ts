import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: profile, error: profileError } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id });

    if (profileError || !profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch coupons with usage count
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select(`
        *,
        used_count:subscription_payments(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch coupons' },
        { status: 500 }
      );
    }

    // Transform data to include usage count
    const transformedCoupons = coupons?.map(coupon => ({
      ...coupon,
      used_count: coupon.used_count?.[0]?.count || 0
    })) || [];

    return NextResponse.json({
      success: true,
      coupons: transformedCoupons
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: profile, error: profileError } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id });

    if (profileError || !profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
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
      applicable_plans,
      is_active
    } = body;

    // Validate required fields
    if (!code || !type || value == null) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate coupon type
    if (!['percentage', 'fixed_amount'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid coupon type' },
        { status: 400 }
      );
    }

    // Check if coupon code already exists
    const { data: existingCoupon } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    // Insert new coupon
    const { data: newCoupon, error } = await supabase
      .from('coupons')
      .insert([{
        code: code.toUpperCase(),
        description,
        type,
        value,
        max_uses,
        max_uses_per_user,
        minimum_amount,
        max_discount_amount,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        scope: scope || 'all',
        applicable_plans,
        is_active: is_active !== false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating coupon:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create coupon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully',
      coupon: newCoupon
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: profile, error: profileError } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id });

    if (profileError || !profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { coupon_id, is_active } = body;

    if (!coupon_id || is_active == null) {
      return NextResponse.json(
        { success: false, message: 'Coupon ID and status are required' },
        { status: 400 }
      );
    }

    // Update coupon status
    const { data: updatedCoupon, error } = await supabase
      .from('coupons')
      .update({
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', coupon_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating coupon:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update coupon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Coupon ${is_active ? 'activated' : 'deactivated'} successfully`,
      coupon: updatedCoupon
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}