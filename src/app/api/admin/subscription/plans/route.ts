import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAllSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan
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

    // Use our comprehensive service function
    const plans = await getAllSubscriptionPlans(user.id, includeInactive);

    return NextResponse.json({
      success: true,
      plans: plans || []
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
    const {
      plan_name,
      display_name,
      description,
      price_monthly,
      price_yearly,
      features,
      max_accounts,
      max_family_members,
      allowed_account_types,
      is_active,
      sort_order
    } = body;

    // Use our comprehensive service function
    const result = await createSubscriptionPlan(user.id, {
      plan_name,
      display_name,
      description,
      price_monthly,
      price_yearly: price_yearly || 0,
      features: features || [],
      max_accounts: max_accounts || 3,
      max_family_members: max_family_members || 1,
      allowed_account_types: allowed_account_types || ['cash', 'bank'],
      is_active: is_active !== false,
      sort_order: sort_order || 0
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      plan: result.data
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

    if (error.message.includes('required')) {
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
    const planId = url.searchParams.get('id');

    if (!planId) {
      return NextResponse.json(
        { success: false, message: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Use our comprehensive service function
    const result = await updateSubscriptionPlan(user.id, planId, body);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      plan: result.data
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
    const planId = url.searchParams.get('id');

    if (!planId) {
      return NextResponse.json(
        { success: false, message: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Use our comprehensive service function
    const result = await deleteSubscriptionPlan(user.id, planId);

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

    if (error.message.includes('active subscriptions')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}