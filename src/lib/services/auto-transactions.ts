import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Insert']
type Loan = Database['public']['Tables']['loans']['Row']
type Lending = Database['public']['Tables']['lending']['Row']

const supabase = createClient()

// ========================
// Auto Transaction Creation for Loans/EMIs
// ========================

export async function createLoanPaymentTransaction(loan: Loan, paymentDate: string): Promise<{ success: boolean; error: string | null; transactionId?: string }> {
  try {
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Use database function for comprehensive payment processing
    const { data, error } = await supabase.rpc('create_loan_payment_transaction', {
      p_loan_id: loan.id,
      p_user_id: user.data.user.id,
      p_payment_date: paymentDate
    })

    if (error) {
      console.error('Error calling create_loan_payment_transaction:', error)
      return { success: false, error: error.message }
    }

    if (!data.success) {
      return { success: false, error: data.error }
    }

    return { 
      success: true, 
      error: null, 
      transactionId: data.transaction_id 
    }
  } catch (error) {
    console.error('Error in createLoanPaymentTransaction:', error)
    return { success: false, error: 'Failed to create loan payment transaction' }
  }
}

// ========================
// Auto Transaction Creation for Lending/Borrowing
// ========================

export async function createLendingTransaction(lending: Lending, amount: number, type: 'lent' | 'borrowed' | 'repayment_received' | 'repayment_made'): Promise<{ success: boolean; error: string | null; transactionId?: string }> {
  try {
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Use database function for lending transactions
    const { data, error } = await supabase.rpc('create_lending_transaction', {
      p_lending_id: lending.id,
      p_user_id: user.data.user.id,
      p_amount: amount,
      p_transaction_type: type,
      p_payment_date: new Date().toISOString().split('T')[0]
    })

    if (error) {
      console.error('Error calling create_lending_transaction:', error)
      return { success: false, error: error.message }
    }

    if (!data.success) {
      return { success: false, error: data.error }
    }

    return { 
      success: true, 
      error: null, 
      transactionId: data.transaction_id 
    }
  } catch (error) {
    console.error('Error in createLendingTransaction:', error)
    return { success: false, error: 'Failed to create lending transaction' }
  }
}

// ========================
// Budget Update Functions
// ========================
// Note: Budget updates are now handled by database functions

// ========================
// Automatic Processing Functions
// ========================

export async function processAutoDebitLoans(): Promise<{ processed: number; errors: string[] }> {
  try {
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      return { processed: 0, errors: ['User not authenticated'] }
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Use database function to process all auto debit payments
    const { data, error } = await supabase.rpc('process_auto_debit_payments', {
      p_user_id: user.data.user.id,
      p_process_date: today
    })

    if (error) {
      console.error('Error calling process_auto_debit_payments:', error)
      return { processed: 0, errors: [error.message] }
    }

    if (!data.success) {
      return { processed: 0, errors: [data.error] }
    }

    return { 
      processed: data.processed, 
      errors: data.errors || [] 
    }
  } catch (error) {
    console.error('Error in processAutoDebitLoans:', error)
    return { processed: 0, errors: ['Failed to process auto debit loans'] }
  }
}

// ========================
// Reminder System Functions
// ========================

export async function createPaymentReminders(): Promise<{ created: number; errors: string[] }> {
  try {
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      return { created: 0, errors: ['User not authenticated'] }
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Use database function to create all payment reminders
    const { data, error } = await supabase.rpc('create_payment_reminders', {
      p_user_id: user.data.user.id,
      p_check_date: today
    })

    if (error) {
      console.error('Error calling create_payment_reminders:', error)
      return { created: 0, errors: [error.message] }
    }

    if (!data.success) {
      return { created: 0, errors: [data.error] }
    }

    return { 
      created: data.created, 
      errors: data.errors || [] 
    }
  } catch (error) {
    console.error('Error in createPaymentReminders:', error)
    return { created: 0, errors: ['Failed to create payment reminders'] }
  }
}

// ========================
// Utility Functions
// ========================

export function calculateNextDueDate(currentDueDate: string, paymentDay: number): string {
  const current = new Date(currentDueDate)
  const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, paymentDay)
  return nextMonth.toISOString().split('T')[0] || ''
}

export function isPaymentOverdue(dueDate: string): boolean {
  const today = new Date()
  const due = new Date(dueDate)
  return due < today
}

export function getDaysUntilDue(dueDate: string): number {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}