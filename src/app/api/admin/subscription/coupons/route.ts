import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} from '@/lib/services/subscription-admin';

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

    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const includeExpired = url.searchParams.get('includeExpired') === 'true';
    const search = url.searchParams.get('search');

    // Check for coupon validation request
    const couponCode = url.searchParams.get('validateCode');
    const planId = url.searchParams.get('planId');
    const amount = url.searchParams.get('amount');

    if (couponCode && planId && amount) {
      const validation = await validateCoupon(couponCode, planId, parseFloat(amount));
      return NextResponse.json({
        success: true,
        validation
      });
    }

    // Use our comprehensive service function
    const options: any = {
      includeInactive,
      includeExpired
    };
    if (search) {
      options.search = search;
    }
    const coupons = await getAllCoupons(user.id, options);

    return NextResponse.json({
      success: true,
      coupons
    });

  } catch (error: any) {
    console.error('API Error:', error);

    // Handle specific error cases
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
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

    const body = await request.json();

    // Use our comprehensive service function
    const result = await createCoupon(user.id, body);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      coupon: result.data
    });

  } catch (error: any) {
    console.error('API Error:', error);

    // Handle specific error cases
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 }
      );
    }

    if (error.message.includes('required') || error.message.includes('date')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const couponId = url.searchParams.get('id');

    if (!couponId) {
      return NextResponse.json(
        { success: false, message: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Use our comprehensive service function
    const result = await updateCoupon(user.id, couponId, body);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      coupon: result.data
    });

  } catch (error: any) {
    console.error('API Error:', error);

    // Handle specific error cases
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 }
      );
    }

    if (error.message.includes('date')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
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

    const url = new URL(request.url);
    const couponId = url.searchParams.get('id');

    if (!couponId) {
      return NextResponse.json(
        { success: false, message: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Use our comprehensive service function
    const result = await deleteCoupon(user.id, couponId);

    return NextResponse.json({
      success: result.success,
      message: result.message
    });

  } catch (error: any) {
    console.error('API Error:', error);

    // Handle specific error cases
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}