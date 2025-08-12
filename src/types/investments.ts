// =============================================
// COMPREHENSIVE INVESTMENT SYSTEM TYPES
// =============================================

export type InvestmentType = 
  | 'stock' 
  | 'mutual_fund' 
  | 'crypto' 
  | 'bond' 
  | 'fd' 
  | 'sip'
  | 'dps'
  | 'shanchay_potro'
  | 'recurring_fd'
  | 'gold'
  | 'real_estate'
  | 'pf'
  | 'pension'
  | 'other';

export type InvestmentStatus = 'active' | 'matured' | 'sold' | 'paused' | 'closed';

export type InvestmentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export type InvestmentTransactionType = 'buy' | 'sell' | 'dividend' | 'bonus' | 'split' | 'merge' | 'rights' | 'redemption';

export type RiskLevel = 'low' | 'medium' | 'high';

export type SnapshotType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// =============================================
// CORE INVESTMENT INTERFACES
// =============================================

export interface InvestmentPortfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_amount?: number;
  target_date?: string;
  risk_level: RiskLevel;
  currency: string;
  is_active: boolean;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  
  // Calculated fields (from aggregation)
  total_invested?: number;
  current_value?: number;
  total_gain_loss?: number;
  total_return_percentage?: number;
  investment_count?: number;
}

export interface Investment {
  id: string;
  user_id: string;
  portfolio_id?: string;
  
  // Basic Investment Info
  name: string;
  symbol?: string;
  type: InvestmentType;
  status: InvestmentStatus;
  
  // Investment Details
  total_units: number;
  average_cost: number;
  current_price: number;
  total_invested: number;
  current_value: number;
  
  // Investment Platform & Details
  platform?: string;
  account_number?: string;
  folio_number?: string;
  maturity_date?: string;
  interest_rate?: number;
  
  // Currency & Location
  currency: string;
  exchange?: string;
  
  // Metadata
  tags?: string[];
  notes?: string;
  documents?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Auto-calculated fields
  gain_loss: number;
  gain_loss_percentage: number;
  dividend_earned: number;
  
  // Timestamps
  purchase_date: string;
  created_at: string;
  updated_at: string;

  // Related data (populated by joins)
  portfolio?: InvestmentPortfolio;
  recent_transactions?: InvestmentTransaction[];
  price_history?: InvestmentPriceHistory[];
}

export interface InvestmentTransaction {
  id: string;
  user_id: string;
  investment_id: string;
  portfolio_id?: string;
  
  // Transaction Details
  type: InvestmentTransactionType;
  transaction_type: InvestmentTransactionType;
  amount: number;
  units: number;
  price_per_unit: number;
  total_amount: number;
  
  // Charges & Fees
  brokerage_fee?: number;
  fees: number;
  tax_amount?: number;
  other_charges?: number;
  net_amount: number;
  
  // Transaction Info
  transaction_date: string;
  settlement_date?: string;
  transaction_reference?: string;
  exchange_reference?: string;
  
  // Platform Details
  platform?: string;
  account_number?: string;
  
  // Investment & Portfolio Info
  investment_name?: string;
  investment_type?: InvestmentType;
  portfolio_name?: string;
  source?: string;
  
  // Currency & Metadata
  currency: string;
  notes?: string;
  metadata?: Record<string, any>;
  
  // Link to recurring investment
  recurring_investment_id?: string;
  is_recurring: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;

  // Related data
  investment?: Investment;
  portfolio?: InvestmentPortfolio;
}

export interface InvestmentTemplate {
  id: string;
  user_id: string;
  portfolio_id?: string;
  
  // Template Details
  name: string;
  description?: string;
  investment_type: InvestmentType;
  symbol?: string;
  investment_name?: string;
  
  // Investment Parameters
  amount: number;
  amount_per_investment: number;
  currency: string;
  platform?: string;
  account_number?: string;
  
  // Recurring Configuration
  frequency: InvestmentFrequency;
  interval_value: number;
  start_date: string;
  end_date?: string;
  target_amount?: number;
  max_executions?: number;
  
  // Auto-execution Configuration
  auto_execute: boolean;
  market_order: boolean;
  limit_price?: number;
  
  // Status & Control
  is_active: boolean;
  last_executed?: string;
  next_execution: string;
  next_execution_date?: string;
  total_executed: number;
  executed_count?: number;
  total_invested: number;
  
  // Portfolio details
  portfolio_name?: string;
  
  // Metadata
  tags?: string[];
  notes?: string;
  metadata?: Record<string, any>;
  
  // Template Type
  template_type: string;
  
  // Global Templates
  is_global: boolean;
  usage_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;

  // Related data
  portfolio?: InvestmentPortfolio;
  recent_executions?: InvestmentTransaction[];
}

