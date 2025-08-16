import { createClient } from '@/lib/supabase/client'
import { 
  Loan, 
  LoanInsert, 
  LoanUpdate, 
  LoanWithRelations,
  Lending, 
  LendingInsert, 
  LendingUpdate, 
  LendingWithRelations,
  EmiPayment, 
  EmiPaymentInsert,
  EmiSchedule,
  EmiScheduleWithPayment,
  LendingPayment,
  LendingPaymentInsert,
  EmiTemplate,
  EmiTemplateInsert,
  EMIOverview,
  LendingOverview,
  EMICalculationInput,
  EMICalculationResult,
  EMIBreakdown,
  PaymentFormData,
  EMIFilters,
  LendingFilters
} from '@/types/emi'

export type { EMICalculationResult }

const supabase = createClient()

// ========================
// EMI Calculation Functions
// ========================

export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || annualRate < 0 || tenureMonths <= 0) {
    throw new Error('Invalid input parameters')
  }
  
  if (annualRate === 0) {
    return principal / tenureMonths
  }
  
  const monthlyRate = annualRate / 12 / 100
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)
  const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1
  
  return numerator / denominator
}

export function calculateEMIDetails(input: EMICalculationInput): EMICalculationResult {
  const { principal, interestRate, tenureMonths } = input
  
  const emi = calculateEMI(principal, interestRate, tenureMonths)
  const totalAmount = emi * tenureMonths
  const totalInterest = totalAmount - principal
  const principalPercentage = (principal / totalAmount) * 100
  const interestPercentage = (totalInterest / totalAmount) * 100
  
  // Calculate month-wise breakdown
  const breakdown: EMIBreakdown[] = []
  let remainingBalance = principal
  const monthlyRate = interestRate / 12 / 100
  
  for (let month = 1; month <= tenureMonths; month++) {
    const interestForMonth = remainingBalance * monthlyRate
    const principalForMonth = emi - interestForMonth
    remainingBalance = Math.max(0, remainingBalance - principalForMonth)
    
    breakdown.push({
      month,
      emi,
      principal: principalForMonth,
      interest: interestForMonth,
      balance: remainingBalance
    })
  }
  
  return {
    emi,
    totalAmount,
    totalInterest,
    principalPercentage,
    interestPercentage,
    breakdown
  }
}

// ========================
// Loan Management Functions
// ========================

export async function createLoan(loanData: LoanInsert): Promise<{ data: Loan | null; error: string | null }> {
  try {
    // Calculate EMI amount
    const emi = calculateEMI(loanData.principal_amount, loanData.interest_rate, loanData.tenure_months)
    
    const { data, error } = await supabase
      .from('loans')
      .insert({
        ...loanData,
        emi_amount: emi,
        outstanding_amount: loanData.principal_amount,
        next_due_date: loanData.start_date
      })
      .select()
      .single()
    
    if (error) {
      // console.error('Error creating loan:', error)
      return { data: null, error: error.message }
    }
    
    // Generate EMI schedule
    if (data) {
      await supabase.rpc('create_emi_schedule_entries', {
        p_loan_id: data.id,
        p_user_id: data.user_id
      })
    }
    
    return { data, error: null }
  } catch (error) {
    // console.error('Error creating loan:', error)
    return { data: null, error: 'Failed to create loan' }
  }
}

