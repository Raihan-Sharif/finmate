import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';

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
    const { data: profile, error: profileError } = await supabase.rpc('get_user_profile', { p_user_id: user.id });
    if (profileError || !profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create subscription plans
    const plansToCreate = [
      {
        plan_name: 'free',
        display_name: 'Free Plan',
        description: 'Basic features to get started',
        price_monthly: 0.00,
        price_yearly: 0.00,
        features: ['1 bank account', 'Basic transactions', 'Limited reports'],
        max_accounts: 1,
        max_family_members: 1,
        allowed_account_types: ['cash'],
        is_active: true,
        sort_order: 0
      },
      {
        plan_name: 'basic',
        display_name: 'Basic Plan',
        description: 'Perfect for individuals just starting their financial journey',
        price_monthly: 499.00,
        price_yearly: 4990.00,
        features: ['Up to 3 bank accounts', 'Basic transaction tracking', 'Monthly reports', 'Email support'],
        max_accounts: 3,
        max_family_members: 1,
        allowed_account_types: ['cash', 'bank'],
        is_active: true,
        sort_order: 1
      },
      {
        plan_name: 'premium',
        display_name: 'Premium Plan',
        description: 'Advanced features for serious financial management',
        price_monthly: 999.00,
        price_yearly: 9990.00,
        features: ['Up to 10 bank accounts', 'Advanced analytics', 'Investment tracking', 'Family sharing (up to 4 members)', 'Priority support', 'Export reports'],
        max_accounts: 10,
        max_family_members: 4,
        allowed_account_types: ['cash', 'bank', 'investment', 'credit_card'],
        is_active: true,
        sort_order: 2
      }
    ];

    const { error: plansError } = await supabase
      .from('subscription_plans')
      .upsert(plansToCreate, {
        onConflict: 'plan_name',
        ignoreDuplicates: true
      });

    if (plansError) {
      console.error('Error creating plans:', plansError);
    }

    // Create payment methods
    const methodsToCreate = [
      {
        method_name: 'bkash',
        display_name: 'bKash',
        description: 'Pay with bKash mobile banking',
        instructions: 'Send money to 01711000000 and use your email as reference. Share the transaction ID.',
        is_active: true,
        sort_order: 1
      },
      {
        method_name: 'nagad',
        display_name: 'Nagad',
        description: 'Pay with Nagad mobile banking',
        instructions: 'Send money to 01511000000 with reference "FinMate-Sub". Provide transaction ID after payment.',
        is_active: true,
        sort_order: 2
      },
      {
        method_name: 'manual',
        display_name: 'Manual Payment',
        description: 'Manual payment processing by admin',
        instructions: 'Payment processed manually by system administrator.',
        is_active: true,
        sort_order: 99
      }
    ];

    const { error: methodsError } = await supabase
      .from('payment_methods')
      .upsert(methodsToCreate, {
        onConflict: 'method_name',
        ignoreDuplicates: true
      });

    if (methodsError) {
      console.error('Error creating payment methods:', methodsError);
    }

    // Create coupons
    const couponsToCreate = [
      {
        code: 'WELCOME25',
        type: 'percentage',
        value: 25.00,
        description: 'Welcome discount for new users - 25% off first subscription',
        minimum_amount: 100.00,
        max_uses: 1000,
        max_uses_per_user: 1,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        is_active: true
      },
      {
        code: 'EARLYBIRD50',
        type: 'fixed',
        value: 500.00,
        description: 'Early bird special - 500 BDT off any plan',
        minimum_amount: 500.00,
        max_uses: 500,
        max_uses_per_user: 1,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        is_active: true
      }
    ];

    const { error: couponsError } = await supabase
      .from('coupons')
      .upsert(couponsToCreate, {
        onConflict: 'code',
        ignoreDuplicates: true
      });

    if (couponsError) {
      console.error('Error creating coupons:', couponsError);
    }

    // Check what was created
    const [plansResult, methodsResult, couponsResult] = await Promise.all([
      supabase.from('subscription_plans').select('plan_name, is_active').eq('is_active', true),
      supabase.from('payment_methods').select('method_name, is_active').eq('is_active', true),
      supabase.from('coupons').select('code, is_active').eq('is_active', true)
    ]);

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      data: {
        plans: plansResult.data?.length || 0,
        methods: methodsResult.data?.length || 0,
        coupons: couponsResult.data?.length || 0,
        sample_plans: plansResult.data?.map(p => p.plan_name) || [],
        sample_methods: methodsResult.data?.map(m => m.method_name) || [],
        sample_coupons: couponsResult.data?.map(c => c.code) || [],
        errors: {
          plans: plansError?.message,
          methods: methodsError?.message,
          coupons: couponsError?.message
        }
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}