export interface InvestmentPriceHistory {
  id: string;
  investment_id: string;
  symbol: string;
  
  // Price Data
  date: string;
  open_price?: number;
  high_price?: number;
  low_price?: number;
  close_price: number;
  volume?: number;
  
  // Currency
  currency: string;
  
  // Data Source
  source?: string;
  
  // Timestamps
  created_at: string;
}

export interface InvestmentPerformanceSnapshot {
  id: string;
  user_id: string;
  portfolio_id?: string;
  investment_id?: string;
  
  // Snapshot Details
  snapshot_date: string;
  snapshot_type: SnapshotType;
  
  // Performance Metrics
  total_invested: number;
  current_value: number;
  unrealized_gain_loss: number;
  realized_gain_loss: number;
  dividend_income: number;
  
  // Performance Percentages
  total_return_percentage: number;
  annualized_return?: number;
  
  // Additional Metrics
  currency: string;
  total_units?: number;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
}

// =============================================
// INPUT/OUTPUT TYPES FOR API
// =============================================

export interface CreateInvestmentPortfolioInput {
  name: string;
  description?: string;
  target_amount?: number;
  target_date?: string;
  risk_level: RiskLevel;
  currency?: string;
  color?: string;
  icon?: string;
}

export interface UpdateInvestmentPortfolioInput {
  name?: string;
  description?: string;
  target_amount?: number;
  target_date?: string;
  risk_level?: RiskLevel;
  is_active?: boolean;
  color?: string;
  icon?: string;
}

