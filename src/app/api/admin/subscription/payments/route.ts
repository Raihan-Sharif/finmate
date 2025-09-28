import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getSubscriptionPayments,
  updatePaymentStatus,
  getSubscriptionPaymentById,
  updateSubscriptionPayment,
  deleteSubscriptionPayment,
  bulkUpdatePaymentStatus
} from '@/lib/services/subscription-admin'

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

    // Get query parameters for filtering
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'all'
    const search = url.searchParams.get('search') || ''
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const paymentId = url.searchParams.get('id')

    // If requesting a specific payment
    if (paymentId) {
      const payment = await getSubscriptionPaymentById(user.id, paymentId)

      if (!payment) {
        return NextResponse.json(
          { success: false, message: 'Payment not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        payment
      })
    }

    // Use our comprehensive service function
    const options: any = { limit, offset };
    if (status !== 'all') {
      options.status = status;
    }
    if (search) {
      options.search = search;
    }
    const result = await getSubscriptionPayments(user.id, options)

    return NextResponse.json({
      success: true,
      payments: result.payments,
      total: result.total,
      hasMore: result.hasMore,
      pagination: {
        limit,
        offset,
        total: result.total
      }
    })

  } catch (error: any) {
    console.error('API Error:', error)

    // Handle specific error cases
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
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

    const body = await request.json()
    const { action, paymentId, paymentIds, ...options } = body

    if (action === 'update_status') {
      if (!paymentId || !options.status) {
        return NextResponse.json(
          { success: false, message: 'Payment ID and status are required' },
          { status: 400 }
        )
      }

      const updateOptions: any = {};
      if (options.adminNotes) {
        updateOptions.adminNotes = options.adminNotes;
      }
      if (options.rejectionReason) {
        updateOptions.rejectionReason = options.rejectionReason;
      }

      const result = await updatePaymentStatus(
        user.id,
        paymentId,
        options.status,
        updateOptions
      )

      return NextResponse.json(result)
    }

    if (action === 'bulk_update_status') {
      if (!paymentIds?.length || !options.status) {
        return NextResponse.json(
          { success: false, message: 'Payment IDs and status are required' },
          { status: 400 }
        )
      }

      const bulkOptions: any = {};
      if (options.adminNotes) {
        bulkOptions.adminNotes = options.adminNotes;
      }
      if (options.rejectionReason) {
        bulkOptions.rejectionReason = options.rejectionReason;
      }

      const result = await bulkUpdatePaymentStatus(
        user.id,
        paymentIds,
        options.status,
        bulkOptions
      )

      return NextResponse.json(result)
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action specified' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('API Error:', error)

    // Handle specific error cases
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const paymentId = url.searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'Payment ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Use our comprehensive service function
    const result = await updateSubscriptionPayment(user.id, paymentId, body)

    return NextResponse.json({
      success: result.success,
      message: result.message,
      payment: result.data
    })

  } catch (error: any) {
    console.error('API Error:', error)

    // Handle specific error cases
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 }
      )
    }

    if (error.message.includes('approved payments')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const paymentId = url.searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Use our comprehensive service function
    const result = await deleteSubscriptionPayment(user.id, paymentId)

    return NextResponse.json({
      success: result.success,
      message: result.message
    })

  } catch (error: any) {
    console.error('API Error:', error)

    // Handle specific error cases
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 }
      )
    }

    if (error.message.includes('approved payments') || error.message.includes('active subscription')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}