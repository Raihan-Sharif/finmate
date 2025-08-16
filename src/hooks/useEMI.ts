'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  Loan,
  LoanInsert,
  LoanUpdate,
  LoanWithRelations,
  Lending,
  LendingInsert,
  LendingUpdate,
  LendingWithRelations,
  EmiScheduleWithPayment,
  EmiTemplate,
  EMIOverview,
  LendingOverview,
  EMIFilters,
  LendingFilters,
  PaymentFormData
} from '@/types/emi'
import {
  createLoan,
  updateLoan,
  deleteLoan,
  getLoan,
  getLoans,
  createLending,
  updateLending,
  deleteLending,
  getLendings,
  getEMISchedule,
  markEMIPaymentPaid,
  createLendingPayment,
  getEMIOverview,
  getLendingOverview,
  getEMITemplates
} from '@/lib/services/emi'

// ========================
// Loan Management Hook
// ========================

export function useLoans(filters?: EMIFilters) {
  const { user } = useAuth()
  const [loans, setLoans] = useState<LoanWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLoans = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await getLoans(filters)
      
      if (error) {
        setError(error)
      } else {
        setLoans(data)
        setError(null)
      }
    } catch (err) {
      console.error('Loans Hook Exception:', err)
      setError('Failed to fetch loans')
    } finally {
      setLoading(false)
    }
  }, [user, filters])

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  const addLoan = async (loanData: LoanInsert) => {
    if (!user?.id) {
      setError('User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }
    
    const { data, error } = await createLoan({
      ...loanData,
      user_id: user.id
    })
    
    if (error) {
      setError(error)
      return { success: false, error }
    }
    
    await fetchLoans() // Refresh the list
    return { success: true, data }
  }

  const editLoan = async (id: string, updates: LoanUpdate) => {
    const { data, error } = await updateLoan(id, updates)
    
    if (error) {
      setError(error)
      return { success: false, error }
    }
    
    await fetchLoans() // Refresh the list
    return { success: true, data }
  }

  const removeLoan = async (id: string) => {
    const { success, error } = await deleteLoan(id)
    
    if (error) {
      setError(error)
      return { success: false, error }
    }
    
    await fetchLoans() // Refresh the list
    return { success: true, error: null }
  }

  const refreshLoans = () => {
    fetchLoans()
  }

  return {
    loans,
    loading,
    error,
    addLoan,
    editLoan,
    removeLoan,
    refreshLoans
  }
}

// ========================
// Single Loan Hook
// ========================

export function useLoan(loanId: string | null) {
  const [loan, setLoan] = useState<LoanWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLoan = useCallback(async () => {
    if (!loanId) {
      setLoan(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await getLoan(loanId)
    
    if (error) {
      setError(error)
      setLoan(null)
    } else {
      setLoan(data)
      setError(null)
    }
    setLoading(false)
  }, [loanId])

  useEffect(() => {
    fetchLoan()
  }, [fetchLoan])

  return { loan, loading, error }
}

// ========================
// EMI Schedule Hook
// ========================

export function useEMISchedule(loanId: string | null) {
  const [schedules, setSchedules] = useState<EmiScheduleWithPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedule = useCallback(async () => {
    if (!loanId) {
      setSchedules([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await getEMISchedule(loanId)
    
    if (error) {
      setError(error)
      setSchedules([])
    } else {
      setSchedules(data)
      setError(null)
    }
    setLoading(false)
  }, [loanId])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  const markPaymentPaid = async (scheduleId: string, paymentData: PaymentFormData) => {
    const { success, error } = await markEMIPaymentPaid(scheduleId, paymentData)
    
    if (error) {
      setError(error)
      return { success: false, error }
    }
    
    await fetchSchedule() // Refresh the schedule
    return { success: true, error: null }
  }

  const refreshSchedule = () => {
    fetchSchedule()
  }

  return {
    schedules,
    loading,
    error,
    markPaymentPaid,
    refreshSchedule
  }
}

// ========================
// Lending Management Hook
// ========================

export function useLendings(filters?: LendingFilters) {
  const { user } = useAuth()
  const [lendings, setLendings] = useState<LendingWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLendings = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await getLendings(filters)
      
      if (error) {
        setError(error)
      } else {
        setLendings(data)
        setError(null)
      }
    } catch (err) {
      console.error('Lendings Hook Exception:', err)
      setError('Failed to fetch lendings')
    } finally {
      setLoading(false)
    }
  }, [user, filters])

  useEffect(() => {
    fetchLendings()
  }, [fetchLendings])

  const addLending = async (lendingData: LendingInsert) => {
    if (!user?.id) {
      setError('User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }
    
    const { data, error } = await createLending({
      ...lendingData,
      user_id: user.id
    })
    
    if (error) {
      setError(error)
      return { success: false, error }
    }
    
    await fetchLendings() // Refresh the list
    return { success: true, data }
  }

  const editLending = async (id: string, updates: LendingUpdate) => {
    const { data, error } = await updateLending(id, updates)
    
    if (error) {
      setError(error)
      return { success: false, error }
    }
    
    await fetchLendings() // Refresh the list
    return { success: true, data }
  }

  const removeLending = async (id: string) => {
    const { success, error } = await deleteLending(id)
    
    if (error) {
      setError(error)
      return { success: false, error }
    }
    
    await fetchLendings() // Refresh the list
    return { success: true, error: null }
  }

  const addPayment = async (lendingId: string, paymentData: PaymentFormData) => {
    const { data, error } = await createLendingPayment(lendingId, paymentData)
    
    if (error) {
      setError(error)
      return { success: false, error }
    }
    
    await fetchLendings() // Refresh the list
    return { success: true, data }
  }

  const refreshLendings = () => {
    fetchLendings()
  }

  return {
    lendings,
    loading,
    error,
    addLending,
    editLending,
    removeLending,
    addPayment,
    refreshLendings
  }
}

// ========================
// EMI Overview Hook
// ========================

export function useEMIOverview(currency: string = 'BDT') {
  const { user } = useAuth()
  const [overview, setOverview] = useState<EMIOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await getEMIOverview(currency)
      
      if (error) {
        setError(error)
        setOverview(null)
      } else {
        setOverview(data)
        setError(null)
      }
    } catch (err) {
      console.error('EMI Overview Hook Exception:', err)
      setError('Failed to fetch EMI overview')
      setOverview(null)
    } finally {
      setLoading(false)
    }
  }, [user, currency])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  const refreshOverview = useCallback(() => {
    fetchOverview()
  }, [fetchOverview])

  return {
    overview,
    loading,
    error,
    refreshOverview
  }
}

// ========================
// Lending Overview Hook
// ========================

export function useLendingOverview(currency: string = 'BDT') {
  const { user } = useAuth()
  const [overview, setOverview] = useState<LendingOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await getLendingOverview(currency)
      
      if (error) {
        setError(error)
        setOverview(null)
      } else {
        setOverview(data)
        setError(null)
      }
    } catch (err) {
      console.error('Lending Overview Hook Exception:', err)
      setError('Failed to fetch lending overview')
      setOverview(null)
    } finally {
      setLoading(false)
    }
  }, [user, currency])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  const refreshOverview = useCallback(() => {
    fetchOverview()
  }, [fetchOverview])

  return {
    overview,
    loading,
    error,
    refreshOverview
  }
}

