import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  processAutoDebitLoans, 
  createPaymentReminders, 
  createLoanPaymentTransaction, 
  createLendingTransaction 
} from '@/lib/services/auto-transactions'
import { useAppStore } from '@/lib/stores/useAppStore'

const supabase = createClient()

export function useAutoTransactions() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastProcessed, setLastProcessed] = useState<string | null>(null)
  const { profile } = useAppStore()

  // Check if auto processing should run (daily check)
  useEffect(() => {
    const checkAutoProcessing = async () => {
      if (!profile?.user_id) return

      const today = new Date().toDateString()
      const lastProcessedDate = localStorage.getItem('lastAutoProcessed')

      // Run auto processing once per day
      if (lastProcessedDate !== today) {
        setIsProcessing(true)
        
        try {
          // Process auto debit loans
          const loanResults = await processAutoDebitLoans()
          console.log('Auto debit processing:', loanResults)

          // Create payment reminders
          const reminderResults = await createPaymentReminders()
          console.log('Reminder creation:', reminderResults)

          localStorage.setItem('lastAutoProcessed', today)
          setLastProcessed(today)
        } catch (error) {
          console.error('Error in auto processing:', error)
        } finally {
          setIsProcessing(false)
        }
      }
    }

    // Run check on mount and then every hour
    checkAutoProcessing()
    const interval = setInterval(checkAutoProcessing, 60 * 60 * 1000) // 1 hour

    return () => clearInterval(interval)
  }, [profile?.user_id])

  // Manual functions for specific operations
  const processLoanPayment = async (loanId: string, paymentDate: string) => {
    setIsProcessing(true)
    try {
      // This would need to fetch the loan first
      const { data: loan } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single()

      if (loan) {
        const result = await createLoanPaymentTransaction(loan, paymentDate)
        return result
      }
      return { success: false, error: 'Loan not found' }
    } catch (error) {
      console.error('Error processing loan payment:', error)
      return { success: false, error: 'Failed to process loan payment' }
    } finally {
      setIsProcessing(false)
    }
  }

  const processLendingTransaction = async (
    lendingId: string, 
    amount: number, 
    type: 'lent' | 'borrowed' | 'repayment_received' | 'repayment_made'
  ) => {
    setIsProcessing(true)
    try {
      // This would need to fetch the lending record first
      const { data: lending } = await supabase
        .from('lending')
        .select('*')
        .eq('id', lendingId)
        .single()

      if (lending) {
        const result = await createLendingTransaction(lending, amount, type)
        return result
      }
      return { success: false, error: 'Lending record not found' }
    } catch (error) {
      console.error('Error processing lending transaction:', error)
      return { success: false, error: 'Failed to process lending transaction' }
    } finally {
      setIsProcessing(false)
    }
  }

  const manualReminderCheck = async () => {
    setIsProcessing(true)
    try {
      const result = await createPaymentReminders()
      return result
    } catch (error) {
      console.error('Error creating reminders:', error)
      return { created: 0, errors: ['Failed to create reminders'] }
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    isProcessing,
    lastProcessed,
    processLoanPayment,
    processLendingTransaction,
    manualReminderCheck
  }
}

// Hook for checking pending reminders and auto debit status
export function usePaymentStatus() {
  const [pendingReminders, setPendingReminders] = useState(0)
  const [dueTodayCount, setDueTodayCount] = useState(0)
  const [overdueCount, setOverdueCount] = useState(0)
  const { profile } = useAppStore()

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!profile?.user_id) return

      try {
        const today = new Date().toISOString().split('T')[0]

        // Get loans due today
        const { data: dueToday } = await supabase
          .from('loans')
          .select('id')
          .eq('user_id', profile.user_id)
          .eq('status', 'active')
          .eq('next_due_date', today)

        // Get overdue loans
        const { data: overdue } = await supabase
          .from('loans')
          .select('id')
          .eq('user_id', profile.user_id)
          .eq('status', 'active')
          .lt('next_due_date', today)

        // Get unread payment reminders
        const { data: reminders } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', profile.user_id)
          .eq('category', 'loan')
          .eq('read', false)

        setDueTodayCount(dueToday?.length || 0)
        setOverdueCount(overdue?.length || 0)
        setPendingReminders(reminders?.length || 0)
      } catch (error) {
        console.error('Error fetching payment status:', error)
      }
    }

    fetchPaymentStatus()
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchPaymentStatus, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [profile?.user_id])

  return {
    pendingReminders,
    dueTodayCount,
    overdueCount
  }
}