'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase/client'

export interface LendingRecord {
  id: string
  user_id: string
  person_name: string
  amount: number
  pending_amount: number
  interest_rate: number
  date: string
  due_date: string | null
  currency: string
  type: 'lent' | 'borrowed'
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  account_id: string | null
  category_id: string | null
  reminder_days: number
  contact_info: any
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LendingPayment {
  id: string
  user_id: string
  lending_id: string
  payment_date: string
  amount: number
  account_id: string | null
  transaction_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function useLending() {
  const { user } = useAuth()
  const [lendings, setLendings] = useState<LendingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLendings = useCallback(async () => {
    if (!user) {
      setLendings([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('lending')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setLendings(data || [])
    } catch (err) {
      console.error('Error fetching lendings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch lending records')
      setLendings([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchLendings()
  }, [fetchLendings])

  const addLending = useCallback(async (lendingData: any) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const { data, error: insertError } = await supabase
        .from('lending')
        .insert([{
          ...lendingData,
          user_id: user.id
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // Create initial transaction based on type
      const transactionType = lendingData.type === 'lent' ? 'lending_given' : 'lending_received'
      
      const { error: transactionError } = await supabase.rpc('create_lending_transaction', {
        p_lending_id: data.id,
        p_user_id: user.id,
        p_amount: lendingData.amount,
        p_transaction_type: transactionType,
        p_payment_date: lendingData.date
      })

      if (transactionError) {
        console.error('Error creating lending transaction:', transactionError)
      }

      await fetchLendings()
      return { success: true, data }
    } catch (err) {
      console.error('Error adding lending:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add lending record' }
    }
  }, [user, fetchLendings])

  const editLending = useCallback(async (id: string, updates: any) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const { data, error: updateError } = await supabase
        .from('lending')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchLendings()
      return { success: true, data }
    } catch (err) {
      console.error('Error updating lending:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update lending record' }
    }
  }, [user, fetchLendings])

  const removeLending = useCallback(async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      // First delete all associated payments
      await supabase
        .from('lending_payments')
        .delete()
        .eq('lending_id', id)
        .eq('user_id', user.id)

      // Then delete the lending record
      const { error: deleteError } = await supabase
        .from('lending')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      await fetchLendings()
      return { success: true }
    } catch (err) {
      console.error('Error deleting lending:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete lending record' }
    }
  }, [user, fetchLendings])

  const addPayment = useCallback(async (lendingId: string, paymentData: any) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      // Get the lending record first
      const { data: lending, error: lendingError } = await supabase
        .from('lending')
        .select('*')
        .eq('id', lendingId)
        .eq('user_id', user.id)
        .single()

      if (lendingError) throw lendingError

      // Create the lending transaction using the database function
      const transactionType = paymentData.transaction_type || 
        (lending.type === 'lent' ? 'repayment_received' : 'repayment_made')

      const { data: result, error: transactionError } = await supabase.rpc('create_lending_transaction', {
        p_lending_id: lendingId,
        p_user_id: user.id,
        p_amount: paymentData.amount,
        p_transaction_type: transactionType,
        p_payment_date: paymentData.payment_date
      })

      if (transactionError) throw transactionError

      // If account is specified, update the transaction with account and affect account balance
      if (paymentData.account_id && result?.transaction_id) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            account_id: paymentData.account_id,
            category_id: lending.category_id,
            subcategory_id: lending.subcategory_id,
            description: `${transactionType === 'repayment_received' ? 'Repayment received from' : 'Repayment made to'} ${lending.person_name}`,
            notes: paymentData.notes
          })
          .eq('id', result.transaction_id)

        if (updateError) {
          console.error('Error updating transaction:', updateError)
        }

        // Update account balance
        const balanceChange = transactionType === 'repayment_received' ? paymentData.amount : -paymentData.amount
        
        // First get current balance
        const { data: accountData, error: getAccountError } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', paymentData.account_id)
          .eq('user_id', user.id)
          .single()

        if (getAccountError) {
          console.error('Error getting account:', getAccountError)
        } else if (accountData) {
          const newBalance = accountData.balance + balanceChange
          const { error: balanceError } = await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', paymentData.account_id)
            .eq('user_id', user.id)

          if (balanceError) {
            console.error('Error updating account balance:', balanceError)
          }
        }

        // Update budget if category is specified
        if (lending.category_id || lending.subcategory_id) {
          const { error: budgetError } = await supabase.rpc('update_budget_for_expense', {
            p_user_id: user.id,
            p_category_id: lending.subcategory_id || lending.category_id,
            p_amount: paymentData.amount,
            p_transaction_date: paymentData.payment_date
          })

          if (budgetError) {
            console.error('Error updating budget:', budgetError)
          }
        }
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from('lending_payments')
        .insert([{
          user_id: user.id,
          lending_id: lendingId,
          payment_date: paymentData.payment_date,
          amount: paymentData.amount,
          account_id: paymentData.account_id,
          notes: paymentData.notes,
          transaction_id: result?.transaction_id
        }])

      if (paymentError) throw paymentError

      await fetchLendings()
      return { success: true, data: result }
    } catch (err) {
      console.error('Error adding payment:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add payment' }
    }
  }, [user, fetchLendings])

  const getLendingPayments = useCallback(async (lendingId: string) => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const { data, error: fetchError } = await supabase
        .from('lending_payments')
        .select('*')
        .eq('lending_id', lendingId)
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false })

      if (fetchError) throw fetchError

      return { success: true, data: data || [] }
    } catch (err) {
      console.error('Error fetching lending payments:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch payments' }
    }
  }, [user])

  const refreshLendings = useCallback(() => {
    fetchLendings()
  }, [fetchLendings])

  return {
    lendings,
    loading,
    error,
    addLending,
    editLending,
    removeLending,
    addPayment,
    getLendingPayments,
    refreshLendings,
  }
}