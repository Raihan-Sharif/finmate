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

    // Return empty data until proper subscription system is set up
    console.log('Subscription admin API called - returning empty data')

    return NextResponse.json({
      success: true,
      payments: [],
      total: 0,
      hasMore: false,
      message: 'Subscription system is being set up - no data available yet'
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    return NextResponse.json({
      success: false,
      message: 'Subscription payment updates not available yet'
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}