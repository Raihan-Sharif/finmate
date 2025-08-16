// EMI and Lending System Types

// Basic table types - Using manual type definitions since tables may not be in generated types yet
export interface Loan {
  id: string
  user_id: string
  lender: string
  principal_amount: number
  outstanding_amount: number
  interest_rate: number
  emi_amount: number
  tenure_months: number
  start_date: string
  next_due_date: string | null
  currency: string
  type: LoanType
  status: LoanStatus
  account_id?: string | null
  category_id?: string | null
  auto_debit?: boolean
  reminder_days?: number
  prepayment_amount?: number
  last_payment_date?: string | null
  payment_day?: number
  notes?: string | null
  metadata?: any
  created_at: string
  updated_at: string
}

export interface LoanInsert extends Omit<Loan, 'id' | 'created_at' | 'updated_at'> {}
export interface LoanUpdate extends Partial<Omit<Loan, 'id' | 'user_id' | 'created_at' | 'updated_at'>> {}

export interface Lending {
  id: string
  user_id: string
  person_name: string
  amount: number
  pending_amount: number
  interest_rate?: number | null
  date: string
  due_date?: string | null
  currency: string
  type: LendingType
  status: LendingStatus
  account_id?: string | null
  category_id?: string | null
  reminder_days?: number
  contact_info?: any
  payment_history?: any
  notes?: string | null
  metadata?: any
  created_at: string
  updated_at: string
}

export interface LendingInsert extends Omit<Lending, 'id' | 'created_at' | 'updated_at'> {}
export interface LendingUpdate extends Partial<Omit<Lending, 'id' | 'user_id' | 'created_at' | 'updated_at'>> {}

export interface EmiPayment {
  id: string
  user_id: string
  loan_id: string
  payment_date: string
  amount: number
  principal_amount: number
  interest_amount: number
  outstanding_balance: number
  is_paid: boolean
  transaction_id?: string | null
  payment_method?: string | null
  late_fee?: number
  is_prepayment?: boolean
  notes?: string | null
  metadata?: any
  created_at: string
  updated_at: string
}

export interface EmiPaymentInsert extends Omit<EmiPayment, 'id' | 'created_at' | 'updated_at'> {}
export interface EmiPaymentUpdate extends Partial<Omit<EmiPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>> {}

export interface EmiSchedule {
  id: string
  user_id: string
  loan_id: string
  installment_number: number
  due_date: string
  emi_amount: number
  principal_amount: number
  interest_amount: number
  outstanding_balance: number
  is_paid: boolean
  payment_date?: string | null
  actual_payment_amount?: number | null
  late_fee?: number
  payment_id?: string | null
  created_at: string
  updated_at: string
}

export interface EmiScheduleInsert extends Omit<EmiSchedule, 'id' | 'created_at' | 'updated_at'> {}
export interface EmiScheduleUpdate extends Partial<Omit<EmiSchedule, 'id' | 'user_id' | 'created_at' | 'updated_at'>> {}

