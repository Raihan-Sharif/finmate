import { Database } from './database_professional'

// Investment system types
export * from './investments'

// EMI and Lending system types
export * from './emi'

// Database types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Table types
export type Role = Tables<'roles'>
export type Permission = Tables<'permissions'>
export type RolePermission = Tables<'role_permissions'>
export type Profile = Tables<'profiles'>
export type UserPermission = Tables<'user_permissions'>
export type Transaction = Tables<'transactions'>
export type Category = Tables<'categories'>
// export type Subcategory = Tables<'subcategories'> // Table not found in database schema
export type Budget = Tables<'budgets'>
export type Account = Tables<'accounts'>
// export type Notification = Tables<'notifications'> // Table not found in database schema
export type UserSession = Tables<'user_sessions'>
export type AdminAuditLog = Tables<'admin_audit_logs'>

// Insert types
export type RoleInsert = Inserts<'roles'>
export type PermissionInsert = Inserts<'permissions'>
export type RolePermissionInsert = Inserts<'role_permissions'>
export type ProfileInsert = Inserts<'profiles'>
export type UserPermissionInsert = Inserts<'user_permissions'>
export type TransactionInsert = Inserts<'transactions'>
export type CategoryInsert = Inserts<'categories'>
// export type SubcategoryInsert = Inserts<'subcategories'> // Table not found in database schema
export type BudgetInsert = Inserts<'budgets'>
export type AccountInsert = Inserts<'accounts'>
export type UserSessionInsert = Inserts<'user_sessions'>
export type AdminAuditLogInsert = Inserts<'admin_audit_logs'>

// Update types
export type RoleUpdate = Updates<'roles'>
export type PermissionUpdate = Updates<'permissions'>
export type RolePermissionUpdate = Updates<'role_permissions'>
export type ProfileUpdate = Updates<'profiles'>
export type UserPermissionUpdate = Updates<'user_permissions'>
export type TransactionUpdate = Updates<'transactions'>
export type CategoryUpdate = Updates<'categories'>
// export type SubcategoryUpdate = Updates<'subcategories'> // Table not found in database schema
export type BudgetUpdate = Updates<'budgets'>
export type AccountUpdate = Updates<'accounts'>
export type UserSessionUpdate = Updates<'user_sessions'>
export type AdminAuditLogUpdate = Updates<'admin_audit_logs'>

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
export type TransactionType = 'income' | 'expense' | 'transfer'
// Enhanced transaction type with investment integration
export type { EnhancedTransactionType } from './investments'
export type AccountType = 'bank' | 'credit_card' | 'wallet' | 'investment' | 'savings' | 'cash' | 'other'
// Legacy InvestmentType - use the new comprehensive InvestmentType from investments.ts instead
export type LoanType = 'personal' | 'home' | 'car' | 'education' | 'business' | 'other'
export type LendingType = 'lent' | 'borrowed'
export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly'
export type NotificationType = 'info' | 'warning' | 'error' | 'success'
export type Theme = 'light' | 'dark' | 'system'
export type UserRole = 'super_admin' | 'admin' | 'paid_user' | 'user'
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage'
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'role_change' | 'permission_change'

// Subscription types
export type SubscriptionPlan = 'free' | 'pro' | 'max'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial'
export type FamilyRole = 'primary' | 'spouse' | 'child' | 'member'
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

// Extended Profile with role and permissions
export type ProfileWithRole = Profile & {
  role?: Role | null
  permissions?: Permission[]
}

// Extended Transaction with relationships
export type TransactionWithRelations = Transaction & {
  category?: Category | null
  subcategory?: Category | null
  account?: Account | null
}

// Extended Category with subcategories
export type CategoryWithSubcategories = Category & {
  subcategories?: Category[]
}

// Enhanced Account with display properties
export type AccountWithBalance = Account & {
  formatted_balance?: string
  account_type_display?: string
  can_delete?: boolean
}

// Account Summary for dashboard and components
export type AccountSummary = {
  account_count: number
  total_balance: number
  default_account_id: string | null
  default_currency: string
  subscription_plan: string
  max_accounts: number
  can_create_more: boolean
}

// Account limits and validation
export type AccountLimits = {
  current: number
  limit: number
  canCreate: boolean
  planType: SubscriptionPlan
  allowedTypes: AccountType[]
}

// Subscription Profile extension
export type ProfileWithSubscription = Profile & {
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  subscription_expires_at?: string | null
  subscription_started_at?: string | null
  max_accounts: number
  family_group_id?: string | null
  family_role: FamilyRole
  invited_by?: string | null
  joined_family_at?: string | null
}

// Family Group types
export type FamilyGroup = {
  id: string
  created_by: string
  name: string
  description?: string | null
  max_members: number
  current_members: number
  subscription_plan: string
  subscription_expires_at?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type FamilyInvitation = {
  id: string
  family_group_id: string
  invited_by: string
  email: string
  role: FamilyRole
  status: InvitationStatus
  invitation_code: string
  expires_at: string
  created_at: string
  accepted_at?: string | null
}

export type FamilyMember = {
  user_id: string
  full_name: string | null
  email: string
  family_role: FamilyRole
  joined_at: string | null
  account_count: number
}

// Enhanced Account Limits for family plans
export type FamilyAccountLimits = AccountLimits & {
  familyAccountCount?: number
  isFamilyPrimary: boolean
  familyMembers?: FamilyMember[]
}

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

// Combined currency data for forms and displays
export const CURRENCIES = Object.keys(CURRENCY_SYMBOLS).map((code) => ({
  code: code as CurrencyType,
  name: CURRENCY_NAMES[code as CurrencyType],
  symbol: CURRENCY_SYMBOLS[code as CurrencyType],
}));