export async function updateLoan(id: string, updates: LoanUpdate): Promise<{ data: Loan | null; error: string | null }> {
  try {
    // If principal, rate, or tenure changed, recalculate EMI
    let finalUpdates = { ...updates }
    
    if (updates.principal_amount || updates.interest_rate || updates.tenure_months) {
      const { data: currentLoan } = await supabase
        .from('loans')
        .select('principal_amount, interest_rate, tenure_months')
        .eq('id', id)
        .single()
      
      if (currentLoan) {
        const principal = updates.principal_amount || currentLoan.principal_amount
        const rate = updates.interest_rate || currentLoan.interest_rate
        const tenure = updates.tenure_months || currentLoan.tenure_months
        
        finalUpdates.emi_amount = calculateEMI(principal, rate, tenure)
        
        // Regenerate schedule if loan structure changed
        await supabase.rpc('create_emi_schedule_entries', {
          p_loan_id: id,
          p_user_id: (await supabase.auth.getUser()).data.user?.id
        })
      }
    }
    
    const { data, error } = await supabase
      .from('loans')
      .update(finalUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      // console.error('Error updating loan:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error) {
    // console.error('Error updating loan:', error)
    return { data: null, error: 'Failed to update loan' }
  }
}

export async function deleteLoan(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('loans')
      .delete()
      .eq('id', id)
    
    if (error) {
      // console.error('Error deleting loan:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, error: null }
  } catch (error) {
    // console.error('Error deleting loan:', error)
    return { success: false, error: 'Failed to delete loan' }
  }
}

export async function getLoan(id: string): Promise<{ data: LoanWithRelations | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        account:accounts(*),
        category:categories(*),
        payments:emi_payments(*),
        schedules:emi_schedules(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      // console.error('Error fetching loan:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error) {
    // console.error('Error fetching loan:', error)
    return { data: null, error: 'Failed to fetch loan' }
  }
}

export async function getLoans(filters?: EMIFilters): Promise<{ data: LoanWithRelations[]; error: string | null }> {
  try {
    let query = supabase
      .from('loans')
      .select(`
        *,
        account:accounts(*),
        category:categories(*),
        next_payment:emi_schedules(*)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (filters?.status) {
      query = query.in('status', filters.status)
    }
    
    if (filters?.type) {
      query = query.in('type', filters.type)
    }
    
    if (filters?.lender) {
      query = query.in('lender', filters.lender)
    }
    
    if (filters?.dateRange) {
      query = query
        .gte('start_date', filters.dateRange.start)
        .lte('start_date', filters.dateRange.end)
    }
    
    if (filters?.amountRange) {
      query = query
        .gte('principal_amount', filters.amountRange.min)
        .lte('principal_amount', filters.amountRange.max)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching loans:', error)
      return { data: [], error: error.message }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Exception fetching loans:', error)
    return { data: [], error: 'Failed to fetch loans' }
  }
}

// ========================
// EMI Schedule Functions
// ========================

export async function getEMISchedule(loanId: string): Promise<{ data: EmiScheduleWithPayment[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('emi_schedules')
      .select(`
        *,
        payment:emi_payments(*),
        loan:loans(*)
      `)
      .eq('loan_id', loanId)
      .order('installment_number')
    
    if (error) {
      // console.error('Error fetching EMI schedule:', error)
      return { data: [], error: error.message }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    // console.error('Error fetching EMI schedule:', error)
    return { data: [], error: 'Failed to fetch EMI schedule' }
  }
}

export async function markEMIPaymentPaid(
  scheduleId: string,
  paymentData: PaymentFormData
): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    const { data, error } = await supabase.rpc('mark_emi_payment_paid', {
      p_schedule_id: scheduleId,
      p_user_id: user.data.user.id,
      p_payment_amount: paymentData.amount,
      p_payment_date: paymentData.payment_date,
      p_payment_method: paymentData.payment_method,
      p_late_fee: paymentData.late_fee || 0,
      p_notes: paymentData.notes
    })
    
    if (error) {
      // console.error('Error marking EMI payment as paid:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, error: null }
  } catch (error) {
    // console.error('Error marking EMI payment as paid:', error)
    return { success: false, error: 'Failed to mark payment as paid' }
  }
}

// ========================
// Lending Management Functions
// ========================

export async function createLending(lendingData: LendingInsert): Promise<{ data: Lending | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('lending')
      .insert({
        ...lendingData,
        pending_amount: lendingData.amount
      })
      .select()
      .single()
    
    if (error) {
      // console.error('Error creating lending:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error) {
    // console.error('Error creating lending:', error)
    return { data: null, error: 'Failed to create lending' }
  }
}

export async function updateLending(id: string, updates: LendingUpdate): Promise<{ data: Lending | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('lending')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      // console.error('Error updating lending:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error) {
    // console.error('Error updating lending:', error)
    return { data: null, error: 'Failed to update lending' }
  }
}

export async function deleteLending(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('lending')
      .delete()
      .eq('id', id)
    
    if (error) {
      // console.error('Error deleting lending:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, error: null }
  } catch (error) {
    // console.error('Error deleting lending:', error)
    return { success: false, error: 'Failed to delete lending' }
  }
}

export async function getLendings(filters?: LendingFilters): Promise<{ data: LendingWithRelations[]; error: string | null }> {
  try {
    let query = supabase
      .from('lending')
      .select(`
        *,
        account:accounts(*),
        category:categories(*),
        payments:lending_payments(*)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (filters?.status) {
      query = query.in('status', filters.status)
    }
    
    if (filters?.type) {
      query = query.in('type', filters.type)
    }
    
    if (filters?.person) {
      query = query.in('person_name', filters.person)
    }
    
    if (filters?.dateRange) {
      query = query
        .gte('date', filters.dateRange.start)
        .lte('date', filters.dateRange.end)
    }
    
    if (filters?.amountRange) {
      query = query
        .gte('amount', filters.amountRange.min)
        .lte('amount', filters.amountRange.max)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching lendings:', error)
      return { data: [], error: error.message }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Exception fetching lendings:', error)
    return { data: [], error: 'Failed to fetch lendings' }
  }
}

// ========================
// Payment Functions
// ========================

export async function createLendingPayment(
  lendingId: string,
  paymentData: Omit<LendingPaymentInsert, 'lending_id' | 'user_id'>
): Promise<{ data: LendingPayment | null; error: string | null }> {
  try {
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      return { data: null, error: 'User not authenticated' }
    }
    
    const { data: payment, error: paymentError } = await supabase
      .from('lending_payments')
      .insert({
        ...paymentData,
        lending_id: lendingId,
        user_id: user.data.user.id
      })
      .select()
      .single()
    
    if (paymentError) {
      // console.error('Error creating lending payment:', paymentError)
      return { data: null, error: paymentError.message }
    }
    
    // Update lending pending amount and status
    const { data: lending } = await supabase
      .from('lending')
      .select('amount, pending_amount')
      .eq('id', lendingId)
      .single()
    
    if (lending) {
      const newPendingAmount = lending.pending_amount - paymentData.amount
      const newStatus = newPendingAmount <= 0 ? 'paid' : 
                       newPendingAmount < lending.amount ? 'partial' : 'pending'
      
      await supabase
        .from('lending')
        .update({
          pending_amount: Math.max(0, newPendingAmount),
          status: newStatus
        })
        .eq('id', lendingId)
    }
    
    return { data: payment, error: null }
  } catch (error) {
    // console.error('Error creating lending payment:', error)
    return { data: null, error: 'Failed to create lending payment' }
  }
}

// ========================
// Dashboard Functions
// ========================

export async function getEMIOverview(currency: string = 'BDT'): Promise<{ data: EMIOverview | null; error: string | null }> {
  try {
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      return { data: null, error: 'User not authenticated' }
    }
    
    const { data, error } = await supabase.rpc('get_emi_overview', {
      p_user_id: user.data.user.id,
      p_currency: currency
    })
    
    if (error) {
      console.error('EMI Overview Error:', error)
      return { data: null, error: error.message }
    }
    
    // The RPC function returns an array with a single row
    const overviewData = Array.isArray(data) && data.length > 0 ? data[0] : null
    
    return { data: overviewData, error: null }
  } catch (error) {
    console.error('EMI Overview Exception:', error)
    return { data: null, error: 'Failed to fetch EMI overview' }
  }
}

export async function getLendingOverview(currency: string = 'BDT'): Promise<{ data: LendingOverview | null; error: string | null }> {
  try {
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      return { data: null, error: 'User not authenticated' }
    }
    
    const { data, error } = await supabase.rpc('get_lending_overview', {
      p_user_id: user.data.user.id,
      p_currency: currency
    })
    
    if (error) {
      console.error('Lending Overview Error:', error)
      return { data: null, error: error.message }
    }
    
    // The RPC function returns an array with a single row
    const overviewData = Array.isArray(data) && data.length > 0 ? data[0] : null
    
    return { data: overviewData, error: null }
  } catch (error) {
    console.error('Lending Overview Exception:', error)
    return { data: null, error: 'Failed to fetch lending overview' }
  }
}

