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

    // Fetch subscription plans
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plans: plans || []
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
      plan_name,
      display_name,
      description,
      price_monthly,
      price_yearly,
      features,
      max_accounts,
      max_family_members,
      allowed_account_types,
      is_popular,
      is_active,
      sort_order
    } = body;

    // Validate required fields
    if (!plan_name || !display_name || price_monthly == null || price_yearly == null) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new plan
    const { data: newPlan, error } = await supabase
      .from('subscription_plans')
      .insert([{
        plan_name,
        display_name,
        description,
        price_monthly,
        price_yearly,
        features: features || [],
        max_accounts: max_accounts || 3,
        max_family_members: max_family_members || 1,
        allowed_account_types: allowed_account_types || ['cash', 'bank'],
        is_popular: is_popular || false,
        is_active: is_active !== false,
        sort_order: sort_order || 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating plan:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plan created successfully',
      plan: newPlan
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}