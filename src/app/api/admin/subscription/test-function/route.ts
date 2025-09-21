import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('=== FUNCTION TEST START ===')

    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Testing with user ID:', user.id)

    // Test the original database function
    console.log('=== Testing admin_get_subscription_payments function ===')

    try {
      const functionResult = await supabase
        .rpc('admin_get_subscription_payments', {
          p_admin_user_id: user.id,
          p_status: null,
          p_limit: 10,
          p_offset: 0
        })

      console.log('Function call result:', {
        data: functionResult.data,
        error: functionResult.error,
        dataCount: functionResult.data?.length || 0,
        sampleRecord: functionResult.data?.[0] || null
      })

      if (functionResult.error) {
        console.error('Function error details:', functionResult.error)
      }

    } catch (funcError) {
      console.error('Function call exception:', funcError)
    }

    // Test enhanced function with search parameter
    console.log('=== Testing enhanced admin_get_subscription_payments function ===')

    try {
      const enhancedResult = await supabase
        .rpc('admin_get_subscription_payments', {
          p_admin_user_id: user.id,
          p_status: null,
          p_search: null,
          p_limit: 10,
          p_offset: 0
        })

      console.log('Enhanced function result:', {
        data: enhancedResult.data,
        error: enhancedResult.error,
        dataCount: enhancedResult.data?.length || 0,
        sampleRecord: enhancedResult.data?.[0] || null
      })

      if (enhancedResult.error) {
        console.error('Enhanced function error details:', enhancedResult.error)
      }

    } catch (enhancedError) {
      console.error('Enhanced function call exception:', enhancedError)
    }

    // Test direct table queries
    console.log('=== Testing direct table queries ===')

    // Check subscription_payments table
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('subscription_payments')
      .select('*')
      .limit(5)

    console.log('subscription_payments table:', {
      data: paymentsData,
      error: paymentsError,
      count: paymentsData?.length || 0
    })

    // Check subscription_plans table
    const { data: plansData, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .limit(5)

    console.log('subscription_plans table:', {
      data: plansData,
      error: plansError,
      count: plansData?.length || 0
    })

    // Check payment_methods table
    const { data: methodsData, error: methodsError } = await supabase
      .from('payment_methods')
      .select('*')
      .limit(5)

    console.log('payment_methods table:', {
      data: methodsData,
      error: methodsError,
      count: methodsData?.length || 0
    })

    // Check user permissions
    console.log('=== Testing user permissions ===')

    try {
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_user_profile', { p_user_id: user.id })

      console.log('User profile result:', {
        data: profileData,
        error: profileError,
        roleInfo: profileData?.[0] || null
      })

    } catch (profileErr) {
      console.error('Profile check exception:', profileErr)
    }

    // Check roles directly
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('*')

    console.log('roles table:', {
      data: rolesData,
      error: rolesError,
      count: rolesData?.length || 0
    })

    // Check profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)

    console.log('user profile from profiles table:', {
      data: profilesData,
      error: profilesError,
      count: profilesData?.length || 0
    })

    // Check schema information
    console.log('=== SCHEMA CHECKING ===')

    try {
      // Use raw SQL to get schema information
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('sql', {
          query: `
            SELECT
              t.table_name,
              c.column_name,
              c.data_type,
              c.character_maximum_length,
              c.is_nullable,
              c.ordinal_position
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            WHERE t.table_schema = 'public'
              AND t.table_name IN ('subscription_payments', 'subscription_plans', 'payment_methods', 'profiles', 'coupons', 'user_subscriptions')
            ORDER BY t.table_name, c.ordinal_position;
          `
        })

      console.log('Schema information:', {
        data: schemaData,
        error: schemaError,
        count: schemaData?.length || 0
      })

    } catch (schemaErr) {
      console.error('Schema check exception:', schemaErr)
    }

    console.log('=== FUNCTION TEST END ===')

    return NextResponse.json({
      success: true,
      message: 'Function tests completed - check console for detailed results',
      user_id: user.id
    })

  } catch (error: any) {
    console.error('Test API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}