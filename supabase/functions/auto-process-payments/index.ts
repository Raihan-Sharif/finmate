// Supabase Edge Function for Auto Payment Processing
// Deploy with: supabase functions deploy auto-process-payments

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date().toISOString().split('T')[0]
    let totalProcessed = 0
    let totalReminders = 0
    const errors: string[] = []

    // Get all users who have active loans with auto_debit
    const { data: usersWithAutoDebit, error: usersError } = await supabaseAdmin
      .from('loans')
      .select('user_id')
      .eq('status', 'active')
      .eq('auto_debit', true)
      .eq('next_due_date', today)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(usersWithAutoDebit?.map(loan => loan.user_id) || [])]

    // Process auto debit payments for each user
    for (const userId of uniqueUserIds) {
      try {
        // Process auto debit payments
        const { data: paymentResult, error: paymentError } = await supabaseAdmin
          .rpc('process_auto_debit_payments', {
            p_user_id: userId,
            p_process_date: today
          })

        if (paymentError) {
          errors.push(`Payment processing error for user ${userId}: ${paymentError.message}`)
        } else if (paymentResult) {
          totalProcessed += paymentResult.processed || 0
          if (paymentResult.errors?.length > 0) {
            errors.push(...paymentResult.errors)
          }
        }

        // Create payment reminders
        const { data: reminderResult, error: reminderError } = await supabaseAdmin
          .rpc('create_payment_reminders', {
            p_user_id: userId,
            p_check_date: today
          })

        if (reminderError) {
          errors.push(`Reminder creation error for user ${userId}: ${reminderError.message}`)
        } else if (reminderResult) {
          totalReminders += reminderResult.created || 0
          if (reminderResult.errors?.length > 0) {
            errors.push(...reminderResult.errors)
          }
        }

      } catch (userError) {
        errors.push(`Error processing user ${userId}: ${userError.message}`)
      }
    }

    // Log the processing results
    await supabaseAdmin
      .from('system_logs')
      .insert({
        log_type: 'auto_payment_processing',
        message: `Processed ${totalProcessed} payments and created ${totalReminders} reminders`,
        metadata: {
          date: today,
          users_processed: uniqueUserIds.length,
          payments_processed: totalProcessed,
          reminders_created: totalReminders,
          errors: errors
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        users_processed: uniqueUserIds.length,
        payments_processed: totalProcessed,
        reminders_created: totalReminders,
        errors: errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Auto payment processing error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

/* 
To set up this edge function:

1. Deploy the function:
   supabase functions deploy auto-process-payments

2. Set up a cron job to call this function daily:
   
   Option A: Using cron-job.org or similar service
   - URL: https://your-project.supabase.co/functions/v1/auto-process-payments
   - Schedule: Daily at desired time (e.g., 9:00 AM)
   - Add Authorization header with your anon key

   Option B: Using GitHub Actions (see next file)
   
   Option C: Using server cron job:
   # Add to crontab (crontab -e)
   0 9 * * * curl -X POST "https://your-project.supabase.co/functions/v1/auto-process-payments" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json"
*/