import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
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
    const paymentMethods = await getAllPaymentMethods(user.id, includeInactive);

    return NextResponse.json({
      success: true,
      payment_methods: paymentMethods || []
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
    const result = await createPaymentMethod(user.id, body);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      payment_method: result.data
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
    const methodId = url.searchParams.get('id');

    if (!methodId) {
      return NextResponse.json(
        { success: false, message: 'Method ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Use our comprehensive service function
    const result = await updatePaymentMethod(user.id, methodId, body);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      payment_method: result.data
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
    const methodId = url.searchParams.get('id');

    if (!methodId) {
      return NextResponse.json(
        { success: false, message: 'Method ID is required' },
        { status: 400 }
      );
    }

    // Use our comprehensive service function
    const result = await deletePaymentMethod(user.id, methodId);

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