export interface LendingPayment {
  id: string
  user_id: string
  lending_id: string
  payment_date: string
  amount: number
  payment_method?: string | null
  transaction_id?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface LendingPaymentInsert extends Omit<LendingPayment, 'id' | 'created_at' | 'updated_at'> {}
export interface LendingPaymentUpdate extends Partial<Omit<LendingPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>> {}

export interface EmiTemplate {
  id: string
  user_id: string
  name: string
  description?: string | null
  loan_type: LoanType
  default_interest_rate?: number | null
  default_tenure_months?: number | null
  is_active: boolean
  metadata?: any
  created_at: string
  updated_at: string
}

export interface EmiTemplateInsert extends Omit<EmiTemplate, 'id' | 'created_at' | 'updated_at'> {}
export interface EmiTemplateUpdate extends Partial<Omit<EmiTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>> {}

// Enum types
export type LoanType = 'personal' | 'home' | 'car' | 'education' | 'business' | 'purchase_emi' | 'credit_card' | 'other'
export type LoanStatus = 'active' | 'closed' | 'defaulted'
export type LendingType = 'lent' | 'borrowed'
export type LendingStatus = 'pending' | 'partial' | 'paid' | 'overdue'

// Purchase EMI specific types
export type PurchaseEMICategory = 'electronics' | 'furniture' | 'appliances' | 'jewelry' | 'gadgets' | 'clothing' | 'sports' | 'travel' | 'other'

export interface PurchaseEMI extends Omit<Loan, 'type'> {
  type: 'purchase_emi'
  purchase_category: PurchaseEMICategory
  item_name: string
  vendor_name: string
  purchase_date: string
  warranty_period?: number // in months
  item_condition: 'new' | 'refurbished' | 'used'
  down_payment?: number
}

// Account and Category interfaces for relations
interface Account {
  id: string
  user_id: string
  name: string
  description?: string | null
  type: 'bank' | 'credit_card' | 'wallet' | 'investment' | 'savings' | 'other'
  balance: number
  currency: string
  is_active: boolean
  metadata?: any
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  user_id: string
  name: string
  description?: string | null
  type: 'income' | 'expense' | 'transfer'
  color?: string | null
  icon?: string | null
  parent_id?: string | null
  is_active: boolean
  metadata?: any
  created_at: string
  updated_at: string
}

// Extended types with relationships
export type LoanWithRelations = Loan & {
  account?: Account | null
  category?: Category | null
  payments?: EmiPayment[]
  schedules?: EmiSchedule[]
  next_payment?: EmiSchedule | null
  overdue_payments?: EmiSchedule[]
}

export type LendingWithRelations = Lending & {
  account?: Account | null
  category?: Category | null
  payments?: LendingPayment[]
}

export type EmiScheduleWithPayment = EmiSchedule & {
  payment?: EmiPayment | null
  loan?: Loan | null
}

interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  description: string
  category_id?: string | null
  account_id?: string | null
  transaction_date: string
  currency: string
  metadata?: any
  created_at: string
  updated_at: string
}

export type EmiPaymentWithLoan = EmiPayment & {
  loan?: Loan | null
  transaction?: Transaction | null
}

export type LendingPaymentWithDetails = LendingPayment & {
  lending?: Lending | null
  transaction?: Transaction | null
}

// EMI Calculator types
export interface EMICalculationInput {
  principal: number
  interestRate: number
  tenureMonths: number
}

export interface EMICalculationResult {
  emi: number
  totalAmount: number
  totalInterest: number
  principalPercentage: number
  interestPercentage: number
  breakdown: EMIBreakdown[]
}

export interface EMIBreakdown {
  month: number
  emi: number
  principal: number
  interest: number
  balance: number
}

// Dashboard and analytics types
export interface EMIOverview {
  total_active_loans: number
  total_outstanding_amount: number
  total_monthly_emi: number
  overdue_payments: number
  overdue_amount: number
  next_payment_date: string | null
  next_payment_amount: number
  total_paid_this_month: number
  total_pending_this_month: number
}

export interface LendingOverview {
  total_lent_amount: number
  total_borrowed_amount: number
  total_lent_pending: number
  total_borrowed_pending: number
  overdue_lent_count: number
  overdue_borrowed_count: number
  overdue_lent_amount: number
  overdue_borrowed_amount: number
}

export interface EMIAnalytics {
  monthly_payments: MonthlyPaymentData[]
  payment_composition: PaymentComposition
  loan_performance: LoanPerformance[]
  lending_summary: LendingSummary
}

export interface MonthlyPaymentData {
  month: string
  total_emi: number
  principal_paid: number
  interest_paid: number
  loans_count: number
}

export interface PaymentComposition {
  principal_percentage: number
  interest_percentage: number
  fees_percentage: number
}

