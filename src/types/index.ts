import { Database } from './database'

// Database types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Table types
export type Profile = Tables<'profiles'>
export type Transaction = Tables<'transactions'>
export type Category = Tables<'categories'>
export type Budget = Tables<'budgets'>
export type Investment = Tables<'investments'>
export type Loan = Tables<'loans'>
export type Account = Tables<'accounts'>
export type Lending = Tables<'lending'>
export type Notification = Tables<'notifications'>

// Insert types
export type ProfileInsert = Inserts<'profiles'>
export type TransactionInsert = Inserts<'transactions'>
export type CategoryInsert = Inserts<'categories'>
export type BudgetInsert = Inserts<'budgets'>
export type InvestmentInsert = Inserts<'investments'>
export type LoanInsert = Inserts<'loans'>
export type AccountInsert = Inserts<'accounts'>
export type LendingInsert = Inserts<'lending'>
export type NotificationInsert = Inserts<'notifications'>

// Update types
export type ProfileUpdate = Updates<'profiles'>
export type TransactionUpdate = Updates<'transactions'>
export type CategoryUpdate = Updates<'categories'>
export type BudgetUpdate = Updates<'budgets'>
export type InvestmentUpdate = Updates<'investments'>
export type LoanUpdate = Updates<'loans'>
export type AccountUpdate = Updates<'accounts'>
export type LendingUpdate = Updates<'lending'>
export type NotificationUpdate = Updates<'notifications'>

// Dashboard types
export type DashboardStats = {
  total_income: number
  total_expenses: number
  net_balance: number
  monthly_budget: number
  budget_used_percentage: number
  investment_value: number
  investment_return: number
  pending_emis: number
  overdue_lendings: number
}

export type ChartData = {
  name: string
  value: number
  color?: string
}

export type TimeSeriesData = {
  date: string
  income: number
  expenses: number
  net: number
}

export type MonthlyData = {
  month: string
  income: number
  expenses: number
  net: number
  budget: number
}

export type CategoryExpense = {
  category_id: string
  category_name: string
  amount: number
  percentage: number
  color: string
  transactions_count: number
}

export type RecentTransaction = {
  id: string
  description: string
  amount: number
  type: TransactionType
  category_name?: string
  transaction_date: string
  vendor?: string
}

export type UpcomingReminder = {
  id: string
  type: "emi" | "lending" | "budget" | "goal"
  title: string
  description: string
  amount?: number
  due_date: string
  days_until_due: number
  priority: "low" | "medium" | "high"
}

// API Response types
export type ApiResponse<T = any> = {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export type PaginatedResponse<T = any> = ApiResponse<T[]> & {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Utility types
export type ID = string
export type Currency = string
export type DateString = string
export type ColorString = string

// Enums
export type TransactionType = 'income' | 'expense'
export type AccountType = 'bank' | 'credit_card' | 'wallet' | 'investment' | 'other'
export type InvestmentType = 'stock' | 'crypto' | 'mutual_fund' | 'bond' | 'other'
export type LoanType = 'personal' | 'home' | 'car' | 'education' | 'business' | 'other'
export type LendingType = 'lent' | 'borrowed'
export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly'
export type NotificationType = 'info' | 'warning' | 'error' | 'success'
export type Theme = 'light' | 'dark' | 'system'

export type CurrencyType =
  | "USD"
  | "BDT"
  | "INR"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD";

// Currency and localization
export const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  USD: "$",
  BDT: "৳",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

export const CURRENCY_NAMES: Record<CurrencyType, string> = {
  USD: "US Dollar",
  BDT: "Bangladeshi Taka",
  INR: "Indian Rupee",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
};