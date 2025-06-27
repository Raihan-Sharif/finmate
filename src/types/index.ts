// src/types/index.ts
export type CurrencyType =
  | "USD"
  | "BDT"
  | "INR"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD";

export type TransactionType = "income" | "expense";

export type InvestmentType =
  | "stock"
  | "mutual_fund"
  | "crypto"
  | "fd"
  | "bond"
  | "real_estate"
  | "other";

export type LoanStatus = "active" | "paid" | "overdue" | "closed";

export type LendingStatus = "lent" | "borrowed" | "paid" | "overdue";

export type NotificationType =
  | "budget_alert"
  | "emi_reminder"
  | "lending_reminder"
  | "goal_reminder";

export type AccountType = "savings" | "checking" | "credit_card";

export type ImportStatus = "processing" | "completed" | "failed";

export type FileType = "csv" | "pdf" | "excel";

export type ImportSource = "bank" | "credit_card" | "manual";

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  currency: CurrencyType;
  timezone: string;
  locale: string;
  ai_api_key?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  type: TransactionType;
  is_default: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  subcategories?: Category[];
  total_amount?: number;
  transaction_count?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id?: string;
  amount: number;
  currency: CurrencyType;
  description: string;
  notes?: string;
  type: TransactionType;
  transaction_date: string;
  receipt_url?: string;
  tags?: string[];
  vendor?: string;
  is_recurring: boolean;
  recurring_config?: RecurringConfig;
  imported_from?: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
}

export interface RecurringConfig {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number; // every X days/weeks/months/years
  end_date?: string;
  end_after_occurrences?: number;
  next_occurrence?: string;
}

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: InvestmentType;
  symbol?: string;
  initial_amount: number;
  current_value?: number;
  currency: CurrencyType;
  purchase_date: string;
  quantity?: number;
  notes?: string;
  goal_amount?: number;
  goal_date?: string;
  broker?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  return_amount?: number;
  return_percentage?: number;
  transactions?: InvestmentTransaction[];
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  type: "buy" | "sell" | "dividend";
  quantity: number;
  price_per_unit: number;
  total_amount: number;
  fees: number;
  transaction_date: string;
  notes?: string;
  created_at: string;
}

export interface Lending {
  id: string;
  user_id: string;
  person_name: string;
  person_contact?: string;
  amount: number;
  currency: CurrencyType;
  type: "lent" | "borrowed";
  status: LendingStatus;
  lending_date: string;
  due_date?: string;
  paid_date?: string;
  interest_rate: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  days_overdue?: number;
  interest_amount?: number;
}

export interface Loan {
  id: string;
  user_id: string;
  loan_name: string;
  lender: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  currency: CurrencyType;
  start_date: string;
  status: LoanStatus;
  paid_amount: number;
  created_at: string;
  updated_at: string;
  // Relations
  emi_payments?: EMIPayment[];
  // Computed fields
  outstanding_amount?: number;
  total_interest?: number;
  next_emi_date?: string;
}

export interface EMIPayment {
  id: string;
  loan_id: string;
  payment_date: string;
  amount: number;
  principal_component: number;
  interest_component: number;
  outstanding_balance: number;
  is_paid: boolean;
  paid_date?: string;
  late_fee: number;
  notes?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
  currency: CurrencyType;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  // Computed fields
  spent_amount?: number;
  remaining_amount?: number;
  percentage_used?: number;
  is_exceeded?: boolean;
}

