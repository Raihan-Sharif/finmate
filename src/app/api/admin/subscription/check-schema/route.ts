import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('=== SCHEMA CHECK START ===')

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const results: any = {}

    // 1. Check subscription_payments table column types
    console.log('Checking subscription_payments table...')
    const { data: paymentsSchema, error: paymentsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, character_maximum_length, is_nullable')
      .eq('table_name', 'subscription_payments')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    results.subscription_payments = { data: paymentsSchema, error: paymentsError }
    console.log('subscription_payments schema:', { data: paymentsSchema, error: paymentsError })

    // 2. Check subscription_plans table column types
    console.log('Checking subscription_plans table...')
    const { data: plansSchema, error: plansError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, character_maximum_length, is_nullable')
      .eq('table_name', 'subscription_plans')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    results.subscription_plans = { data: plansSchema, error: plansError }
    console.log('subscription_plans schema:', { data: plansSchema, error: plansError })

    // 3. Check payment_methods table column types
    console.log('Checking payment_methods table...')
    const { data: methodsSchema, error: methodsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, character_maximum_length, is_nullable')
      .eq('table_name', 'payment_methods')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    results.payment_methods = { data: methodsSchema, error: methodsError }
    console.log('payment_methods schema:', { data: methodsSchema, error: methodsError })

    // 4. Check profiles table column types
    console.log('Checking profiles table...')
    const { data: profilesSchema, error: profilesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, character_maximum_length, is_nullable')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    results.profiles = { data: profilesSchema, error: profilesError }
    console.log('profiles schema:', { data: profilesSchema, error: profilesError })

    // 5. Check coupons table column types
    console.log('Checking coupons table...')
    const { data: couponsSchema, error: couponsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, character_maximum_length, is_nullable')
      .eq('table_name', 'coupons')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    results.coupons = { data: couponsSchema, error: couponsError }
    console.log('coupons schema:', { data: couponsSchema, error: couponsError })

    // 6. Check user_subscriptions table column types
    console.log('Checking user_subscriptions table...')
    const { data: subscriptionsSchema, error: subscriptionsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, character_maximum_length, is_nullable')
      .eq('table_name', 'user_subscriptions')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    results.user_subscriptions = { data: subscriptionsSchema, error: subscriptionsError }
    console.log('user_subscriptions schema:', { data: subscriptionsSchema, error: subscriptionsError })

    // 7. Test a simple query to see what the actual data types are when selected
    console.log('Testing actual data types...')
    try {
      const { data: testData, error: testError } = await supabase
        .from('subscription_payments')
        .select(`
          id,
          plan_id,
          transaction_id,
          sender_number,
          currency
        `)
        .limit(1)

      results.test_query = { data: testData, error: testError }
      console.log('Test query result:', { data: testData, error: testError })
    } catch (testErr) {
      console.log('Test query failed:', testErr)
      results.test_query = { error: testErr }
    }

    console.log('=== SCHEMA CHECK END ===')

    return NextResponse.json({
      success: true,
      message: 'Schema check completed - see console for details',
      results
    })

  } catch (error: any) {
    console.error('Schema Check API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}