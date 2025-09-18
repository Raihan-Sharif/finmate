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

    // Fetch payment methods
    const { data: paymentMethods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment_methods: paymentMethods || []
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
      method_name,
      display_name,
      description,
      icon_url,
      instructions,
      is_active,
      sort_order
    } = body;

    // Validate required fields
    if (!method_name || !display_name) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new payment method
    const { data: newMethod, error } = await supabase
      .from('payment_methods')
      .insert([{
        method_name,
        display_name,
        description,
        icon_url,
        instructions,
        is_active: is_active !== false,
        sort_order: sort_order || 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment method:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method created successfully',
      payment_method: newMethod
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}