export interface CreateInvestmentRequest {
  name: string;
  symbol?: string;
  type: InvestmentType;
  portfolio_id: string;
  total_units: number;
  average_cost: number;
  current_price: number;
  currency: string;
  purchase_date: string;
  platform?: string;
  account_number?: string;
  folio_number?: string;
  maturity_date?: string;
  interest_rate?: number;
  exchange?: string;
  target_amount?: number;
  target_date?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateInvestmentInput {
  portfolio_id?: string;
  name: string;
  symbol?: string;
  type: InvestmentType;
  total_units: number;
  average_cost: number;
  current_price: number;
  platform?: string;
  account_number?: string;
  folio_number?: string;
  maturity_date?: string;
  interest_rate?: number;
  currency?: string;
  exchange?: string;
  tags?: string[];
  notes?: string;
  documents?: Record<string, any>;
  metadata?: Record<string, any>;
  purchase_date: string;
}

export interface UpdateInvestmentInput {
  portfolio_id?: string;
  name?: string;
  symbol?: string;
  type?: InvestmentType;
  status?: InvestmentStatus;
  current_price?: number;
  platform?: string;
  account_number?: string;
  folio_number?: string;
  maturity_date?: string;
  interest_rate?: number;
  exchange?: string;
  tags?: string[];
  notes?: string;
  documents?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateInvestmentTransactionInput {
  investment_id: string;
  portfolio_id?: string;
  type: InvestmentTransactionType;
  units: number;
  price_per_unit: number;
  brokerage_fee?: number;
  tax_amount?: number;
  other_charges?: number;
  transaction_date: string;
  settlement_date?: string;
  transaction_reference?: string;
  exchange_reference?: string;
  platform?: string;
  account_number?: string;
  currency?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreateInvestmentTemplateInput {
  portfolio_id?: string;
  name: string;
  description?: string;
  investment_type: InvestmentType;
  symbol?: string;
  amount_per_investment: number;
  currency?: string;
  platform?: string;
  account_number?: string;
  frequency: InvestmentFrequency;
  interval_value?: number;
  start_date: string;
  end_date?: string;
  target_amount?: number;
  auto_execute?: boolean;
  market_order?: boolean;
  limit_price?: number;
  tags?: string[];
  notes?: string;
  metadata?: Record<string, any>;
  template_type?: string;
}

export interface UpdateInvestmentTemplateInput {
  portfolio_id?: string;
  name?: string;
  description?: string;
  amount_per_investment?: number;
  currency?: string;
  platform?: string;
  account_number?: string;
  frequency?: InvestmentFrequency;
  interval_value?: number;
  start_date?: string;
  end_date?: string;
  target_amount?: number;
  auto_execute?: boolean;
  market_order?: boolean;
  limit_price?: number;
  is_active?: boolean;
  tags?: string[];
  notes?: string;
  metadata?: Record<string, any>;
  template_type?: string;
}

// =============================================
// ANALYTICS AND DASHBOARD TYPES
// =============================================

export interface InvestmentDashboardStats {
  total_portfolios: number;
  total_investments: number;
  total_invested: number;
  total_current_value: number;
  total_gain_loss: number;
  total_return_percentage: number;
  dividend_income: number;
  active_sips: number;
  monthly_sip_amount: number;
  top_performing_investment?: Investment;
  worst_performing_investment?: Investment;
  upcoming_executions: InvestmentTemplate[];
}

export interface PortfolioPerformance {
  portfolio: InvestmentPortfolio;
  total_invested: number;
  current_value: number;
  gain_loss: number;
  return_percentage: number;
  dividend_income: number;
  monthly_sip_amount: number;
  investment_count: number;
  asset_allocation: Array<{
    type: InvestmentType;
    value: number;
    percentage: number;
    count: number;
  }>;
  top_investments: Investment[];
}

export interface InvestmentAnalytics {
  portfolio_performance: PortfolioPerformance[];
  asset_allocation: Array<{
    type: InvestmentType;
    value: number;
    percentage: number;
    count: number;
  }>;
  monthly_investment_trend: Array<{
    month: string;
    invested: number;
    value: number;
    gain_loss: number;
  }>;
  sip_analysis: {
    total_sips: number;
    monthly_amount: number;
    average_cost_benefit: number;
    upcoming_sips: InvestmentTemplate[];
  };
  performance_metrics: {
    best_performer: Investment;
    worst_performer: Investment;
    highest_dividend: Investment;
    most_volatile: Investment;
  };
}

// =============================================
// FILTER AND SEARCH TYPES
// =============================================

export interface InvestmentFilters {
  portfolio_id?: string;
  type?: InvestmentType | InvestmentType[];
  status?: InvestmentStatus | InvestmentStatus[];
  symbol?: string;
  platform?: string;
  tags?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  amount_range?: {
    min: number;
    max: number;
  };
  return_range?: {
    min: number;
    max: number;
  };
}

export interface InvestmentSortOptions {
  field: 'name' | 'current_value' | 'gain_loss' | 'return_percentage' | 'purchase_date' | 'dividend_earned';
  direction: 'asc' | 'desc';
}

// =============================================
// CONSTANTS AND ENUMS
// =============================================

export const INVESTMENT_TYPES: Record<InvestmentType, { label: string; description: string; icon: string }> = {
  stock: { label: 'Stocks', description: 'Individual company shares', icon: 'trending-up' },
  mutual_fund: { label: 'Mutual Funds', description: 'Diversified fund investments', icon: 'pie-chart' },
  crypto: { label: 'Cryptocurrency', description: 'Digital currency investments', icon: 'bitcoin' },
  bond: { label: 'Bonds', description: 'Government and corporate bonds', icon: 'scroll' },
  fd: { label: 'Fixed Deposit', description: 'Bank fixed deposits', icon: 'lock' },
  sip: { label: 'SIP', description: 'Systematic Investment Plan', icon: 'repeat' },
  dps: { label: 'DPS', description: 'Deposit Pension Scheme', icon: 'piggy-bank' },
  shanchay_potro: { label: 'Shanchay Potro', description: 'Savings Certificate', icon: 'certificate' },
  recurring_fd: { label: 'Recurring FD', description: 'Recurring Fixed Deposit', icon: 'calendar' },
  gold: { label: 'Gold', description: 'Gold investments', icon: 'crown' },
  real_estate: { label: 'Real Estate', description: 'Property investments', icon: 'home' },
  pf: { label: 'Provident Fund', description: 'Employee provident fund', icon: 'briefcase' },
  pension: { label: 'Pension', description: 'Pension schemes', icon: 'user-check' },
  other: { label: 'Other', description: 'Other investment types', icon: 'more-horizontal' }
};

export const INVESTMENT_FREQUENCIES: Record<InvestmentFrequency, { label: string; days: number }> = {
  daily: { label: 'Daily', days: 1 },
  weekly: { label: 'Weekly', days: 7 },
  biweekly: { label: 'Bi-weekly', days: 14 },
  monthly: { label: 'Monthly', days: 30 },
  quarterly: { label: 'Quarterly', days: 90 },
  yearly: { label: 'Yearly', days: 365 }
};

export const RISK_LEVELS: Record<RiskLevel, { label: string; description: string; color: string }> = {
  low: { label: 'Low Risk', description: 'Low risk, stable returns', color: '#10B981' },
  medium: { label: 'Medium Risk', description: 'Medium risk, balanced approach', color: '#F59E0B' },
  high: { label: 'High Risk', description: 'High risk, high potential returns', color: '#EF4444' }
};

// =============================================
// UTILITY TYPES
// =============================================

export type InvestmentFormData = CreateInvestmentInput;
export type InvestmentTemplateFormData = CreateInvestmentTemplateInput;
export type PortfolioFormData = CreateInvestmentPortfolioInput;

// Utility type for making all properties optional except specified ones
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;