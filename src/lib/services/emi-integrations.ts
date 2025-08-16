import { createClient } from '@/lib/supabase/client'
import { 
  EMIBudgetIntegration,
  EMITransactionIntegration,
  FinancialGoal,
  MoneyFlowData,
  EMITransaction,
  EMIBudgetCategory,
  Loan,
  EmiPayment,
  Lending,
  LendingPayment,
  PurchaseEMICategory
} from '@/types/emi'

const supabase = createClient()

// ========================
// Budget Integration Functions
// ========================

/**
 * Create or update budget category for EMI payments
 */
export async function createEMIBudgetCategory(
  userId: string,
  loanId: string,
  monthlyEMI: number,
  currency: string = 'BDT'
): Promise<{ success: boolean; error: string | null; categoryId?: string }> {
  try {
    // Check if EMI category already exists
    let { data: emiCategory, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'EMI Payments')
      .eq('type', 'expense')
      .single()

    // Create EMI category if it doesn't exist
    if (!emiCategory) {
      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: 'EMI Payments',
          description: 'Monthly loan EMI payments',
          type: 'expense',
          color: '#dc2626', // Red color for expenses
          icon: 'credit-card'
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating EMI category:', createError)
        return { success: false, error: createError.message }
      }
      
      emiCategory = newCategory
    }

    // Get current date for budget period
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // Check if budget already exists for this month
    const { data: existingBudget } = await supabase
      .from('budgets')
      .select('id, allocated_amount')
      .eq('user_id', userId)
      .eq('category_id', emiCategory.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single()

    if (existingBudget) {
      // Update existing budget to include new EMI
      const { error: updateError } = await supabase
        .from('budgets')
        .update({
          allocated_amount: existingBudget.allocated_amount + monthlyEMI
        })
        .eq('id', existingBudget.id)

      if (updateError) {
        console.error('Error updating EMI budget:', updateError)
        return { success: false, error: updateError.message }
      }
    } else {
      // Create new budget for EMI
      const { error: budgetError } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          category_id: emiCategory.id,
          allocated_amount: monthlyEMI,
          month: currentMonth,
          year: currentYear,
          period: 'monthly',
          currency: currency,
          is_active: true
        })

      if (budgetError) {
        console.error('Error creating EMI budget:', budgetError)
        return { success: false, error: budgetError.message }
      }
    }

    return { success: true, error: null, categoryId: emiCategory.id }
  } catch (error) {
    console.error('Error in EMI budget integration:', error)
    return { success: false, error: 'Failed to integrate with budget system' }
  }
}

/**
 * Update budget allocation when loan is modified or closed
 */