export interface LoanPerformance {
  loan_id: string
  lender: string
  type: LoanType
  original_amount: number
  outstanding_amount: number
  completion_percentage: number
  on_time_payments: number
  late_payments: number
  total_payments: number
}

export interface LendingSummary {
  lent_count: number
  borrowed_count: number
  lent_recovered_percentage: number
  borrowed_repaid_percentage: number
  average_lending_amount: number
  average_recovery_time: number
}

// Form types
export interface LoanFormData {
  lender: string
  principal_amount: number
  interest_rate: number
  tenure_months: number
  start_date: string
  payment_day?: number
  account_id?: string
  category_id?: string
  type: LoanType
  auto_debit?: boolean
  reminder_days?: number
  notes?: string | undefined
}

export interface LendingFormData {
  person_name: string
  amount: number
  interest_rate?: number | undefined
  due_date?: string | undefined
  type: LendingType
  account_id?: string
  category_id?: string
  contact_info?: ContactInfo | undefined
  reminder_days?: number
  notes?: string | undefined
}

export interface ContactInfo {
  phone?: string
  email?: string
  address?: string
}

export interface PaymentFormData {
  amount: number
  payment_date: string
  payment_method?: string
  late_fee?: number
  notes?: string
}

// UI Component types
export interface EMICardProps {
  loan: LoanWithRelations
  onEdit?: (loan: Loan) => void
  onDelete?: (loanId: string) => void
  onPayment?: (loan: Loan) => void
  showActions?: boolean
}

export interface LendingCardProps {
  lending: LendingWithRelations
  onEdit?: (lending: Lending) => void
  onDelete?: (lendingId: string) => void
  onPayment?: (lending: Lending) => void
  showActions?: boolean
}

export interface EMIScheduleProps {
  loan: Loan
  schedules: EmiSchedule[]
  onMarkPaid?: (scheduleId: string, paymentData: PaymentFormData) => void
  showAllPayments?: boolean
}

export interface PaymentHistoryProps {
  payments: (EmiPayment | LendingPayment)[]
  type: 'emi' | 'lending'
  showPagination?: boolean
}

// Filter and search types
export interface EMIFilters {
  status?: LoanStatus[]
  type?: LoanType[]
  lender?: string[]
  dateRange?: {
    start: string
    end: string
  }
  amountRange?: {
    min: number
    max: number
  }
}

export interface LendingFilters {
  status?: LendingStatus[]
  type?: LendingType[]
  person?: string[]
  dateRange?: {
    start: string
    end: string
  }
  amountRange?: {
    min: number
    max: number
  }
}

// Notification types
export interface EMINotification {
  id: string
  type: 'payment_due' | 'payment_overdue' | 'loan_completion' | 'lending_reminder'
  title: string
  message: string
  loan_id?: string
  lending_id?: string
  schedule_id?: string
  due_date?: string
  amount?: number
  days_overdue?: number
  priority: 'low' | 'medium' | 'high'
  created_at: string
  is_read: boolean
}

// Integration types with Transactions and Budget
export interface EMIBudgetIntegration {
  budget_id: string
  emi_category_id: string
  allocated_amount: number
  used_amount: number
  pending_emis: number
  overdue_amount: number
}

export interface EMITransactionIntegration {
  auto_create_transactions: boolean
  default_category_id?: string
  default_account_id?: string
  include_late_fees: boolean
  transaction_description_template: string
}

// Financial Goal Integration
export interface FinancialGoal {
  id: string
  user_id: string
  name: string
  description?: string
  target_amount: number
  current_amount: number
  target_date: string
  goal_type: 'debt_payoff' | 'emergency_fund' | 'purchase' | 'investment' | 'other'
  related_loan_ids?: string[]
  related_lending_ids?: string[]
  auto_contribute: boolean
  monthly_contribution?: number
  created_at: string
  updated_at: string
}