export interface SavedReport {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  filters: ReportFilters;
  chart_config?: ChartConfig;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportFilters {
  date_range: {
    start: string;
    end: string;
  };
  categories?: string[];
  transaction_types?: TransactionType[];
  amount_range?: {
    min: number;
    max: number;
  };
  tags?: string[];
  vendors?: string[];
}

export interface ChartConfig {
  type: "line" | "bar" | "pie" | "area" | "donut";
  group_by: "category" | "month" | "week" | "day" | "vendor" | "tag";
  show_percentage?: boolean;
  colors?: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  account_name: string;
  bank_name: string;
  account_number?: string;
  account_type: AccountType;
  balance: number;
  currency: CurrencyType;
  is_active: boolean;
  last_sync_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportHistory {
  id: string;
  user_id: string;
  filename: string;
  file_type: FileType;
  source: ImportSource;
  records_imported: number;
  records_failed: number;
  status: ImportStatus;
  error_details?: Record<string, any>;
  created_at: string;
}

// Dashboard specific types
export interface DashboardStats {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  monthly_budget: number;
  budget_used_percentage: number;
  investment_value: number;
  investment_return: number;
  pending_emis: number;
  overdue_lendings: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
  budget: number;
}

export interface CategoryExpense {
  category_id: string;
  category_name: string;
  amount: number;
  percentage: number;
  color: string;
  transactions_count: number;
}

export interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_name?: string;
  transaction_date: string;
  vendor?: string;
}

export interface UpcomingReminder {
  id: string;
  type: "emi" | "lending" | "budget" | "goal";
  title: string;
  description: string;
  amount?: number;
  due_date: string;
  days_until_due: number;
  priority: "low" | "medium" | "high";
}

// Form types
export interface TransactionFormData {
  category_id: string;
  amount: number;
  description: string;
  notes?: string;
  type: TransactionType;
  transaction_date: string;
  tags?: string[];
  vendor?: string;
  is_recurring?: boolean;
  recurring_config?: RecurringConfig;
}

export interface InvestmentFormData {
  name: string;
  type: InvestmentType;
  symbol?: string;
  initial_amount: number;
  current_value?: number;
  purchase_date: string;
  quantity?: number;
  notes?: string;
  goal_amount?: number;
  goal_date?: string;
  broker?: string;
}

export interface LendingFormData {
  person_name: string;
  person_contact?: string;
  amount: number;
  type: "lent" | "borrowed";
  lending_date: string;
  due_date?: string;
  interest_rate?: number;
  notes?: string;
}

export interface LoanFormData {
  loan_name: string;
  lender: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  start_date: string;
}

export interface BudgetFormData {
  category_id: string;
  amount: number;
  month: number;
  year: number;
  alert_threshold?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  date_range?: {
    start: string;
    end: string;
  };
  categories?: string[];
  amount_range?: {
    min: number;
    max: number;
  };
  type?: TransactionType;
  tags?: string[];
}

export interface SortOption {
  field: string;
  direction: "asc" | "desc";
}

// AI Assistant types
export interface AIPrompt {
  type: "analysis" | "suggestion" | "budget_advice" | "investment_advice";
  context: Record<string, any>;
  user_query?: string;
}

export interface AIResponse {
  response: string;
  suggestions?: string[];
  data?: Record<string, any>;
  confidence?: number;
}

// Settings types
export interface UserPreferences {
  dashboard_layout: "compact" | "detailed";
  default_currency: CurrencyType;
  date_format: string;
  number_format: string;
  theme: "light" | "dark" | "system";
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  budget_alerts: boolean;
  emi_reminders: boolean;
  investment_updates: boolean;
  weekly_summary: boolean;
  monthly_report: boolean;
}

export interface PrivacySettings {
  data_sharing: boolean;
  analytics: boolean;
  marketing_emails: boolean;
  public_profile: boolean;
}

// Import/Export types
export interface ImportConfig {
  source: ImportSource;
  file_type: FileType;
  mapping: ColumnMapping;
  auto_categorize: boolean;
  skip_duplicates: boolean;
}

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  type?: string;
  category?: string;
  vendor?: string;
}

export interface ExportConfig {
  format: "csv" | "excel" | "pdf";
  date_range: {
    start: string;
    end: string;
  };
  include_categories: boolean;
  include_notes: boolean;
  group_by?: string;
}

// Utility types
export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AmountRange {
  min: number;
  max: number;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

// PWA types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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
