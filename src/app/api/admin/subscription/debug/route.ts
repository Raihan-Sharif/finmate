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

    // Debug database state
    const debug: {
      tables: Record<string, boolean>
      counts: Record<string, number>
      samples: Record<string, any[]>
    } = {
      tables: {},
      counts: {},
      samples: {}
    }

    // Check subscription_plans
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .limit(5)

    debug.tables.subscription_plans = !plansError
    debug.counts.subscription_plans = plans?.length || 0
    debug.samples.subscription_plans = plans || []

    // Check payment_methods
    const { data: methods, error: methodsError } = await supabase
      .from('payment_methods')
      .select('*')
      .limit(5)

    debug.tables.payment_methods = !methodsError
    debug.counts.payment_methods = methods?.length || 0
    debug.samples.payment_methods = methods || []

    // Check subscription_payments
    const { data: payments, error: paymentsError } = await supabase
      .from('subscription_payments')
      .select('*')
      .limit(5)

    debug.tables.subscription_payments = !paymentsError
    debug.counts.subscription_payments = payments?.length || 0
    debug.samples.subscription_payments = payments || []

    // Check user_subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(5)

    debug.tables.user_subscriptions = !subscriptionsError
    debug.counts.user_subscriptions = subscriptions?.length || 0
    debug.samples.user_subscriptions = subscriptions || []

    // Check coupons
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*')
      .limit(5)

    debug.tables.coupons = !couponsError
    debug.counts.coupons = coupons?.length || 0
    debug.samples.coupons = coupons || []

    return NextResponse.json({
      success: true,
      debug,
      user_id: user.id,
      user_role: profile[0]?.role_name
    })

  } catch (error: any) {
    console.error('Debug API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
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

    // Check if user has admin permissions
    const { data: profile, error: profileError } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })

    if (!profile?.[0]?.role_name || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create_sample_data') {
      // Create sample subscription plans if none exist
      const { data: existingPlans } = await supabase
        .from('subscription_plans')
        .select('id')

      if (!existingPlans || existingPlans.length === 0) {
        const { error: plansError } = await supabase
          .from('subscription_plans')
          .insert([
            {
              plan_name: 'basic',
              display_name: 'Basic Plan',
              description: 'Basic features for personal use',
              price_monthly: 99,
              price_yearly: 999,
              features: ['Up to 3 accounts', 'Basic reports', 'Mobile app'],
              max_accounts: 3,
              max_family_members: 1,
              is_active: true,
              sort_order: 1
            },
            {
              plan_name: 'premium',
              display_name: 'Premium Plan',
              description: 'Advanced features for power users',
              price_monthly: 199,
              price_yearly: 1999,
              features: ['Unlimited accounts', 'Advanced analytics', 'Priority support'],
              max_accounts: 10,
              max_family_members: 5,
              is_active: true,
              sort_order: 2
            }
          ])

        if (plansError) {
          console.error('Error creating sample plans:', plansError)
        }
      }

      // Create sample payment methods if none exist
      const { data: existingMethods } = await supabase
        .from('payment_methods')
        .select('id')

      if (!existingMethods || existingMethods.length === 0) {
        const { data: newMethods, error: methodsError } = await supabase
          .from('payment_methods')
          .insert([
            {
              method_name: 'bkash',
              display_name: 'bKash',
              description: 'Mobile banking payment via bKash',
              account_info: { number: '01XXXXXXXXX', type: 'personal' },
              instructions: 'Send money to the provided bKash number and enter transaction ID',
              is_active: true,
              sort_order: 1
            },
            {
              method_name: 'nagad',
              display_name: 'Nagad',
              description: 'Mobile banking payment via Nagad',
              account_info: { number: '01XXXXXXXXX', type: 'personal' },
              instructions: 'Send money to the provided Nagad number and enter transaction ID',
              is_active: true,
              sort_order: 2
            },
            {
              method_name: 'manual',
              display_name: 'Manual Payment',
              description: 'Manual payment processing by admin',
              account_info: { type: 'manual' },
              instructions: 'Admin will process this payment manually',
              is_active: true,
              sort_order: 99
            }
          ])
          .select()

        if (methodsError) {
          console.error('Error creating sample payment methods:', methodsError)
        } else {
          console.log('Created sample payment methods:', newMethods?.length)
        }
      }

      // Create sample subscription payment records if needed
      const { data: existingPayments } = await supabase
        .from('subscription_payments')
        .select('id')

      if (!existingPayments || existingPayments.length === 0) {
        // Get the created plans and payment methods for sample data
        const { data: plans } = await supabase
          .from('subscription_plans')
          .select('id')
          .limit(1)

        const { data: methods } = await supabase
          .from('payment_methods')
          .select('id')
          .limit(1)

        if (plans && plans.length > 0 && methods && methods.length > 0) {
          const { data: samplePayments, error: paymentsError } = await supabase
            .from('subscription_payments')
            .insert([
              {
                user_id: user.id, // Using current admin user for demo
                plan_id: plans[0]?.id,
                payment_method_id: methods[0]?.id,
                billing_cycle: 'monthly',
                transaction_id: 'DEMO_' + Date.now(),
                sender_number: '01XXXXXXXXX',
                base_amount: 199,
                discount_amount: 0,
                final_amount: 199,
                status: 'submitted',
                submitted_at: new Date().toISOString(),
                currency: 'BDT'
              }
            ])
            .select()

          if (paymentsError) {
            console.error('Error creating sample payments:', paymentsError)
          } else {
            console.log('Created sample payment records:', samplePayments?.length)
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Sample data created successfully'
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Debug POST API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}