// Money Flow Tracking
export interface MoneyFlowData {
  period: string // YYYY-MM
  income: {
    salary: number
    business: number
    investment: number
    lending_received: number
    other: number
    total: number
  }
  expenses: {
    emi_payments: number
    living_expenses: number
    entertainment: number
    investment: number
    lending_given: number
    other: number
    total: number
  }
  savings: {
    amount: number
    percentage: number
  }
  debt: {
    total_outstanding: number
    monthly_payments: number
    debt_to_income_ratio: number
  }
}

// Transaction Integration for EMI
export interface EMITransaction {
  id: string
  emi_payment_id?: string
  lending_payment_id?: string
  transaction_id: string
  loan_id?: string
  lending_id?: string
  auto_created: boolean
  created_at: string
}

// Budget Integration for EMI
export interface EMIBudgetCategory {
  id: string
  user_id: string
  budget_id: string
  category_name: string
  allocated_amount: number
  spent_amount: number
  emi_amount: number
  remaining_amount: number
  loan_ids: string[]
  lending_ids: string[]
  created_at: string
  updated_at: string
}

// Export types
export interface EMIExportData {
  loans: LoanWithRelations[]
  payments: EmiPayment[]
  schedules: EmiSchedule[]
  lending: LendingWithRelations[]
  lending_payments: LendingPayment[]
}

export interface EMIReportFilters {
  start_date: string
  end_date: string
  include_closed_loans: boolean
  include_lending: boolean
  currency?: string
  loan_types?: LoanType[]
  lending_types?: LendingType[]
}

// Constants
export const LOAN_TYPES: { value: LoanType; label: string; icon: string; category: 'formal' | 'purchase' | 'credit' }[] = [
  { value: 'personal', label: 'Personal Loan', icon: '👤', category: 'formal' },
  { value: 'home', label: 'Home Loan', icon: '🏠', category: 'formal' },
  { value: 'car', label: 'Car Loan', icon: '🚗', category: 'formal' },
  { value: 'education', label: 'Education Loan', icon: '🎓', category: 'formal' },
  { value: 'business', label: 'Business Loan', icon: '💼', category: 'formal' },
  { value: 'purchase_emi', label: 'Purchase EMI', icon: '🛒', category: 'purchase' },
  { value: 'credit_card', label: 'Credit Card EMI', icon: '💳', category: 'credit' },
  { value: 'other', label: 'Other', icon: '📋', category: 'formal' }
]

export const PURCHASE_EMI_CATEGORIES: { value: PurchaseEMICategory; label: string; icon: string }[] = [
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'furniture', label: 'Furniture', icon: '🪑' },
  { value: 'appliances', label: 'Appliances', icon: '🔌' },
  { value: 'jewelry', label: 'Jewelry', icon: '💍' },
  { value: 'gadgets', label: 'Gadgets', icon: '⌚' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'sports', label: 'Sports Equipment', icon: '⚽' },
  { value: 'travel', label: 'Travel Packages', icon: '✈️' },
  { value: 'other', label: 'Other', icon: '📦' }
]

export const LOAN_STATUSES: { value: LoanStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'closed', label: 'Closed', color: 'gray' },
  { value: 'defaulted', label: 'Defaulted', color: 'red' }
]

export const LENDING_TYPES: { value: LendingType; label: string; icon: string }[] = [
  { value: 'lent', label: 'Money Lent', icon: '📤' },
  { value: 'borrowed', label: 'Money Borrowed', icon: '📥' }
]

export const LENDING_STATUSES: { value: LendingStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'partial', label: 'Partially Paid', color: 'blue' },
  { value: 'paid', label: 'Fully Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' }
]

export const PAYMENT_METHODS = [
  'bank_transfer',
  'upi',
  'cash',
  'check',
  'debit_card',
  'credit_card',
  'auto_debit',
  'other'
] as const

export type PaymentMethod = typeof PAYMENT_METHODS[number]