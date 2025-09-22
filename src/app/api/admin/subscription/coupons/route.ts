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

    // Fetch coupons first
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch coupons' },
        { status: 500 }
      );
    }

    // Get usage count for each coupon separately to avoid join issues
    const transformedCoupons = await Promise.all(
      (coupons || []).map(async (coupon) => {
        const { count: usedCount } = await supabase
          .from('subscription_payments')
          .select('*', { count: 'exact', head: true })
          .eq('coupon_id', coupon.id);

        return {
          ...coupon,
          used_count: usedCount || 0
        };
      })
    );

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
    if (!['percentage', 'fixed'].includes(type)) {
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
    const {
      coupon_id,
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
    } = body;

    if (!coupon_id) {
      return NextResponse.json(
        { success: false, message: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Build update object - only include provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (max_uses !== undefined) updateData.max_uses = max_uses || null;
    if (max_uses_per_user !== undefined) updateData.max_uses_per_user = max_uses_per_user || null;
    if (minimum_amount !== undefined) updateData.minimum_amount = minimum_amount || null;
    if (max_discount_amount !== undefined) updateData.max_discount_amount = max_discount_amount || null;
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at).toISOString() : null;
    if (scope !== undefined) updateData.scope = scope;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update coupon
    const { data: updatedCoupon, error } = await supabase
      .from('coupons')
      .update(updateData)
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
      message: 'Coupon updated successfully',
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

export async function DELETE(request: NextRequest) {
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

    // Get coupon ID from query params
    const url = new URL(request.url);
    const couponId = url.searchParams.get('id');

    if (!couponId) {
      return NextResponse.json(
        { success: false, message: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Check if coupon exists and if it's being used
    const { data: existingCoupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single();

    if (fetchError || !existingCoupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Check if coupon is being used in any payments
    const { data: paymentsUsingCoupon, error: paymentsError } = await supabase
      .from('subscription_payments')
      .select('id')
      .eq('coupon_id', couponId)
      .limit(1);

    if (paymentsError) {
      console.error('Error checking coupon usage:', paymentsError);
      return NextResponse.json(
        { success: false, message: 'Failed to verify coupon usage' },
        { status: 500 }
      );
    }

    if (paymentsUsingCoupon && paymentsUsingCoupon.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete coupon that has been used in payments. Consider deactivating it instead.' },
        { status: 400 }
      );
    }

    // Delete the coupon
    const { error: deleteError } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (deleteError) {
      console.error('Error deleting coupon:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete coupon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}