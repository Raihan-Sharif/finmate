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

    // Fetch subscription overview data using direct queries

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get active subscriptions count
    const { count: activeSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString())

    // Get pending payments count
    const { count: pendingPayments } = await supabase
      .from('subscription_payments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'submitted'])

    // Get total revenue from approved payments
    const { data: totalRevenueData } = await supabase
      .from('subscription_payments')
      .select('final_amount')
      .eq('status', 'approved')

    const totalRevenue = totalRevenueData?.reduce((sum, payment) => sum + (payment.final_amount || 0), 0) || 0

    // Get monthly revenue (current month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: monthlyRevenueData } = await supabase
      .from('subscription_payments')
      .select('final_amount')
      .eq('status', 'approved')
      .gte('created_at', startOfMonth.toISOString())

    const monthlyRevenue = monthlyRevenueData?.reduce((sum, payment) => sum + (payment.final_amount || 0), 0) || 0

    // Get coupon usage count
    const { count: couponUsage } = await supabase
      .from('subscription_payments')
      .select('*', { count: 'exact', head: true })
      .not('coupon_id', 'is', null)

    const overview = {
      total_users: totalUsers || 0,
      active_subscriptions: activeSubscriptions || 0,
      pending_payments: pendingPayments || 0,
      total_revenue: totalRevenue,
      monthly_revenue: monthlyRevenue,
      coupon_usage: couponUsage || 0
    }

    // Get additional metrics not in the overview function

    // Get total active coupons
    const { count: activeCoupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (couponsError) {
      console.error('Error fetching active coupons:', couponsError)
    }

    // Get subscription plans count
    const { count: totalPlans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (plansError) {
      console.error('Error fetching subscription plans:', plansError)
    }

    console.log('Overview data:', {
      overview,
      activeCoupons,
      totalPlans
    });

    return NextResponse.json({
      success: true,
      overview: {
        ...overview,
        active_coupons: activeCoupons || 0,
        total_plans: totalPlans || 0
      }
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}