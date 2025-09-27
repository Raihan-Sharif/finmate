import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Check if user has admin permissions
    const { data: profile, error: profileError } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { success: false, message: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (!profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { action, count = 10 } = await request.json()

    switch (action) {
      case 'create_sample_payments':
        return await createSamplePayments(supabase, user.id, count)
      case 'create_sample_subscriptions':
        return await createSampleSubscriptions(supabase, user.id, count)
      case 'run_seed_data':
        return await runSeedData(supabase)
      case 'cleanup_test_data':
        return await cleanupTestData(supabase)
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function runSeedData(supabase: any) {
  try {
    // Run the seed data SQL script
    const seedDataSQL = `
      -- Insert subscription plans if they don't exist
      INSERT INTO "public"."subscription_plans" (
        "plan_name", "display_name", "description", "price_monthly", "price_yearly",
        "features", "max_accounts", "max_family_members", "allowed_account_types", "is_active", "sort_order"
      ) VALUES
      ('basic', 'Basic Plan', 'Perfect for individuals starting their financial journey', 499.00, 4990.00,
       '["Up to 3 bank accounts", "Basic transaction tracking", "Monthly reports", "Email support"]'::jsonb,
       3, 1, ARRAY['cash', 'bank'], true, 1),
      ('premium', 'Premium Plan', 'Advanced features for serious financial management', 999.00, 9990.00,
       '["Up to 10 bank accounts", "Advanced analytics", "Investment tracking", "Family sharing", "Priority support"]'::jsonb,
       10, 4, ARRAY['cash', 'bank', 'investment', 'credit_card'], true, 2),
      ('professional', 'Professional Plan', 'Complete financial management solution', 1999.00, 19990.00,
       '["Unlimited accounts", "Business features", "Tax planning", "API access", "Dedicated support"]'::jsonb,
       999, 10, ARRAY['cash', 'bank', 'investment', 'credit_card', 'business'], true, 3)
      ON CONFLICT (plan_name) DO NOTHING;

      -- Insert payment methods if they don't exist
      INSERT INTO "public"."payment_methods" (
        "method_name", "display_name", "description", "account_info", "instructions", "is_active", "sort_order"
      ) VALUES
      ('bkash', 'bKash', 'Pay with bKash mobile banking',
       '{"account_number": "01711000000", "reference": "FinMate"}'::jsonb,
       'Send money to 01711000000. Use your email as reference.', true, 1),
      ('nagad', 'Nagad', 'Pay with Nagad mobile banking',
       '{"account_number": "01511000000", "reference": "FinMate"}'::jsonb,
       'Send money to 01511000000. Provide transaction ID.', true, 2),
      ('manual', 'Manual Payment', 'Admin processed payment',
       '{"type": "manual"}'::jsonb,
       'Payment processed manually by administrator.', true, 99)
      ON CONFLICT (method_name) DO NOTHING;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: seedDataSQL });

    if (error) {
      console.error('Seed data error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to create seed data',
        error: error.message
      });
    }

    // Get the created data for confirmation
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('plan_name, display_name, price_monthly')
      .order('sort_order');

    const { data: methods } = await supabase
      .from('payment_methods')
      .select('method_name, display_name')
      .order('sort_order');

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      data: {
        plans: plans || [],
        payment_methods: methods || []
      }
    });

  } catch (error: any) {
    console.error('Error running seed data:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to run seed data',
      error: error.message
    });
  }
}

async function createSamplePayments(supabase: any, adminUserId: string, count: number) {
  try {
    // Get available plans and payment methods
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('id, plan_name, price_monthly, price_yearly');

    const { data: methods } = await supabase
      .from('payment_methods')
      .select('id, method_name');

    if (!plans?.length || !methods?.length) {
      return NextResponse.json({
        success: false,
        message: 'No plans or payment methods available. Run seed data first.'
      });
    }

    // Get some existing users (excluding the admin)
    const { data: users } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .not('user_id', 'eq', adminUserId)
      .limit(Math.min(count, 20));

    if (!users?.length) {
      return NextResponse.json({
        success: false,
        message: 'No users available for creating sample payments'
      });
    }

    const samplePayments = [];
    const statuses = ['pending', 'submitted', 'verified', 'approved', 'rejected'];

    for (let i = 0; i < count; i++) {
      const user = users[i % users.length];
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const billingCycle = Math.random() > 0.3 ? 'monthly' : 'yearly';
      const baseAmount = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
      const discountAmount = Math.random() > 0.7 ? Math.floor(baseAmount * 0.1) : 0;
      const finalAmount = baseAmount - discountAmount;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const payment = {
        user_id: user.user_id,
        plan_id: plan.id,
        payment_method_id: method.id,
        billing_cycle: billingCycle,
        transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        sender_number: `017${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        base_amount: baseAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        status: status,
        currency: 'BDT',
        admin_notes: status === 'approved' ? 'Payment verified by admin' : null,
        rejection_reason: status === 'rejected' ? 'Invalid transaction details' : null,
        submitted_at: status !== 'pending' ? new Date().toISOString() : null,
        verified_at: status === 'verified' || status === 'approved' ? new Date().toISOString() : null,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        rejected_at: status === 'rejected' ? new Date().toISOString() : null,
        verified_by: status === 'verified' || status === 'approved' || status === 'rejected' ? adminUserId : null,
      };

      samplePayments.push(payment);
    }

    const { data: createdPayments, error } = await supabase
      .from('subscription_payments')
      .insert(samplePayments)
      .select();

    if (error) {
      console.error('Error creating sample payments:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to create sample payments',
        error: error.message
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdPayments?.length || 0} sample payments`,
      data: {
        created_count: createdPayments?.length || 0,
        payments: createdPayments
      }
    });

  } catch (error: any) {
    console.error('Error creating sample payments:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create sample payments',
      error: error.message
    });
  }
}

async function createSampleSubscriptions(supabase: any, adminUserId: string, count: number) {
  try {
    // Get approved payments that don't have subscriptions yet
    const { data: approvedPayments } = await supabase
      .from('subscription_payments')
      .select('id, user_id, plan_id, billing_cycle, final_amount')
      .eq('status', 'approved')
      .limit(count);

    if (!approvedPayments?.length) {
      return NextResponse.json({
        success: false,
        message: 'No approved payments available for creating subscriptions'
      });
    }

    const sampleSubscriptions = [];

    for (const payment of approvedPayments) {
      // Check if subscription already exists for this user
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', payment.user_id)
        .single();

      if (existingSub) continue; // Skip if user already has subscription

      const endDate = new Date();
      if (payment.billing_cycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscription = {
        user_id: payment.user_id,
        plan_id: payment.plan_id,
        billing_cycle: payment.billing_cycle,
        payment_id: payment.id,
        status: 'active',
        end_date: endDate.toISOString(),
      };

      sampleSubscriptions.push(subscription);
    }

    if (sampleSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new subscriptions to create (users already have subscriptions)',
        data: { created_count: 0 }
      });
    }

    const { data: createdSubscriptions, error } = await supabase
      .from('user_subscriptions')
      .insert(sampleSubscriptions)
      .select();

    if (error) {
      console.error('Error creating sample subscriptions:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to create sample subscriptions',
        error: error.message
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdSubscriptions?.length || 0} sample subscriptions`,
      data: {
        created_count: createdSubscriptions?.length || 0,
        subscriptions: createdSubscriptions
      }
    });

  } catch (error: any) {
    console.error('Error creating sample subscriptions:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create sample subscriptions',
      error: error.message
    });
  }
}

async function cleanupTestData(supabase: any) {
  try {
    // Delete sample data in correct order (respecting foreign keys)
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record

    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record

    if (subError || paymentError) {
      console.error('Cleanup errors:', { subError, paymentError });
      return NextResponse.json({
        success: false,
        message: 'Failed to cleanup test data',
        error: subError?.message || paymentError?.message
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up successfully'
    });

  } catch (error: any) {
    console.error('Error cleaning up test data:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to cleanup test data',
      error: error.message
    });
  }
}