// ========================
// EMI Templates Hook
// ========================

export function useEMITemplates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<EmiTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await getEMITemplates()
    
    if (error) {
      setError(error)
    } else {
      setTemplates(data)
      setError(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return { templates, loading, error }
}

// ========================
// Combined EMI Dashboard Hook
// ========================

export function useEMIDashboard(currency: string = 'BDT') {
  const { overview: emiOverview, loading: emiLoading, error: emiError } = useEMIOverview(currency)
  const { overview: lendingOverview, loading: lendingLoading, error: lendingError } = useLendingOverview(currency)
  const { loans, loading: loansLoading, error: loansError } = useLoans()
  const { lendings, loading: lendingsLoading, error: lendingsError } = useLendings()

  const loading = emiLoading || lendingLoading || loansLoading || lendingsLoading
  const error = emiError || lendingError || loansError || lendingsError

  // Calculate combined metrics with better null checking
  const totalOutstanding = Number(emiOverview?.total_outstanding_amount || 0) + 
                          Number(lendingOverview?.total_lent_pending || 0) + 
                          Number(lendingOverview?.total_borrowed_pending || 0)

  const totalMonthlyCommitments = Number(emiOverview?.total_monthly_emi || 0)

  const upcomingPayments = (loans || [])
    .filter(loan => loan.next_payment && loan.status === 'active')
    .slice(0, 5)

  const overdueLendings = (lendings || [])
    .filter(lending => lending.status === 'overdue')
    .slice(0, 5)

  // Optional debug logging (can be enabled when needed)
  // console.log('EMI Dashboard Debug:', { emiOverview, lendingOverview, loading, error })

  return {
    emiOverview,
    lendingOverview,
    loans: (loans || []).slice(0, 5), // Latest 5 loans
    lendings: (lendings || []).slice(0, 5), // Latest 5 lendings
    totalOutstanding,
    totalMonthlyCommitments,
    upcomingPayments,
    overdueLendings,
    loading,
    error
  }
}