// ========================
// Template Functions
// ========================

export async function createEMITemplate(templateData: EmiTemplateInsert): Promise<{ data: EmiTemplate | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('emi_templates')
      .insert(templateData)
      .select()
      .single()
    
    if (error) {
      // console.error('Error creating EMI template:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error) {
    // console.error('Error creating EMI template:', error)
    return { data: null, error: 'Failed to create EMI template' }
  }
}

export async function getEMITemplates(): Promise<{ data: EmiTemplate[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('emi_templates')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      // console.error('Error fetching EMI templates:', error)
      return { data: [], error: error.message }
    }
    
    return { data: data || [], error: null }
  } catch (error) {
    // console.error('Error fetching EMI templates:', error)
    return { data: [], error: 'Failed to fetch EMI templates' }
  }
}

// ========================
// Utility Functions
// ========================

export function getNextPaymentDate(startDate: string, paymentDay: number = 1): string {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  // If payment day hasn't passed this month, use this month
  if (today.getDate() < paymentDay) {
    return new Date(currentYear, currentMonth, paymentDay).toISOString().split('T')[0] || ''
  }
  
  // Otherwise, use next month
  return new Date(currentYear, currentMonth + 1, paymentDay).toISOString().split('T')[0] || ''
}

export function calculateLateFeeDays(dueDate: string): number {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = today.getTime() - due.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function formatLoanDisplayName(loan: Loan): string {
  return `${loan.lender} - ${loan.type.charAt(0).toUpperCase() + loan.type.slice(1)} Loan`
}

export function formatLendingDisplayName(lending: Lending): string {
  const typeLabel = lending.type === 'lent' ? 'Lent to' : 'Borrowed from'
  return `${typeLabel} ${lending.person_name}`
}