export async function updateEMIBudgetAllocation(
  userId: string,
  oldEMI: number,
  newEMI: number,
  currency: string = 'BDT'
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get EMI category
    const { data: emiCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'EMI Payments')
      .eq('type', 'expense')
      .single()

    if (!emiCategory) {
      return { success: false, error: 'EMI category not found' }
    }

    // Get current date
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // Update budget allocation
    const { data: budget } = await supabase
      .from('budgets')
      .select('id, allocated_amount')
      .eq('user_id', userId)
      .eq('category_id', emiCategory.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single()

    if (budget) {
      const updatedAmount = budget.allocated_amount - oldEMI + newEMI
      
      const { error } = await supabase
        .from('budgets')
        .update({
          allocated_amount: Math.max(0, updatedAmount)
        })
        .eq('id', budget.id)

      if (error) {
        console.error('Error updating budget allocation:', error)
        return { success: false, error: error.message }
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating EMI budget allocation:', error)
    return { success: false, error: 'Failed to update budget allocation' }
  }
}

/**
 * Get EMI budget integration status
 */
export async function getEMIBudgetIntegration(
  userId: string,
  currency: string = 'BDT'
): Promise<{ data: EMIBudgetIntegration | null; error: string | null }> {
  try {
    // Get EMI category
    const { data: emiCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'EMI Payments')
      .eq('type', 'expense')
      .single()

    if (!emiCategory) {
      return { data: null, error: 'EMI category not found' }
    }

    // Get current month budget
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const { data: budget } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', emiCategory.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single()

    // Get total EMI transactions for this month
    const { data: emiTransactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('category_id', emiCategory.id)
      .eq('type', 'expense')
      .gte('transaction_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
      .lt('transaction_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`)

    const usedAmount = emiTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0

    // Get pending EMIs
    const { data: pendingEMIs } = await supabase
      .from('emi_schedules')
      .select('emi_amount')
      .eq('user_id', userId)
      .eq('is_paid', false)
      .eq('due_date', new Date().toISOString().split('T')[0])

    const pendingAmount = pendingEMIs?.reduce((sum, e) => sum + e.emi_amount, 0) || 0

    // Get overdue amount
    const { data: overdueEMIs } = await supabase
      .from('emi_schedules')
      .select('emi_amount')
      .eq('user_id', userId)
      .eq('is_paid', false)
      .lt('due_date', new Date().toISOString().split('T')[0])

    const overdueAmount = overdueEMIs?.reduce((sum, e) => sum + e.emi_amount, 0) || 0

    const integration: EMIBudgetIntegration = {
      budget_id: budget?.id || '',
      emi_category_id: emiCategory.id,
      allocated_amount: budget?.allocated_amount || 0,
      used_amount: usedAmount,
      pending_emis: pendingEMIs?.length || 0,
      overdue_amount: overdueAmount
    }

    return { data: integration, error: null }
  } catch (error) {
    console.error('Error getting EMI budget integration:', error)
    return { data: null, error: 'Failed to get budget integration data' }
  }
}

// ========================
// Transaction Integration Functions
// ========================

/**
 * Create transaction when EMI payment is made
 */
export async function createEMITransaction(
  userId: string,
  emiPayment: EmiPayment,
  loan: Loan,
  settings?: Partial<EMITransactionIntegration>
): Promise<{ success: boolean; error: string | null; transactionId?: string }> {
  try {
    // Get EMI category (create if doesn't exist)
    const categoryResult = await createEMIBudgetCategory(userId, loan.id, 0, loan.currency)
    
    if (!categoryResult.success || !categoryResult.categoryId) {
      return { success: false, error: 'Failed to get/create EMI category' }
    }

    // Create transaction description
    const description = settings?.transaction_description_template
      ?.replace('{lender}', loan.lender)
      ?.replace('{type}', loan.type)
      ?.replace('{month}', new Date(emiPayment.payment_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
      || `EMI Payment - ${loan.lender} (${loan.type} loan)`

    // Calculate total amount including late fees
    const totalAmount = emiPayment.amount + (settings?.include_late_fees ? (emiPayment.late_fee || 0) : 0)

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: totalAmount,
        type: 'expense',
        description,
        category_id: settings?.default_category_id || categoryResult.categoryId,
        account_id: settings?.default_account_id || loan.account_id,
        transaction_date: emiPayment.payment_date,
        currency: loan.currency,
        metadata: {
          emi_payment_id: emiPayment.id,
          loan_id: loan.id,
          principal_amount: emiPayment.principal_amount,
          interest_amount: emiPayment.interest_amount,
          late_fee: emiPayment.late_fee || 0,
          payment_method: emiPayment.payment_method,
          is_emi_payment: true
        }
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating EMI transaction:', error)
      return { success: false, error: error.message }
    }

    // Update EMI payment with transaction reference
    await supabase
      .from('emi_payments')
      .update({ transaction_id: transaction.id })
      .eq('id', emiPayment.id)

    return { success: true, error: null, transactionId: transaction.id }
  } catch (error) {
    console.error('Error creating EMI transaction:', error)
    return { success: false, error: 'Failed to create EMI transaction' }
  }
}

/**
 * Create transaction for lending payment
 */
export async function createLendingTransaction(
  userId: string,
  lendingPayment: LendingPayment,
  lending: Lending,
  settings?: Partial<EMITransactionIntegration>
): Promise<{ success: boolean; error: string | null; transactionId?: string }> {
  try {
    // Get or create lending category
    let { data: lendingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Lending')
      .single()

    if (!lendingCategory) {
      const { data: newCategory, error: categoryError } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: 'Lending',
          description: 'Personal lending and borrowing',
          type: lending.type === 'lent' ? 'income' : 'expense',
          color: lending.type === 'lent' ? '#16a34a' : '#dc2626',
          icon: 'users'
        })
        .select('id')
        .single()

      if (categoryError) {
        console.error('Error creating lending category:', categoryError)
        return { success: false, error: categoryError.message }
      }

      lendingCategory = newCategory
    }

    // Create transaction description
    const description = `${lending.type === 'lent' ? 'Payment received from' : 'Payment made to'} ${lending.person_name}`

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: lendingPayment.amount,
        type: lending.type === 'lent' ? 'income' : 'expense',
        description,
        category_id: settings?.default_category_id || lendingCategory.id,
        account_id: settings?.default_account_id || lending.account_id,
        transaction_date: lendingPayment.payment_date,
        currency: lending.currency,
        metadata: {
          lending_payment_id: lendingPayment.id,
          lending_id: lending.id,
          person_name: lending.person_name,
          lending_type: lending.type,
          payment_method: lendingPayment.payment_method,
          is_lending_payment: true
        }
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating lending transaction:', error)
      return { success: false, error: error.message }
    }

    // Update lending payment with transaction reference
    await supabase
      .from('lending_payments')
      .update({ transaction_id: transaction.id })
      .eq('id', lendingPayment.id)

    return { success: true, error: null, transactionId: transaction.id }
  } catch (error) {
    console.error('Error creating lending transaction:', error)
    return { success: false, error: 'Failed to create lending transaction' }
  }
}

/**
 * Auto-create recurring transactions for scheduled EMI payments
 */
export async function createRecurringEMITransaction(
  userId: string,
  loan: Loan
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get EMI category
    const categoryResult = await createEMIBudgetCategory(userId, loan.id, 0, loan.currency)
    
    if (!categoryResult.success || !categoryResult.categoryId) {
      return { success: false, error: 'Failed to get/create EMI category' }
    }

    const { error } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: userId,
        amount: loan.emi_amount,
        type: 'expense',
        description: `EMI Payment - ${loan.lender} (${loan.type} loan)`,
        category_id: categoryResult.categoryId,
        account_id: loan.account_id,
        frequency: 'monthly',
        start_date: loan.start_date,
        end_date: null, // Will end when loan is closed
        next_execution: loan.next_due_date,
        is_active: loan.status === 'active',
        currency: loan.currency,
        metadata: {
          loan_id: loan.id,
          is_emi_recurring: true,
          auto_execute: loan.auto_debit || false
        }
      })

    if (error) {
      console.error('Error creating recurring EMI transaction:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error creating recurring EMI transaction:', error)
    return { success: false, error: 'Failed to create recurring transaction' }
  }
}

/**
 * Get EMI transaction integration settings
 */
export async function getEMITransactionSettings(
  userId: string
): Promise<{ data: EMITransactionIntegration | null; error: string | null }> {
  try {
    // This would typically be stored in user preferences
    // For now, return default settings
    const defaultSettings: EMITransactionIntegration = {
      auto_create_transactions: true,
      include_late_fees: true,
      transaction_description_template: 'EMI Payment - {lender} ({type} loan) - {month}'
    }

    return { data: defaultSettings, error: null }
  } catch (error) {
    console.error('Error getting EMI transaction settings:', error)
    return { data: null, error: 'Failed to get transaction settings' }
  }
}

/**
 * Update transaction integration settings
 */
export async function updateEMITransactionSettings(
  userId: string,
  settings: Partial<EMITransactionIntegration>
): Promise<{ success: boolean; error: string | null }> {
  try {
    // This would typically update user preferences
    // For now, just return success
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating EMI transaction settings:', error)
    return { success: false, error: 'Failed to update transaction settings' }
  }
}

// ========================
// Utility Functions
// ========================

/**
 * Sync all EMI data with budget and transaction systems
 */
export async function syncEMIIntegrations(
  userId: string,
  currency: string = 'BDT'
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get all active loans
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('currency', currency)

    if (!loans) {
      return { success: true, error: null }
    }

    // Calculate total monthly EMI
    const totalMonthlyEMI = loans.reduce((sum, loan) => sum + loan.emi_amount, 0)

    // Create/update EMI budget category
    const budgetResult = await createEMIBudgetCategory(userId, 'all', totalMonthlyEMI, currency)
    
    if (!budgetResult.success) {
      return { success: false, error: budgetResult.error }
    }

    // Create recurring transactions for loans that don't have them
    for (const loan of loans) {
      // Check if recurring transaction already exists
      const { data: existingRecurring } = await supabase
        .from('recurring_transactions')
        .select('id')
        .eq('user_id', userId)
        .contains('metadata', { loan_id: loan.id })
        .single()

      if (!existingRecurring) {
        await createRecurringEMITransaction(userId, loan)
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error syncing EMI integrations:', error)
    return { success: false, error: 'Failed to sync EMI integrations' }
  }
}

// ========================
// Money Flow Analysis & Tracking
// ========================

/**
 * Get comprehensive money flow data for a specific period
 */
export async function getMoneyFlowData(
  userId: string,
  period: string, // YYYY-MM format
  currency: string = 'BDT'
): Promise<{ data: MoneyFlowData | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('get_money_flow_data', {
      p_user_id: userId,
      p_period: period,
      p_currency: currency
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error getting money flow data:', error)
    return { data: null, error: 'Failed to get money flow data' }
  }
}

/**
 * Track where money comes from and where it goes
 */
export async function getMoneySourceAnalysis(
  userId: string,
  period: string,
  currency: string = 'BDT'
): Promise<{
  data: {
    income_sources: Array<{ source: string; amount: number; percentage: number }>
    expense_categories: Array<{ category: string; amount: number; percentage: number }>
    top_expenses: Array<{ description: string; amount: number; date: string }>
    emi_impact: { total_emi: number; percentage_of_income: number }
    savings_rate: number
  } | null
  error: string | null
}> {
  try {
    const { data, error } = await supabase.rpc('get_money_source_analysis', {
      p_user_id: userId,
      p_period: period,
      p_currency: currency
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error getting money source analysis:', error)
    return { data: null, error: 'Failed to get money source analysis' }
  }
}

// ========================
// Financial Goals Integration
// ========================

/**
 * Create financial goal related to debt payoff
 */
export async function createDebtPayoffGoal(
  userId: string,
  loanIds: string[],
  targetDate: string,
  monthlyContribution?: number
): Promise<{ data: FinancialGoal | null; error: string | null }> {
  try {
    // Calculate total debt amount
    const { data: loans } = await supabase
      .from('loans')
      .select('outstanding_amount')
      .in('id', loanIds)
      .eq('user_id', userId)

    const totalDebt = loans?.reduce((sum, loan) => sum + loan.outstanding_amount, 0) || 0

    const goalData = {
      name: 'Debt Payoff Goal',
      description: `Pay off ${loanIds.length} loan(s)`,
      target_amount: totalDebt,
      current_amount: 0,
      target_date: targetDate,
      goal_type: 'debt_payoff' as const,
      related_loan_ids: loanIds,
      auto_contribute: !!monthlyContribution,
      monthly_contribution: monthlyContribution
    }

    const { data, error } = await supabase
      .from('financial_goals')
      .insert({
        ...goalData,
        user_id: userId
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error creating debt payoff goal:', error)
    return { data: null, error: 'Failed to create debt payoff goal' }
  }
}

/**
 * Update goal progress when EMI payment is made
 */
export async function updateGoalProgressFromEMI(
  userId: string,
  loanId: string,
  principalAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find goals related to this loan
    const { data: goals } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_type', 'debt_payoff')
      .contains('related_loan_ids', [loanId])

    for (const goal of goals || []) {
      // Update goal progress
      const { error } = await supabase
        .from('financial_goals')
        .update({
          current_amount: goal.current_amount + principalAmount
        })
        .eq('id', goal.id)

      if (error) {
        console.error('Error updating goal progress:', error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating goal progress from EMI:', error)
    return { success: false, error: 'Failed to update goal progress' }
  }
}

// ========================
// Purchase EMI Functions
// ========================

/**
 * Create purchase EMI with transaction integration
 */
export async function createPurchaseEMI(
  userId: string,
  purchaseData: {
    item_name: string
    vendor_name: string
    purchase_category: PurchaseEMICategory
    principal_amount: number
    down_payment?: number
    interest_rate: number
    tenure_months: number
    purchase_date: string
    item_condition: 'new' | 'refurbished' | 'used'
    warranty_period?: number
    account_id?: string
    notes?: string
  },
  createDownPaymentTransaction: boolean = true
): Promise<{ data: Loan | null; error: string | null; transactionId?: string }> {
  try {
    // Calculate EMI
    const emi = calculateEMI(
      purchaseData.principal_amount,
      purchaseData.interest_rate,
      purchaseData.tenure_months
    )

    // Create loan record
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .insert({
        user_id: userId,
        lender: purchaseData.vendor_name,
        principal_amount: purchaseData.principal_amount,
        outstanding_amount: purchaseData.principal_amount,
        interest_rate: purchaseData.interest_rate,
        emi_amount: emi,
        tenure_months: purchaseData.tenure_months,
        start_date: purchaseData.purchase_date,
        next_due_date: purchaseData.purchase_date,
        currency: 'BDT',
        type: 'purchase_emi',
        status: 'active',
        account_id: purchaseData.account_id,
        payment_day: 1,
        notes: purchaseData.notes,
        metadata: {
          item_name: purchaseData.item_name,
          purchase_category: purchaseData.purchase_category,
          purchase_date: purchaseData.purchase_date,
          item_condition: purchaseData.item_condition,
          warranty_period: purchaseData.warranty_period,
          down_payment: purchaseData.down_payment
        }
      })
      .select()
      .single()

    if (loanError) {
      return { data: null, error: loanError.message }
    }

    // Generate EMI schedule
    await supabase.rpc('create_emi_schedule_entries', {
      p_loan_id: loan.id,
      p_user_id: userId
    })

    // Create down payment transaction if requested
    let transactionId: string | undefined
    if (createDownPaymentTransaction && purchaseData.down_payment && purchaseData.down_payment > 0) {
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: purchaseData.down_payment,
          type: 'expense',
          description: `Down Payment - ${purchaseData.item_name} from ${purchaseData.vendor_name}`,
          account_id: purchaseData.account_id,
          transaction_date: purchaseData.purchase_date,
          currency: 'BDT',
          metadata: {
            purchase_emi_id: loan.id,
            item_name: purchaseData.item_name,
            vendor_name: purchaseData.vendor_name,
            is_down_payment: true
          }
        })
        .select('id')
        .single()

      if (!transactionError) {
        transactionId = transaction.id
      }
    }

    // Integrate with budget
    await createEMIBudgetCategory(userId, loan.id, emi, 'BDT')

    return { data: loan, error: null, ...(transactionId && { transactionId }) }
  } catch (error) {
    console.error('Error creating purchase EMI:', error)
    return { data: null, error: 'Failed to create purchase EMI' }
  }
}

// ========================
// Debt Analysis & Recommendations
// ========================

/**
 * Get comprehensive debt analysis with recommendations
 */
export async function getDebtAnalysisWithRecommendations(
  userId: string,
  currency: string = 'BDT'
): Promise<{
  data: {
    total_debt: number
    monthly_payments: number
    debt_to_income_ratio: number
    debt_breakdown: Array<{ type: string; amount: number; percentage: number }>
    payoff_strategies: Array<{
      strategy: string
      description: string
      time_savings: string
      interest_savings: number
    }>
    recommendations: string[]
  } | null
  error: string | null
}> {
  try {
    const { data, error } = await supabase.rpc('get_debt_analysis_with_recommendations', {
      p_user_id: userId,
      p_currency: currency
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error getting debt analysis with recommendations:', error)
    return { data: null, error: 'Failed to get debt analysis' }
  }
}

/**
 * Calculate debt snowball vs avalanche strategies
 */
export async function calculateDebtStrategies(
  userId: string,
  extraPayment: number = 0,
  currency: string = 'BDT'
): Promise<{
  data: {
    snowball: {
      total_time: number
      total_interest: number
      payment_order: Array<{ loan_id: string; lender: string; order: number }>
    }
    avalanche: {
      total_time: number
      total_interest: number
      payment_order: Array<{ loan_id: string; lender: string; order: number }>
    }
    recommended_strategy: 'snowball' | 'avalanche'
  } | null
  error: string | null
}> {
  try {
    const { data, error } = await supabase.rpc('calculate_debt_strategies', {
      p_user_id: userId,
      p_extra_payment: extraPayment,
      p_currency: currency
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error calculating debt strategies:', error)
    return { data: null, error: 'Failed to calculate debt strategies' }
  }
}

// ========================
// Helper Functions
// ========================

/**
 * Calculate EMI amount
 */
function calculateEMI(principal: number, rate: number, tenure: number): number {
  if (rate === 0) return principal / tenure
  
  const monthlyRate = rate / 12 / 100
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
             (Math.pow(1 + monthlyRate, tenure) - 1)
  return emi
}

/**
 * Get financial health score based on EMI and lending data
 */
export async function getFinancialHealthScore(
  userId: string,
  currency: string = 'BDT'
): Promise<{
  data: {
    score: number // 0-100
    factors: {
      debt_to_income: { score: number; impact: string }
      emi_burden: { score: number; impact: string }
      lending_risk: { score: number; impact: string }
      payment_history: { score: number; impact: string }
    }
    recommendations: string[]
  } | null
  error: string | null
}> {
  try {
    const { data, error } = await supabase.rpc('get_financial_health_score', {
      p_user_id: userId,
      p_currency: currency
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error getting financial health score:', error)
    return { data: null, error: 'Failed to get financial health score' }
  }
}