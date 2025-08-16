-- FinMate Complete Database Schema - Final Version
-- Professional, scalable, and secure database design
-- Run this script in Supabase SQL Editor to deploy everything

-- =============================================
-- COMPLETE CLEANUP - DROP EVERYTHING FIRST
-- =============================================

-- Drop specific known triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
DROP TRIGGER IF EXISTS trigger_update_budget_spent ON transactions;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
DROP TRIGGER IF EXISTS update_investments_updated_at ON investments;
DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
DROP TRIGGER IF EXISTS update_lending_updated_at ON lending;
DROP TRIGGER IF EXISTS update_emi_payments_updated_at ON emi_payments;
DROP TRIGGER IF EXISTS update_recurring_transactions_updated_at ON recurring_transactions;

-- Drop known functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_categories(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_account_balance() CASCADE;
DROP FUNCTION IF EXISTS update_budget_spent() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_financial_summary(UUID, VARCHAR(3)) CASCADE;
DROP FUNCTION IF EXISTS get_user_permissions(UUID) CASCADE;
DROP FUNCTION IF EXISTS has_permission(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_ai_insights() CASCADE;

-- Drop all tables in correct dependency order
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS investment_performance_snapshots CASCADE;
DROP TABLE IF EXISTS investment_price_history CASCADE;
DROP TABLE IF EXISTS investment_templates CASCADE;
DROP TABLE IF EXISTS investment_transactions CASCADE;
DROP TABLE IF EXISTS investment_portfolios CASCADE;
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TABLE IF EXISTS emi_payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS lending CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS theme_type CASCADE;
DROP TYPE IF EXISTS budget_period CASCADE;
DROP TYPE IF EXISTS lending_status CASCADE;
DROP TYPE IF EXISTS lending_type CASCADE;
DROP TYPE IF EXISTS loan_status CASCADE;
DROP TYPE IF EXISTS loan_type CASCADE;
DROP TYPE IF EXISTS investment_type CASCADE;
DROP TYPE IF EXISTS investment_status CASCADE;
DROP TYPE IF EXISTS investment_frequency CASCADE;
DROP TYPE IF EXISTS account_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS permission_action CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =============================================
-- ENABLE EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CUSTOM TYPES
-- =============================================
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer', 'investment_buy', 'investment_sell', 'investment_dividend', 'investment_return');
CREATE TYPE account_type AS ENUM ('bank', 'credit_card', 'wallet', 'investment', 'savings', 'other');
CREATE TYPE investment_type AS ENUM ('stock', 'mutual_fund', 'crypto', 'bond', 'fd', 'sip', 'dps', 'shanchay_potro', 'recurring_fd', 'gold', 'real_estate', 'pf', 'pension', 'other');
CREATE TYPE investment_status AS ENUM ('active', 'matured', 'sold', 'paused', 'closed');
CREATE TYPE investment_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE loan_type AS ENUM ('personal', 'home', 'car', 'education', 'business', 'purchase_emi', 'credit_card', 'other');
CREATE TYPE loan_status AS ENUM ('active', 'closed', 'defaulted');
CREATE TYPE lending_type AS ENUM ('lent', 'borrowed');
CREATE TYPE lending_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE theme_type AS ENUM ('light', 'dark', 'system');
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'paid_user', 'user');

-- Purchase EMI specific types
CREATE TYPE purchase_emi_category AS ENUM (
    'electronics',
    'furniture', 
    'appliances',
    'jewelry',
    'gadgets',
    'clothing',
    'sports',
    'travel',
    'other'
);

CREATE TYPE item_condition AS ENUM ('new', 'refurbished', 'used');
CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'manage');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'role_change');

-- =============================================
-- CORE SYSTEM TABLES
-- =============================================

-- Roles Table
CREATE TABLE roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Permissions Table
CREATE TABLE permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action permission_action NOT NULL,
    is_system BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT permissions_resource_action_unique UNIQUE (resource, action)
);

-- Role Permissions Junction Table
CREATE TABLE role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT role_permissions_unique UNIQUE (role_id, permission_id)
);

-- User Profiles Table
CREATE TABLE profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    theme theme_type DEFAULT 'system' NOT NULL,
    notifications_enabled BOOLEAN DEFAULT true NOT NULL,
    ai_insights_enabled BOOLEAN DEFAULT true NOT NULL,
    monthly_budget_limit DECIMAL(15,2),
    email_verified BOOLEAN DEFAULT false NOT NULL,
    phone_number TEXT,
    phone_verified BOOLEAN DEFAULT false NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User Permissions Override Table
CREATE TABLE user_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
    granted BOOLEAN DEFAULT true NOT NULL,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT user_permissions_unique UNIQUE (user_id, permission_id)
);

-- =============================================
-- FINANCIAL CORE TABLES
-- =============================================

-- Categories Table (Global - nullable user_id for admin-created categories)
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable - NULL for global categories
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'folder' NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280' NOT NULL,
    type transaction_type NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT categories_name_type_unique UNIQUE (name, type)
);

-- Subcategories Table (Global - references categories)
CREATE TABLE subcategories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'folder' NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT subcategories_name_category_unique UNIQUE (name, category_id)
);

-- Accounts Table (Global - user_id nullable for global accounts)
CREATE TABLE accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type account_type DEFAULT 'bank' NOT NULL,
    bank_name VARCHAR(100),
    account_number TEXT,
    balance DECIMAL(15,2) DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'BDT' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    include_in_total BOOLEAN DEFAULT true NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6' NOT NULL,
    icon VARCHAR(50) DEFAULT 'credit-card' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Transactions Table (Enhanced with Investment Integration)
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    transfer_to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    tags TEXT[],
    receipt_url TEXT,
    location TEXT,
    vendor TEXT,
    is_recurring BOOLEAN DEFAULT false NOT NULL,
    recurring_pattern JSONB,
    recurring_template_id UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL,
    metadata JSONB,
    
    -- Investment Integration Fields
    investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
    investment_transaction_id UUID REFERENCES investment_transactions(id) ON DELETE SET NULL,
    is_investment_related BOOLEAN DEFAULT false NOT NULL,
    investment_action VARCHAR(50), -- 'buy', 'sell', 'dividend', 'return', 'fee', etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT transactions_transfer_accounts_different CHECK (
        account_id IS NULL OR transfer_to_account_id IS NULL OR account_id != transfer_to_account_id
    )
);

-- Comments for Investment-Transaction Integration
COMMENT ON COLUMN transactions.investment_id IS 'Links transaction to an investment record';
COMMENT ON COLUMN transactions.investment_transaction_id IS 'Links to detailed investment transaction record';
COMMENT ON COLUMN transactions.is_investment_related IS 'Flag to easily identify investment-related transactions';
COMMENT ON COLUMN transactions.investment_action IS 'Type of investment action: buy, sell, dividend, return, etc.';
COMMENT ON COLUMN investment_transactions.main_transaction_id IS 'Links back to the main transaction record for cash flow tracking';

-- Budgets Table
CREATE TABLE budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    spent DECIMAL(15,2) DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    period budget_period DEFAULT 'monthly' NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    category_ids UUID[],
    is_active BOOLEAN DEFAULT true NOT NULL,
    alert_threshold DECIMAL(5,2) DEFAULT 80.00,
    alert_percentage DECIMAL(5,2) DEFAULT 80.00,
    alert_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT budgets_amount_positive CHECK (amount > 0),
    CONSTRAINT budgets_spent_non_negative CHECK (spent >= 0),
    CONSTRAINT budgets_dates_valid CHECK (end_date > start_date),
    CONSTRAINT budgets_alert_threshold_valid CHECK (alert_threshold > 0 AND alert_threshold <= 100),
    CONSTRAINT budgets_alert_percentage_valid CHECK (alert_percentage > 0 AND alert_percentage <= 100)
);

-- =============================================
-- ADVANCED FINANCIAL TABLES
-- =============================================

-- =============================================
-- COMPREHENSIVE INVESTMENT SYSTEM
-- =============================================

-- Investment Portfolios Table (organize investments into portfolios)
CREATE TABLE investment_portfolios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2),
    target_date DATE,
    risk_level VARCHAR(20) DEFAULT 'moderate', -- conservative, moderate, aggressive
    currency VARCHAR(3) DEFAULT 'BDT' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    color VARCHAR(7) DEFAULT '#8B5CF6' NOT NULL,
    icon VARCHAR(50) DEFAULT 'trending-up' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT investment_portfolios_name_user_unique UNIQUE (user_id, name),
    CONSTRAINT investment_portfolios_target_amount_positive CHECK (target_amount > 0)
);

-- Enhanced Investments Table
CREATE TABLE investments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    portfolio_id UUID REFERENCES investment_portfolios(id) ON DELETE SET NULL,
    
    -- Basic Investment Info
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20), -- Stock symbol, mutual fund code, etc.
    type investment_type DEFAULT 'stock' NOT NULL,
    status investment_status DEFAULT 'active' NOT NULL,
    
    -- Investment Details
    total_units DECIMAL(15,4) DEFAULT 0 NOT NULL, -- Total units owned
    average_cost DECIMAL(15,2) NOT NULL, -- Average cost per unit
    current_price DECIMAL(15,2) NOT NULL, -- Current market price per unit
    total_invested DECIMAL(15,2) DEFAULT 0 NOT NULL, -- Total amount invested
    current_value DECIMAL(15,2) DEFAULT 0 NOT NULL, -- Current market value
    
    -- Investment Platform & Details
    platform VARCHAR(100), -- Brokerage, bank, etc.
    account_number VARCHAR(100),
    folio_number VARCHAR(100), -- For mutual funds
    maturity_date DATE, -- For FDs, DPS, etc.
    interest_rate DECIMAL(5,2), -- For FDs, bonds, etc.
    
    -- Currency & Location
    currency VARCHAR(3) DEFAULT 'BDT' NOT NULL,
    exchange VARCHAR(50), -- DSE, CSE, NSE, etc.
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    documents JSONB, -- Store document URLs, certificates, etc.
    metadata JSONB, -- Additional flexible data
    
    -- Auto-calculated fields (updated by triggers)
    gain_loss DECIMAL(15,2) DEFAULT 0, -- Unrealized gain/loss
    gain_loss_percentage DECIMAL(8,4) DEFAULT 0, -- Percentage gain/loss
    dividend_earned DECIMAL(15,2) DEFAULT 0, -- Total dividends earned
    
    -- Timestamps
    purchase_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT investments_total_units_non_negative CHECK (total_units >= 0),
    CONSTRAINT investments_average_cost_positive CHECK (average_cost > 0),
    CONSTRAINT investments_current_price_positive CHECK (current_price > 0),
    CONSTRAINT investments_total_invested_non_negative CHECK (total_invested >= 0),
    CONSTRAINT investments_current_value_non_negative CHECK (current_value >= 0),
    CONSTRAINT investments_interest_rate_valid CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 100))
);

-- Investment Transactions Table (detailed transaction history)
CREATE TABLE investment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    investment_id UUID REFERENCES investments(id) ON DELETE CASCADE NOT NULL,
    portfolio_id UUID REFERENCES investment_portfolios(id) ON DELETE SET NULL,
    
    -- Transaction Details
    type VARCHAR(20) NOT NULL, -- buy, sell, dividend, bonus, split, merge, etc.
    units DECIMAL(15,4) NOT NULL, -- Units bought/sold
    price_per_unit DECIMAL(15,2) NOT NULL, -- Price per unit for this transaction
    total_amount DECIMAL(15,2) NOT NULL, -- Total transaction amount
    
    -- Charges & Fees
    brokerage_fee DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL, -- Amount after all charges
    
    -- Transaction Info
    transaction_date DATE NOT NULL,
    settlement_date DATE,
    transaction_reference VARCHAR(100), -- Broker reference, order ID, etc.
    exchange_reference VARCHAR(100), -- Exchange order ID
    
    -- Platform Details
    platform VARCHAR(100),
    account_number VARCHAR(100),
    
    -- Currency & Metadata
    currency VARCHAR(3) DEFAULT 'BDT' NOT NULL,
    notes TEXT,
    metadata JSONB,
    
    -- Link to recurring investment (if applicable)
    recurring_investment_id UUID, -- Will be linked to investment_templates
    is_recurring BOOLEAN DEFAULT false NOT NULL,
    
    -- Link to main transaction (Investment-Transaction Integration)
    main_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT investment_transactions_units_positive CHECK (units > 0),
    CONSTRAINT investment_transactions_price_positive CHECK (price_per_unit > 0),
    CONSTRAINT investment_transactions_total_positive CHECK (total_amount > 0),
    CONSTRAINT investment_transactions_charges_non_negative CHECK (
        brokerage_fee >= 0 AND tax_amount >= 0 AND other_charges >= 0
    ),
    CONSTRAINT investment_transactions_net_positive CHECK (net_amount > 0),
    CONSTRAINT investment_transactions_type_valid CHECK (
        type IN ('buy', 'sell', 'dividend', 'bonus', 'split', 'merge', 'rights', 'redemption')
    )
);

-- Investment Templates Table (for recurring investments like SIP, DCA)
CREATE TABLE investment_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    portfolio_id UUID REFERENCES investment_portfolios(id) ON DELETE SET NULL,
    
    -- Template Details
    name VARCHAR(100) NOT NULL,
    description TEXT,
    investment_type investment_type NOT NULL,
    symbol VARCHAR(20), -- Stock symbol, mutual fund code
    
    -- Investment Parameters
    amount_per_investment DECIMAL(15,2) NOT NULL, -- Amount to invest each time
    currency VARCHAR(3) DEFAULT 'BDT' NOT NULL,
    platform VARCHAR(100),
    account_number VARCHAR(100),
    
    -- Recurring Configuration
    frequency investment_frequency DEFAULT 'monthly' NOT NULL,
    interval_value INTEGER DEFAULT 1 NOT NULL, -- Every X periods
    start_date DATE NOT NULL,
    end_date DATE, -- Optional end date
    target_amount DECIMAL(15,2), -- Optional target amount
    
    -- Auto-execution Configuration
    auto_execute BOOLEAN DEFAULT true NOT NULL, -- Execute automatically or manual only
    market_order BOOLEAN DEFAULT true NOT NULL, -- Market order vs limit order
    limit_price DECIMAL(15,2), -- For limit orders
    
    -- Status & Control
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_executed DATE,
    next_execution DATE NOT NULL,
    total_executed INTEGER DEFAULT 0 NOT NULL,
    total_invested DECIMAL(15,2) DEFAULT 0 NOT NULL,
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    metadata JSONB,
    
    -- Template Type (for organization)
    template_type VARCHAR(50) DEFAULT 'sip', -- sip, dca, value_averaging, etc.
    
    -- Global Templates (for admins to create shared templates)
    is_global BOOLEAN DEFAULT false NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT investment_templates_amount_positive CHECK (amount_per_investment > 0),
    CONSTRAINT investment_templates_interval_positive CHECK (interval_value > 0),
    CONSTRAINT investment_templates_target_amount_positive CHECK (target_amount IS NULL OR target_amount > 0),
    CONSTRAINT investment_templates_limit_price_positive CHECK (limit_price IS NULL OR limit_price > 0),
    CONSTRAINT investment_templates_total_invested_non_negative CHECK (total_invested >= 0),
    CONSTRAINT investment_templates_name_user_unique UNIQUE (user_id, name)
);

-- Investment Price History Table (for performance tracking)
CREATE TABLE investment_price_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    investment_id UUID REFERENCES investments(id) ON DELETE CASCADE NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    
    -- Price Data
    date DATE NOT NULL,
    open_price DECIMAL(15,2),
    high_price DECIMAL(15,2),
    low_price DECIMAL(15,2),
    close_price DECIMAL(15,2) NOT NULL,
    volume BIGINT DEFAULT 0,
    
    -- Currency
    currency VARCHAR(3) DEFAULT 'BDT' NOT NULL,
    
    -- Data Source
    source VARCHAR(50), -- yahoo, alpha_vantage, manual, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT investment_price_history_prices_positive CHECK (
        close_price > 0 AND
        (open_price IS NULL OR open_price > 0) AND
        (high_price IS NULL OR high_price > 0) AND
        (low_price IS NULL OR low_price > 0)
    ),
    CONSTRAINT investment_price_history_volume_non_negative CHECK (volume >= 0),
    CONSTRAINT investment_price_history_date_symbol_unique UNIQUE (investment_id, date)
);

-- Investment Performance Snapshots (daily/monthly snapshots for analytics)
CREATE TABLE investment_performance_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    portfolio_id UUID REFERENCES investment_portfolios(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES investments(id) ON DELETE CASCADE, -- NULL for portfolio-level snapshots
    
    -- Snapshot Details
    snapshot_date DATE NOT NULL,
    snapshot_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    
    -- Performance Metrics
    total_invested DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) NOT NULL,
    unrealized_gain_loss DECIMAL(15,2) NOT NULL,
    realized_gain_loss DECIMAL(15,2) DEFAULT 0 NOT NULL,
    dividend_income DECIMAL(15,2) DEFAULT 0 NOT NULL,
    
    -- Performance Percentages
    total_return_percentage DECIMAL(8,4) NOT NULL,
    annualized_return DECIMAL(8,4),
    
    -- Additional Metrics
    currency VARCHAR(3) DEFAULT 'BDT' NOT NULL,
    total_units DECIMAL(15,4), -- For individual investments
    
    -- Metadata
    metadata JSONB, -- Store additional calculated metrics
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT investment_performance_total_invested_positive CHECK (total_invested >= 0),
    CONSTRAINT investment_performance_current_value_non_negative CHECK (current_value >= 0),
    CONSTRAINT investment_performance_snapshot_type_valid CHECK (
        snapshot_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')
    ),
    CONSTRAINT investment_performance_unique_snapshot UNIQUE (
        user_id, portfolio_id, investment_id, snapshot_date, snapshot_type
    )
);

-- Enhanced Loans Table
CREATE TABLE loans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lender VARCHAR(100) NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    outstanding_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    emi_amount DECIMAL(15,2) NOT NULL,
    tenure_months INTEGER NOT NULL,
    start_date DATE NOT NULL,
    next_due_date DATE,
    currency VARCHAR(3) DEFAULT 'BDT' NOT NULL,
    type loan_type DEFAULT 'personal' NOT NULL,
    status loan_status DEFAULT 'active' NOT NULL,
    account_id UUID REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    auto_debit BOOLEAN DEFAULT false,
    reminder_days INTEGER DEFAULT 3,
    prepayment_amount DECIMAL(15,2) DEFAULT 0,
    last_payment_date DATE,
    payment_day INTEGER DEFAULT 1,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT loans_principal_positive CHECK (principal_amount > 0),
    CONSTRAINT loans_outstanding_non_negative CHECK (outstanding_amount >= 0),
    CONSTRAINT loans_interest_rate_valid CHECK (interest_rate >= 0 AND interest_rate <= 100),
    CONSTRAINT loans_emi_positive CHECK (emi_amount > 0),
    CONSTRAINT loans_tenure_positive CHECK (tenure_months > 0)
);

-- Enhanced Lending Table
CREATE TABLE lending (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    person_name VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    pending_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    date DATE NOT NULL,
    due_date DATE,
    currency VARCHAR(3) DEFAULT 'BDT' NOT NULL,
    type lending_type NOT NULL,
    status lending_status DEFAULT 'pending' NOT NULL,
    account_id UUID REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    reminder_days INTEGER DEFAULT 7,
    contact_info JSONB,
    payment_history JSONB DEFAULT '[]',
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT lending_amount_positive CHECK (amount > 0),
    CONSTRAINT lending_pending_amount_non_negative CHECK (pending_amount >= 0),
    CONSTRAINT lending_pending_amount_not_exceeds CHECK (pending_amount <= amount),
    CONSTRAINT lending_interest_rate_valid CHECK (interest_rate >= 0 AND interest_rate <= 100)
);

-- Enhanced EMI Payments Table
CREATE TABLE emi_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_amount DECIMAL(15,2) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    is_paid BOOLEAN DEFAULT true NOT NULL,
    transaction_id UUID REFERENCES transactions(id),
    payment_method VARCHAR(50),
    late_fee DECIMAL(15,2) DEFAULT 0,
    is_prepayment BOOLEAN DEFAULT false,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT emi_payments_amount_positive CHECK (amount > 0),
    CONSTRAINT emi_payments_principal_positive CHECK (principal_amount > 0),
    CONSTRAINT emi_payments_interest_non_negative CHECK (interest_amount >= 0),
    CONSTRAINT emi_payments_outstanding_non_negative CHECK (outstanding_balance >= 0)
);

-- EMI Schedules Table for better payment tracking
CREATE TABLE emi_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    emi_amount DECIMAL(15,2) NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_amount DECIMAL(15,2) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    payment_date DATE,
    actual_payment_amount DECIMAL(15,2),
    late_fee DECIMAL(15,2) DEFAULT 0,
    payment_id UUID REFERENCES emi_payments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT emi_schedules_emi_positive CHECK (emi_amount > 0),
    CONSTRAINT emi_schedules_principal_positive CHECK (principal_amount > 0),
    CONSTRAINT emi_schedules_interest_non_negative CHECK (interest_amount >= 0),
    CONSTRAINT emi_schedules_outstanding_non_negative CHECK (outstanding_balance >= 0),
    CONSTRAINT emi_schedules_installment_positive CHECK (installment_number > 0),
    UNIQUE(loan_id, installment_number)
);

-- Lending Payments Table for tracking personal lending payments
CREATE TABLE lending_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lending_id UUID REFERENCES lending(id) ON DELETE CASCADE NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id UUID REFERENCES transactions(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT lending_payments_amount_positive CHECK (amount > 0)
);

-- EMI Templates Table for quick loan setup
CREATE TABLE emi_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    loan_type loan_type NOT NULL,
    default_interest_rate DECIMAL(5,2),
    default_tenure_months INTEGER,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Recurring Transactions Table
CREATE TABLE recurring_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_template JSONB NOT NULL,
    frequency VARCHAR(20) NOT NULL,
    interval_value INTEGER DEFAULT 1 NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    last_executed DATE,
    next_execution DATE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT recurring_interval_positive CHECK (interval_value > 0)
);

-- =============================================
-- NOTIFICATION AND AI TABLES
-- =============================================

-- Notifications Table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info' NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- AI Insights Table
CREATE TABLE ai_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    is_dismissed BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Budget Templates Table
CREATE TABLE budget_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BDT' NOT NULL,
    period budget_period DEFAULT 'monthly' NOT NULL,
    category_ids UUID[],
    alert_percentage DECIMAL(5,2) DEFAULT 80.00,
    alert_enabled BOOLEAN DEFAULT true NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_global BOOLEAN DEFAULT false NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT budget_templates_amount_positive CHECK (amount > 0),
    CONSTRAINT budget_templates_alert_percentage_valid CHECK (alert_percentage > 0 AND alert_percentage <= 100),
    CONSTRAINT budget_templates_name_user_unique UNIQUE (user_id, name)
);

-- =============================================
-- ADMIN AND SECURITY TABLES
-- =============================================

-- User Sessions Table
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location JSONB,
    is_active BOOLEAN DEFAULT true NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Admin Audit Logs Table
CREATE TABLE admin_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- System table indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_active ON profiles(is_active);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);

-- Financial data indexes
-- Indexes for categories table
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_type_active ON categories(type, is_active);

-- Indexes for subcategories table
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_subcategories_active ON subcategories(is_active);
CREATE INDEX idx_subcategories_sort_order ON subcategories(sort_order);
CREATE INDEX idx_subcategories_category_active ON subcategories(category_id, is_active);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_global ON accounts(user_id) WHERE user_id IS NULL;
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_active ON accounts(is_active);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_recurring_template_id ON transactions(recurring_template_id);

-- Investment-Transaction Integration Indexes
CREATE INDEX idx_transactions_investment_id ON transactions(investment_id);
CREATE INDEX idx_transactions_investment_transaction_id ON transactions(investment_transaction_id);
CREATE INDEX idx_transactions_is_investment_related ON transactions(is_investment_related);
CREATE INDEX idx_transactions_investment_action ON transactions(investment_action);
CREATE INDEX idx_transactions_user_investment ON transactions(user_id, is_investment_related);
CREATE INDEX idx_transactions_user_investment_action ON transactions(user_id, investment_action);
CREATE INDEX idx_transactions_date_investment ON transactions(date, is_investment_related);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_period ON budgets(period);
CREATE INDEX idx_budgets_active ON budgets(is_active);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);

CREATE INDEX idx_budget_templates_user_id ON budget_templates(user_id);
CREATE INDEX idx_budget_templates_active ON budget_templates(is_active);
CREATE INDEX idx_budget_templates_global ON budget_templates(is_global);
CREATE INDEX idx_budget_templates_usage_count ON budget_templates(usage_count);
CREATE INDEX idx_budget_templates_created_at ON budget_templates(created_at);

-- Investment system indexes
-- Investment Portfolios indexes
CREATE INDEX idx_investment_portfolios_user_id ON investment_portfolios(user_id);
CREATE INDEX idx_investment_portfolios_active ON investment_portfolios(is_active);
CREATE INDEX idx_investment_portfolios_user_active ON investment_portfolios(user_id, is_active);

-- Enhanced Investments indexes
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_portfolio_id ON investments(portfolio_id);
CREATE INDEX idx_investments_type ON investments(type);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_symbol ON investments(symbol);
CREATE INDEX idx_investments_user_status ON investments(user_id, status);
CREATE INDEX idx_investments_user_type ON investments(user_id, type);

-- Investment Transactions indexes
CREATE INDEX idx_investment_transactions_user_id ON investment_transactions(user_id);
CREATE INDEX idx_investment_transactions_investment_id ON investment_transactions(investment_id);
CREATE INDEX idx_investment_transactions_portfolio_id ON investment_transactions(portfolio_id);
CREATE INDEX idx_investment_transactions_type ON investment_transactions(type);
CREATE INDEX idx_investment_transactions_date ON investment_transactions(transaction_date);
CREATE INDEX idx_investment_transactions_user_date ON investment_transactions(user_id, transaction_date);
CREATE INDEX idx_investment_transactions_recurring ON investment_transactions(recurring_investment_id);
CREATE INDEX idx_investment_transactions_main_transaction_id ON investment_transactions(main_transaction_id);

-- Investment Templates indexes
CREATE INDEX idx_investment_templates_user_id ON investment_templates(user_id);
CREATE INDEX idx_investment_templates_portfolio_id ON investment_templates(portfolio_id);
CREATE INDEX idx_investment_templates_active ON investment_templates(is_active);
CREATE INDEX idx_investment_templates_next_execution ON investment_templates(next_execution);
CREATE INDEX idx_investment_templates_global ON investment_templates(is_global);
CREATE INDEX idx_investment_templates_auto_execute ON investment_templates(auto_execute, is_active);
CREATE INDEX idx_investment_templates_user_active ON investment_templates(user_id, is_active);

-- Investment Price History indexes
CREATE INDEX idx_investment_price_history_investment_id ON investment_price_history(investment_id);
CREATE INDEX idx_investment_price_history_symbol ON investment_price_history(symbol);
CREATE INDEX idx_investment_price_history_date ON investment_price_history(date);
CREATE INDEX idx_investment_price_history_symbol_date ON investment_price_history(symbol, date);

-- Investment Performance Snapshots indexes
CREATE INDEX idx_investment_performance_user_id ON investment_performance_snapshots(user_id);
CREATE INDEX idx_investment_performance_portfolio_id ON investment_performance_snapshots(portfolio_id);
CREATE INDEX idx_investment_performance_investment_id ON investment_performance_snapshots(investment_id);
CREATE INDEX idx_investment_performance_date ON investment_performance_snapshots(snapshot_date);
CREATE INDEX idx_investment_performance_type ON investment_performance_snapshots(snapshot_type);

CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_next_due_date ON loans(next_due_date);
CREATE INDEX idx_loans_account_id ON loans(account_id);
CREATE INDEX idx_loans_category_id ON loans(category_id);
CREATE INDEX idx_loans_payment_day ON loans(payment_day);

CREATE INDEX idx_lending_user_id ON lending(user_id);
CREATE INDEX idx_lending_type ON lending(type);
CREATE INDEX idx_lending_status ON lending(status);
CREATE INDEX idx_lending_due_date ON lending(due_date);
CREATE INDEX idx_lending_account_id ON lending(account_id);
CREATE INDEX idx_lending_category_id ON lending(category_id);

CREATE INDEX idx_emi_payments_user_id ON emi_payments(user_id);
CREATE INDEX idx_emi_payments_loan_id ON emi_payments(loan_id);
CREATE INDEX idx_emi_payments_payment_date ON emi_payments(payment_date);

CREATE INDEX idx_emi_schedules_user_id ON emi_schedules(user_id);
CREATE INDEX idx_emi_schedules_loan_id ON emi_schedules(loan_id);
CREATE INDEX idx_emi_schedules_due_date ON emi_schedules(due_date);
CREATE INDEX idx_emi_schedules_is_paid ON emi_schedules(is_paid);

CREATE INDEX idx_lending_payments_user_id ON lending_payments(user_id);
CREATE INDEX idx_lending_payments_lending_id ON lending_payments(lending_id);
CREATE INDEX idx_lending_payments_payment_date ON lending_payments(payment_date);

CREATE INDEX idx_emi_templates_user_id ON emi_templates(user_id);
CREATE INDEX idx_emi_templates_is_active ON emi_templates(is_active);

CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_next_execution ON recurring_transactions(next_execution);
CREATE INDEX idx_recurring_transactions_active ON recurring_transactions(is_active);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(type);
CREATE INDEX idx_ai_insights_dismissed ON ai_insights(is_dismissed);
CREATE INDEX idx_ai_insights_expires_at ON ai_insights(expires_at);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX idx_audit_logs_admin_user ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_target_user ON admin_audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;
-- Investment system tables
ALTER TABLE investment_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - System tables (simplified to avoid recursion)
-- Note: System tables are restricted. Admin access should use service_role
CREATE POLICY "Block access to roles" ON roles FOR ALL USING (false);
CREATE POLICY "Block access to permissions" ON permissions FOR ALL USING (false);
CREATE POLICY "Block access to role permissions" ON role_permissions FOR ALL USING (false);
CREATE POLICY "Block access to user permissions" ON user_permissions FOR ALL USING (false);

-- Profiles policies (simplified to avoid infinite recursion)
-- Note: For now, users can only see their own profiles to avoid recursion
-- Admin access can be managed through service_role or separate admin functions
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- User data policies (users can read global categories and manage their own custom ones)
-- Categories and subcategories are global (read-only for users)
CREATE POLICY "Users can read all categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Users can read all subcategories" ON subcategories FOR SELECT USING (true);
-- Users can read global accounts (user_id IS NULL) OR their own accounts
CREATE POLICY "Users can read all accounts" ON accounts FOR SELECT USING (
    user_id IS NULL OR auth.uid() = user_id
);
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own templates" ON budget_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read global templates" ON budget_templates FOR SELECT USING (is_global = true);
CREATE POLICY "Admins can manage global templates" ON budget_templates FOR ALL USING (
    is_global = true AND EXISTS (
        SELECT 1 FROM profiles p 
        JOIN role_permissions rp ON p.role_id = rp.role_id 
        JOIN permissions pe ON rp.permission_id = pe.id 
        WHERE p.user_id = auth.uid() 
        AND pe.name IN ('admin:all', 'templates:manage_global')
    )
);
-- Investment system policies  
CREATE POLICY "Users can manage own investment portfolios" ON investment_portfolios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own investments" ON investments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own investment transactions" ON investment_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own investment templates" ON investment_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read global investment templates" ON investment_templates FOR SELECT USING (is_global = true);
CREATE POLICY "Users can read investment price history" ON investment_price_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM investments i WHERE i.id = investment_price_history.investment_id AND i.user_id = auth.uid())
);
CREATE POLICY "System can manage investment price history" ON investment_price_history FOR ALL USING (true);
CREATE POLICY "Users can manage own investment performance" ON investment_performance_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own loans" ON loans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own lending" ON lending FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own emi payments" ON emi_payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own emi schedules" ON emi_schedules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own lending payments" ON lending_payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own emi templates" ON emi_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recurring transactions" ON recurring_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ai insights" ON ai_insights FOR ALL USING (auth.uid() = user_id);

-- Session and audit policies
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage sessions" ON user_sessions FOR ALL USING (true);
CREATE POLICY "Block audit logs access" ON admin_audit_logs FOR ALL USING (false);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Function to create GLOBAL default categories (not user-specific)
CREATE OR REPLACE FUNCTION public.create_global_categories()
RETURNS VOID AS $$
DECLARE
    -- Main category variables - Income
    salary_id UUID;
    freelance_id UUID;
    investment_id UUID;
    gifts_id UUID;
    rental_income_id UUID;
    
    -- Main category variables - Expense
    accommodation_id UUID;
    utility_bills_id UUID;
    food_dining_id UUID;
    transportation_id UUID;
    shopping_id UUID;
    entertainment_id UUID;
    healthcare_id UUID;
    education_id UUID;
    travel_id UUID;
    personal_care_id UUID;
    financial_services_id UUID;
    household_maintenance_id UUID;
    family_childcare_id UUID;
    insurance_id UUID;
    taxes_fees_id UUID;
BEGIN
    -- Check if global categories already exist
    IF EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN
        RAISE NOTICE 'Global categories already exist, skipping creation';
        RETURN;
    END IF;

    RAISE NOTICE 'Creating global categories...';

    -- Insert main income categories (no user_id since global)
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Salary', 'briefcase', '#10B981', 'income', 1) RETURNING id INTO salary_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Freelance & Business', 'laptop', '#3B82F6', 'income', 2) RETURNING id INTO freelance_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Investment Returns', 'trending-up', '#8B5CF6', 'income', 3) RETURNING id INTO investment_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Rental Income', 'home', '#84CC16', 'income', 4) RETURNING id INTO rental_income_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Gifts & Others', 'gift', '#F59E0B', 'income', 5) RETURNING id INTO gifts_id;

    -- Insert main expense categories
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Accommodation', 'home', '#EF4444', 'expense', 1) RETURNING id INTO accommodation_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Utility Bills', 'zap', '#F97316', 'expense', 2) RETURNING id INTO utility_bills_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Food & Dining', 'utensils', '#10B981', 'expense', 3) RETURNING id INTO food_dining_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Transportation', 'car', '#3B82F6', 'expense', 4) RETURNING id INTO transportation_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Healthcare', 'heart', '#EC4899', 'expense', 5) RETURNING id INTO healthcare_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Education', 'book-open', '#06B6D4', 'expense', 6) RETURNING id INTO education_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Financial Services', 'banknote', '#8B5CF6', 'expense', 7) RETURNING id INTO financial_services_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Insurance', 'shield', '#84CC16', 'expense', 8) RETURNING id INTO insurance_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Family & Childcare', 'baby', '#F59E0B', 'expense', 9) RETURNING id INTO family_childcare_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Shopping', 'shopping-bag', '#A855F7', 'expense', 10) RETURNING id INTO shopping_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Entertainment', 'film', '#14B8A6', 'expense', 11) RETURNING id INTO entertainment_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Personal Care', 'user', '#F472B6', 'expense', 12) RETURNING id INTO personal_care_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Travel', 'map-pin', '#06D6A0', 'expense', 13) RETURNING id INTO travel_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Household Maintenance', 'wrench', '#8B5A3C', 'expense', 14) RETURNING id INTO household_maintenance_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Taxes & Fees', 'receipt', '#6B7280', 'expense', 15) RETURNING id INTO taxes_fees_id;

    -- Insert subcategories for income categories
    INSERT INTO public.subcategories (category_id, name, icon, color, sort_order) VALUES
    -- Salary subcategories
    (salary_id, 'Monthly Salary', 'calendar', '#10B981', 1),
    (salary_id, 'Bonus', 'star', '#10B981', 2),
    (salary_id, 'Overtime', 'clock', '#10B981', 3),
    (salary_id, 'Festival Bonus', 'gift', '#10B981', 4),
    (salary_id, 'Commission', 'percent', '#10B981', 5),
    
    -- Freelance & Business subcategories
    (freelance_id, 'Client Projects', 'briefcase', '#3B82F6', 1),
    (freelance_id, 'Consulting', 'users', '#3B82F6', 2),
    (freelance_id, 'Online Sales', 'shopping-cart', '#3B82F6', 3),
    (freelance_id, 'Business Profit', 'trending-up', '#3B82F6', 4),
    (freelance_id, 'Partnership Income', 'handshake', '#3B82F6', 5),
    
    -- Investment Returns subcategories (including DPS, Shanchay Potro)
    (investment_id, 'Bank Interest', 'banknote', '#8B5CF6', 1),
    (investment_id, 'Stock Dividends', 'trending-up', '#8B5CF6', 2),
    (investment_id, 'Capital Gains', 'bar-chart', '#8B5CF6', 3),
    (investment_id, 'DPS (Deposit Pension Scheme)', 'piggy-bank', '#8B5CF6', 4),
    (investment_id, 'Shanchay Potro (Savings Certificate)', 'certificate', '#8B5CF6', 5),
    (investment_id, 'Mutual Fund Returns', 'pie-chart', '#8B5CF6', 6),
    (investment_id, 'Bond Interest', 'scroll', '#8B5CF6', 7),
    (investment_id, 'Fixed Deposit (FDR)', 'lock', '#8B5CF6', 8),
    
    -- Rental Income subcategories
    (rental_income_id, 'House Rent', 'home', '#84CC16', 1),
    (rental_income_id, 'Shop Rent', 'store', '#84CC16', 2),
    (rental_income_id, 'Land Rent', 'map', '#84CC16', 3),
    (rental_income_id, 'Vehicle Rent', 'car', '#84CC16', 4),
    
    -- Gifts & Others subcategories
    (gifts_id, 'Cash Gifts', 'gift', '#F59E0B', 1),
    (gifts_id, 'Refunds', 'rotate-ccw', '#F59E0B', 2),
    (gifts_id, 'Prize Money', 'award', '#F59E0B', 3),
    (gifts_id, 'Insurance Claims', 'shield-check', '#F59E0B', 4),
    (gifts_id, 'Tax Refund', 'receipt', '#F59E0B', 5);

    -- Insert subcategories for expense categories
    INSERT INTO public.subcategories (category_id, name, icon, color, sort_order) VALUES
    -- Accommodation subcategories (including maid, service charges, etc.)
    (accommodation_id, 'House Rent', 'home', '#EF4444', 1),
    (accommodation_id, 'Flat Rent', 'building', '#EF4444', 2),
    (accommodation_id, 'Mortgage Payment', 'key', '#EF4444', 3),
    (accommodation_id, 'Service Charge', 'settings', '#EF4444', 4),
    (accommodation_id, 'Security Guard', 'shield', '#EF4444', 5),
    (accommodation_id, 'Maid/Housekeeper', 'user', '#EF4444', 6),
    (accommodation_id, 'Cleaner', 'brush', '#EF4444', 7),
    (accommodation_id, 'Property Tax', 'receipt', '#EF4444', 8),
    (accommodation_id, 'Home Insurance', 'shield-check', '#EF4444', 9),
    (accommodation_id, 'Generator Bill', 'battery', '#EF4444', 10),
    
    -- Utility Bills subcategories
    (utility_bills_id, 'Electricity Bill', 'zap', '#F97316', 1),
    (utility_bills_id, 'Gas Bill', 'flame', '#F97316', 2),
    (utility_bills_id, 'Water Bill', 'droplets', '#F97316', 3),
    (utility_bills_id, 'Internet Bill', 'wifi', '#F97316', 4),
    (utility_bills_id, 'Phone Bill', 'phone', '#F97316', 5),
    (utility_bills_id, 'Cable/TV Bill', 'tv', '#F97316', 6),
    (utility_bills_id, 'Dish/Satellite TV', 'radio', '#F97316', 7),
    
    -- Food & Dining subcategories
    (food_dining_id, 'Groceries', 'shopping-cart', '#10B981', 1),
    (food_dining_id, 'Restaurant', 'utensils', '#10B981', 2),
    (food_dining_id, 'Fast Food', 'truck', '#10B981', 3),
    (food_dining_id, 'Coffee & Tea', 'coffee', '#10B981', 4),
    (food_dining_id, 'Food Delivery', 'bike', '#10B981', 5),
    (food_dining_id, 'Snacks & Beverages', 'cookie', '#10B981', 6),
    (food_dining_id, 'Meat & Fish', 'fish', '#10B981', 7),
    (food_dining_id, 'Fruits & Vegetables', 'apple', '#10B981', 8),
    
    -- Transportation subcategories
    (transportation_id, 'Fuel/Petrol/CNG', 'fuel', '#3B82F6', 1),
    (transportation_id, 'Public Transport', 'bus', '#3B82F6', 2),
    (transportation_id, 'Taxi/Uber/Pathao', 'car', '#3B82F6', 3),
    (transportation_id, 'Rickshaw/Auto', 'bike', '#3B82F6', 4),
    (transportation_id, 'Vehicle Maintenance', 'settings', '#3B82F6', 5),
    (transportation_id, 'Parking', 'square', '#3B82F6', 6),
    (transportation_id, 'Tolls', 'road', '#3B82F6', 7),
    (transportation_id, 'Vehicle Insurance', 'shield-check', '#3B82F6', 8),
    (transportation_id, 'Registration/License', 'id-card', '#3B82F6', 9),
    
    -- Shopping subcategories
    (shopping_id, 'Clothing & Fashion', 'shirt', '#A855F7', 1),
    (shopping_id, 'Electronics & Gadgets', 'smartphone', '#A855F7', 2),
    (shopping_id, 'Home & Garden', 'home', '#A855F7', 3),
    (shopping_id, 'Books & Stationery', 'book', '#A855F7', 4),
    (shopping_id, 'Gifts & Occasions', 'gift', '#A855F7', 5),
    (shopping_id, 'Online Shopping', 'shopping-bag', '#A855F7', 6),
    (shopping_id, 'Furniture', 'sofa', '#A855F7', 7),
    (shopping_id, 'Sports Equipment', 'dumbbell', '#A855F7', 8),
    
    -- Entertainment subcategories
    (entertainment_id, 'Movies & Cinema', 'film', '#14B8A6', 1),
    (entertainment_id, 'Games & Gaming', 'gamepad-2', '#14B8A6', 2),
    (entertainment_id, 'Sports Events', 'trophy', '#14B8A6', 3),
    (entertainment_id, 'Music & Streaming', 'music', '#14B8A6', 4),
    (entertainment_id, 'Concerts & Events', 'calendar', '#14B8A6', 5),
    (entertainment_id, 'Hobbies & Crafts', 'palette', '#14B8A6', 6),
    (entertainment_id, 'Books & Magazines', 'book-open', '#14B8A6', 7),
    (entertainment_id, 'Subscription Services', 'monitor', '#14B8A6', 8),
    
    -- Healthcare subcategories
    (healthcare_id, 'Doctor Visits', 'stethoscope', '#EC4899', 1),
    (healthcare_id, 'Pharmacy/Medicine', 'pill', '#EC4899', 2),
    (healthcare_id, 'Hospital Bills', 'building-2', '#EC4899', 3),
    (healthcare_id, 'Dental Care', 'smile', '#EC4899', 4),
    (healthcare_id, 'Eye Care', 'eye', '#EC4899', 5),
    (healthcare_id, 'Lab Tests & X-ray', 'test-tube', '#EC4899', 6),
    (healthcare_id, 'Vaccination', 'syringe', '#EC4899', 7),
    (healthcare_id, 'Mental Health', 'brain', '#EC4899', 8),
    (healthcare_id, 'Physiotherapy', 'activity', '#EC4899', 9),
    
    -- Education subcategories
    (education_id, 'Tuition Fees', 'graduation-cap', '#06B6D4', 1),
    (education_id, 'Books & Materials', 'book-open', '#06B6D4', 2),
    (education_id, 'School/College Fees', 'school', '#06B6D4', 3),
    (education_id, 'Private Tutoring', 'user-check', '#06B6D4', 4),
    (education_id, 'Online Courses', 'monitor', '#06B6D4', 5),
    (education_id, 'Training & Workshops', 'users', '#06B6D4', 6),
    (education_id, 'Certification & Exams', 'award', '#06B6D4', 7),
    (education_id, 'Educational Supplies', 'pen-tool', '#06B6D4', 8),
    
    -- Financial Services subcategories (including investment payments like DPS)
    (financial_services_id, 'Bank Charges & Fees', 'banknote', '#8B5CF6', 1),
    (financial_services_id, 'ATM Fees', 'credit-card', '#8B5CF6', 2),
    (financial_services_id, 'Investment in DPS', 'piggy-bank', '#8B5CF6', 3),
    (financial_services_id, 'Investment in Shanchay Potro', 'certificate', '#8B5CF6', 4),
    (financial_services_id, 'Stock Market Investment', 'trending-up', '#8B5CF6', 5),
    (financial_services_id, 'Mutual Fund Investment', 'pie-chart', '#8B5CF6', 6),
    (financial_services_id, 'Fixed Deposit (FDR)', 'lock', '#8B5CF6', 7),
    (financial_services_id, 'Loan Payments', 'credit-card', '#8B5CF6', 8),
    (financial_services_id, 'Credit Card Payments', 'card', '#8B5CF6', 9),
    (financial_services_id, 'Money Transfer Fees', 'send', '#8B5CF6', 10),
    (financial_services_id, 'Financial Advisor', 'user-check', '#8B5CF6', 11),
    
    -- Insurance subcategories
    (insurance_id, 'Health Insurance', 'heart', '#84CC16', 1),
    (insurance_id, 'Life Insurance', 'shield', '#84CC16', 2),
    (insurance_id, 'Vehicle Insurance', 'car', '#84CC16', 3),
    (insurance_id, 'Home Insurance', 'home', '#84CC16', 4),
    (insurance_id, 'Travel Insurance', 'plane', '#84CC16', 5),
    (insurance_id, 'Business Insurance', 'briefcase', '#84CC16', 6),
    
    -- Family & Childcare subcategories
    (family_childcare_id, 'Childcare/Daycare', 'baby', '#F59E0B', 1),
    (family_childcare_id, 'School Fees', 'graduation-cap', '#F59E0B', 2),
    (family_childcare_id, 'Baby Products', 'baby', '#F59E0B', 3),
    (family_childcare_id, 'Toys & Games', 'toy-brick', '#F59E0B', 4),
    (family_childcare_id, 'Family Events', 'calendar', '#F59E0B', 5),
    (family_childcare_id, 'Elderly Care', 'user', '#F59E0B', 6),
    (family_childcare_id, 'Medical Expenses', 'heart', '#F59E0B', 7),
    
    -- Personal Care subcategories
    (personal_care_id, 'Salon & Barber', 'scissors', '#F472B6', 1),
    (personal_care_id, 'Spa & Wellness', 'heart', '#F472B6', 2),
    (personal_care_id, 'Gym & Fitness', 'dumbbell', '#F472B6', 3),
    (personal_care_id, 'Cosmetics & Beauty', 'sparkles', '#F472B6', 4),
    (personal_care_id, 'Personal Hygiene', 'droplets', '#F472B6', 5),
    (personal_care_id, 'Clothing Care', 'shirt', '#F472B6', 6),
    
    -- Travel subcategories
    (travel_id, 'Flights & Airlines', 'plane', '#06D6A0', 1),
    (travel_id, 'Hotels & Accommodation', 'bed', '#06D6A0', 2),
    (travel_id, 'Transportation', 'car', '#06D6A0', 3),
    (travel_id, 'Food & Dining', 'utensils', '#06D6A0', 4),
    (travel_id, 'Tours & Activities', 'camera', '#06D6A0', 5),
    (travel_id, 'Travel Insurance', 'shield-check', '#06D6A0', 6),
    (travel_id, 'Visa & Documents', 'file-text', '#06D6A0', 7),
    (travel_id, 'Shopping & Souvenirs', 'shopping-bag', '#06D6A0', 8),
    
    -- Household Maintenance subcategories
    (household_maintenance_id, 'Home Repairs', 'wrench', '#8B5A3C', 1),
    (household_maintenance_id, 'Plumbing', 'droplets', '#8B5A3C', 2),
    (household_maintenance_id, 'Electrical Work', 'zap', '#8B5A3C', 3),
    (household_maintenance_id, 'Painting & Decoration', 'brush', '#8B5A3C', 4),
    (household_maintenance_id, 'Cleaning Supplies', 'spray-can', '#8B5A3C', 5),
    (household_maintenance_id, 'Gardening', 'flower', '#8B5A3C', 6),
    (household_maintenance_id, 'Pest Control', 'bug', '#8B5A3C', 7),
    (household_maintenance_id, 'Appliance Repair', 'settings', '#8B5A3C', 8),
    
    -- Taxes & Fees subcategories
    (taxes_fees_id, 'Income Tax', 'receipt', '#6B7280', 1),
    (taxes_fees_id, 'VAT/Sales Tax', 'percent', '#6B7280', 2),
    (taxes_fees_id, 'Property Tax', 'home', '#6B7280', 3),
    (taxes_fees_id, 'Vehicle Tax', 'car', '#6B7280', 4),
    (taxes_fees_id, 'Government Fees', 'landmark', '#6B7280', 5),
    (taxes_fees_id, 'Legal Fees', 'scale', '#6B7280', 6),
    (taxes_fees_id, 'Professional Fees', 'user-check', '#6B7280', 7),
    (taxes_fees_id, 'Penalties & Fines', 'alert-triangle', '#6B7280', 8);

    RAISE NOTICE 'Global categories and subcategories created successfully!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create global default accounts (shared by all users)
CREATE OR REPLACE FUNCTION public.create_global_accounts()
RETURNS VOID AS $$
BEGIN
    -- Check if global accounts already exist
    IF EXISTS (SELECT 1 FROM public.accounts WHERE user_id IS NULL LIMIT 1) THEN
        RAISE NOTICE 'Global accounts already exist, skipping creation';
        RETURN;
    END IF;

    RAISE NOTICE 'Creating global default accounts...';

    -- Create global default accounts (user_id = NULL)
    INSERT INTO public.accounts (user_id, name, type, balance, currency, description, icon, color, include_in_total) VALUES
    (NULL, 'Cash', 'other', 0.00, 'BDT', 'Physical cash wallet', 'wallet', '#6B7280', true),
    (NULL, 'Bank Account', 'bank', 0.00, 'BDT', 'General bank account', 'landmark', '#3B82F6', true),
    (NULL, 'Savings Account', 'savings', 0.00, 'BDT', 'Savings account', 'piggy-bank', '#10B981', true),
    (NULL, 'Credit Card', 'credit_card', 0.00, 'BDT', 'Credit card account', 'credit-card', '#EF4444', true),
    (NULL, 'bKash', 'wallet', 0.00, 'BDT', 'Mobile financial service', 'smartphone', '#E11D48', true),
    (NULL, 'Nagad', 'wallet', 0.00, 'BDT', 'Mobile financial service', 'smartphone', '#F97316', true),
    (NULL, 'Rocket', 'wallet', 0.00, 'BDT', 'Mobile financial service', 'smartphone', '#8B5CF6', true),
    (NULL, 'Investment Account', 'investment', 0.00, 'BDT', 'Investment portfolio', 'trending-up', '#8B5CF6', false);

    RAISE NOTICE 'Global accounts created successfully!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
    user_full_name TEXT;
BEGIN
    -- Get the default user role ID
    SELECT id INTO default_role_id FROM public.roles WHERE name = 'user';
    
    -- Determine full name: use raw_user_meta_data if available, otherwise extract from email
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        SPLIT_PART(NEW.email, '@', 1)
    );

    -- Insert into profiles table
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name, 
        avatar_url, 
        role_id,
        currency,
        timezone,
        theme,
        notifications_enabled,
        ai_insights_enabled,
        email_verified
    )
    VALUES (
        NEW.id, 
        NEW.email,
        user_full_name, 
        NEW.raw_user_meta_data->>'avatar_url',
        default_role_id,
        'BDT',
        'Asia/Dhaka', 
        'system',
        true,
        true,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    );

    -- NOTE: No longer creating user-specific accounts - they will use global accounts
    
    RAISE NOTICE 'Successfully created profile for user: % with email: %', NEW.id, NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile for user %: % - %', NEW.id, SQLERRM, SQLSTATE;
        -- Still return NEW so user creation doesn't fail
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to update account balance when transaction changes
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + CASE 
                WHEN NEW.type = 'income' THEN NEW.amount 
                WHEN NEW.type = 'expense' THEN -NEW.amount
                WHEN NEW.type = 'transfer' THEN -NEW.amount
                ELSE 0
            END
            WHERE id = NEW.account_id;
        END IF;
        
        -- Handle transfer to account
        IF NEW.type = 'transfer' AND NEW.transfer_to_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + NEW.amount
            WHERE id = NEW.transfer_to_account_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Revert old transaction effect
        IF OLD.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - CASE 
                WHEN OLD.type = 'income' THEN OLD.amount 
                WHEN OLD.type = 'expense' THEN -OLD.amount
                WHEN OLD.type = 'transfer' THEN -OLD.amount
                ELSE 0
            END
            WHERE id = OLD.account_id;
        END IF;
        
        IF OLD.type = 'transfer' AND OLD.transfer_to_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - OLD.amount
            WHERE id = OLD.transfer_to_account_id;
        END IF;
        
        -- Apply new transaction effect
        IF NEW.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + CASE 
                WHEN NEW.type = 'income' THEN NEW.amount 
                WHEN NEW.type = 'expense' THEN -NEW.amount
                WHEN NEW.type = 'transfer' THEN -NEW.amount
                ELSE 0
            END
            WHERE id = NEW.account_id;
        END IF;
        
        IF NEW.type = 'transfer' AND NEW.transfer_to_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + NEW.amount
            WHERE id = NEW.transfer_to_account_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - CASE 
                WHEN OLD.type = 'income' THEN OLD.amount 
                WHEN OLD.type = 'expense' THEN -OLD.amount
                WHEN OLD.type = 'transfer' THEN -OLD.amount
                ELSE 0
            END
            WHERE id = OLD.account_id;
        END IF;
        
        IF OLD.type = 'transfer' AND OLD.transfer_to_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - OLD.amount
            WHERE id = OLD.transfer_to_account_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- Function to update budget spent amount
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
    budget_record RECORD;
BEGIN
    -- Only process expense transactions
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.type = 'expense' THEN
        -- Find all budgets that include this transaction's category
        FOR budget_record IN 
            SELECT id, start_date, end_date, category_ids FROM budgets 
            WHERE user_id = NEW.user_id 
            AND is_active = true
            AND NEW.date BETWEEN start_date AND end_date
            AND (category_ids IS NULL OR NEW.category_id = ANY(category_ids))
        LOOP
            -- Recalculate spent amount for this budget
            UPDATE budgets SET spent = (
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions t
                WHERE t.user_id = NEW.user_id
                AND t.type = 'expense'
                AND t.date BETWEEN budget_record.start_date AND budget_record.end_date
                AND (budget_record.category_ids IS NULL OR t.category_id = ANY(budget_record.category_ids))
            )
            WHERE id = budget_record.id;
        END LOOP;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' AND OLD.type = 'expense' THEN
        -- Find all budgets that included this transaction's category
        FOR budget_record IN 
            SELECT id, start_date, end_date, category_ids FROM budgets 
            WHERE user_id = OLD.user_id 
            AND is_active = true
            AND OLD.date BETWEEN start_date AND end_date
            AND (category_ids IS NULL OR OLD.category_id = ANY(category_ids))
        LOOP
            -- Recalculate spent amount for this budget
            UPDATE budgets SET spent = (
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions t
                WHERE t.user_id = OLD.user_id
                AND t.type = 'expense'
                AND t.date BETWEEN budget_record.start_date AND budget_record.end_date
                AND (budget_record.category_ids IS NULL OR t.category_id = ANY(budget_record.category_ids))
            )
            WHERE id = budget_record.id;
        END LOOP;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

-- Function to get user's financial summary
CREATE OR REPLACE FUNCTION get_financial_summary(p_user_id UUID, p_currency VARCHAR(3) DEFAULT 'USD')
RETURNS TABLE (
    total_balance DECIMAL(15,2),
    monthly_income DECIMAL(15,2),
    monthly_expenses DECIMAL(15,2),
    monthly_savings DECIMAL(15,2),
    total_investments DECIMAL(15,2),
    total_loans DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
        FROM transactions 
        WHERE user_id = p_user_id 
        AND currency = p_currency
        AND date >= DATE_TRUNC('month', CURRENT_DATE)
    )
    SELECT 
        COALESCE((SELECT SUM(balance) FROM accounts WHERE (user_id = p_user_id OR user_id IS NULL) AND currency = p_currency AND include_in_total = true), 0),
        md.income,
        md.expenses,
        md.income - md.expenses,
        COALESCE((SELECT SUM(units * current_price) FROM investments WHERE user_id = p_user_id AND currency = p_currency), 0),
        COALESCE((SELECT SUM(outstanding_amount) FROM loans WHERE user_id = p_user_id AND currency = p_currency AND status = 'active'), 0)
    FROM monthly_data md;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to get user permissions (used by frontend) - FIXED VERSION
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE(
    permission_name TEXT, 
    resource TEXT, 
    action TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH role_perms AS (
        SELECT DISTINCT
            p.name::TEXT as permission_name,
            p.resource::TEXT,
            p.action::TEXT
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN profiles pr ON rp.role_id = pr.role_id
        WHERE pr.user_id = p_user_id
    ),
    user_specific_perms AS (
        SELECT DISTINCT
            p.name::TEXT as permission_name,
            p.resource::TEXT,
            p.action::TEXT
        FROM permissions p
        JOIN user_permissions up ON p.id = up.permission_id
        WHERE up.user_id = p_user_id 
        AND up.granted = true
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    )
    SELECT * FROM role_perms
    UNION
    SELECT * FROM user_specific_perms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission (used by frontend)
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_resource TEXT, p_action TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.get_user_permissions(p_user_id)
        WHERE resource = p_resource 
        AND action = p_action
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired AI insights (maintenance function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_insights()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_insights 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE budget_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$;



-- Function to get user profile with role (used by frontend)
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    currency VARCHAR(3),
    timezone TEXT,
    theme TEXT,
    notifications_enabled BOOLEAN,
    ai_insights_enabled BOOLEAN,
    monthly_budget_limit DECIMAL(15,2),
    email_verified BOOLEAN,
    phone_number TEXT,
    phone_verified BOOLEAN,
    two_factor_enabled BOOLEAN,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    role_name TEXT,
    role_display_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.currency,
        p.timezone,
        p.theme::TEXT,
        p.notifications_enabled,
        p.ai_insights_enabled,
        p.monthly_budget_limit,
        p.email_verified,
        p.phone_number,
        p.phone_verified,
        p.two_factor_enabled,
        p.last_login,
        p.is_active,
        p.created_at,
        p.updated_at,
        r.name::TEXT as role_name,
        r.display_name::TEXT as role_display_name
    FROM profiles p
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INVESTMENT-TRANSACTION INTEGRATION FUNCTIONS
-- =============================================

-- Function to automatically create main transaction when investment transaction is created
CREATE OR REPLACE FUNCTION create_investment_main_transaction()
RETURNS TRIGGER AS $$
DECLARE
    transaction_type_val transaction_type;
    account_id_val UUID;
    description_val TEXT;
    amount_val DECIMAL(15,2);
    investment_name VARCHAR(100);
BEGIN
    -- Get investment details
    SELECT name INTO investment_name 
    FROM investments 
    WHERE id = NEW.investment_id;
    
    -- Determine transaction type and account
    CASE NEW.type
        WHEN 'buy', 'sell' THEN
            -- For buy/sell, determine if it's income or expense based on type
            IF NEW.type = 'buy' THEN
                transaction_type_val := 'investment_buy';
                amount_val := NEW.net_amount; -- Money going out (expense)
                description_val := 'Investment Purchase: ' || COALESCE(investment_name, 'Unknown');
            ELSE
                transaction_type_val := 'investment_sell';
                amount_val := NEW.net_amount; -- Money coming in (income)
                description_val := 'Investment Sale: ' || COALESCE(investment_name, 'Unknown');
            END IF;
            
        WHEN 'dividend' THEN
            transaction_type_val := 'investment_dividend';
            amount_val := NEW.net_amount; -- Money coming in (income)
            description_val := 'Dividend from: ' || COALESCE(investment_name, 'Unknown');
            
        ELSE
            transaction_type_val := 'investment_return';
            amount_val := NEW.net_amount;
            description_val := 'Investment Return: ' || COALESCE(investment_name, 'Unknown');
    END CASE;
    
    -- Find user's primary investment account or create default
    SELECT id INTO account_id_val 
    FROM accounts 
    WHERE user_id = NEW.user_id 
    AND type = 'investment' 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- If no investment account exists, find primary bank account
    IF account_id_val IS NULL THEN
        SELECT id INTO account_id_val 
        FROM accounts 
        WHERE user_id = NEW.user_id 
        AND type = 'bank' 
        ORDER BY created_at ASC 
        LIMIT 1;
    END IF;
    
    -- Create the main transaction record
    INSERT INTO transactions (
        user_id,
        type,
        amount,
        currency,
        description,
        account_id,
        date,
        investment_id,
        investment_transaction_id,
        is_investment_related,
        investment_action,
        created_at,
        updated_at
    ) VALUES (
        NEW.user_id,
        transaction_type_val,
        amount_val,
        NEW.currency,
        description_val,
        account_id_val,
        NEW.transaction_date,
        NEW.investment_id,
        NEW.id,
        true,
        NEW.type,
        NOW(),
        NOW()
    ) RETURNING id INTO NEW.main_transaction_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update main transaction when investment transaction is updated
CREATE OR REPLACE FUNCTION update_investment_main_transaction()
RETURNS TRIGGER AS $$
DECLARE
    investment_name VARCHAR(100);
    description_val TEXT;
BEGIN
    -- Only update if main_transaction_id exists
    IF NEW.main_transaction_id IS NOT NULL THEN
        -- Get investment details
        SELECT name INTO investment_name 
        FROM investments 
        WHERE id = NEW.investment_id;
        
        -- Update description based on type
        CASE NEW.type
            WHEN 'buy' THEN
                description_val := 'Investment Purchase: ' || COALESCE(investment_name, 'Unknown');
            WHEN 'sell' THEN
                description_val := 'Investment Sale: ' || COALESCE(investment_name, 'Unknown');
            WHEN 'dividend' THEN
                description_val := 'Dividend from: ' || COALESCE(investment_name, 'Unknown');
            ELSE
                description_val := 'Investment Return: ' || COALESCE(investment_name, 'Unknown');
        END CASE;
        
        -- Update the main transaction
        UPDATE transactions 
        SET 
            amount = NEW.net_amount,
            description = description_val,
            date = NEW.transaction_date,
            updated_at = NOW()
        WHERE id = NEW.main_transaction_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to delete main transaction when investment transaction is deleted
CREATE OR REPLACE FUNCTION delete_investment_main_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete the associated main transaction
    IF OLD.main_transaction_id IS NOT NULL THEN
        DELETE FROM transactions 
        WHERE id = OLD.main_transaction_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UNIFIED TRANSACTION VIEW
-- =============================================

-- Create view for unified transaction view
CREATE OR REPLACE VIEW unified_transactions AS
SELECT 
    t.id,
    t.user_id,
    t.type,
    t.amount,
    t.currency,
    t.description,
    t.notes,
    t.category_id,
    t.subcategory_id,
    t.account_id,
    t.date,
    t.tags,
    t.receipt_url,
    t.location,
    t.vendor,
    t.is_investment_related,
    t.investment_action,
    t.investment_id,
    t.investment_transaction_id,
    i.name as investment_name,
    i.symbol as investment_symbol,
    i.type as investment_type,
    it.units as investment_units,
    it.price_per_unit,
    it.brokerage_fee,
    it.tax_amount,
    it.other_charges,
    a.name as account_name,
    a.type as account_type,
    c.name as category_name,
    c.icon as category_icon,
    t.created_at,
    t.updated_at
FROM transactions t
LEFT JOIN investments i ON t.investment_id = i.id
LEFT JOIN investment_transactions it ON t.investment_transaction_id = it.id
LEFT JOIN accounts a ON t.account_id = a.id
LEFT JOIN categories c ON t.category_id = c.id
ORDER BY t.date DESC, t.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON unified_transactions TO authenticated;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_templates_updated_at BEFORE UPDATE ON budget_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lending_updated_at BEFORE UPDATE ON lending
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emi_payments_updated_at BEFORE UPDATE ON emi_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for account balance updates
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Trigger for budget spent updates
CREATE TRIGGER trigger_update_budget_spent
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_budget_spent();

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default roles
INSERT INTO roles (name, display_name, description, is_system) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', true),
('admin', 'Administrator', 'Administrative access to manage users and system', true),
('user', 'User', 'Standard user with personal financial data access', true)
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (name, display_name, description, resource, action, is_system) VALUES
-- User management
('users.create', 'Create Users', 'Can create new user accounts', 'users', 'create', true),
('users.read', 'View Users', 'Can view user profiles and information', 'users', 'read', true),
('users.update', 'Update Users', 'Can modify user profiles and settings', 'users', 'update', true),
('users.delete', 'Delete Users', 'Can delete user accounts', 'users', 'delete', true),
('users.manage', 'Manage Users', 'Full user management capabilities', 'users', 'manage', true),

-- Role management
('roles.create', 'Create Roles', 'Can create new roles', 'roles', 'create', true),
('roles.read', 'View Roles', 'Can view roles and permissions', 'roles', 'read', true),
('roles.update', 'Update Roles', 'Can modify roles and permissions', 'roles', 'update', true),
('roles.delete', 'Delete Roles', 'Can delete roles', 'roles', 'delete', true),
('roles.manage', 'Manage Roles', 'Full role management capabilities', 'roles', 'manage', true),

-- System management
('system.manage', 'System Management', 'Can manage system settings and configuration', 'system', 'manage', true),
('analytics.read', 'View Analytics', 'Can view system analytics and reports', 'analytics', 'read', true),
('audit.read', 'View Audit Logs', 'Can view audit logs and system activity', 'audit', 'read', true),

-- Financial data (user-level)
('transactions.create', 'Create Transactions', 'Can create financial transactions', 'transactions', 'create', true),
('transactions.read', 'View Transactions', 'Can view transaction data', 'transactions', 'read', true),
('transactions.update', 'Update Transactions', 'Can modify transactions', 'transactions', 'update', true),
('transactions.delete', 'Delete Transactions', 'Can delete transactions', 'transactions', 'delete', true),

('budgets.create', 'Create Budgets', 'Can create budgets', 'budgets', 'create', true),
('budgets.read', 'View Budgets', 'Can view budget information', 'budgets', 'read', true),
('budgets.update', 'Update Budgets', 'Can modify budgets', 'budgets', 'update', true),
('budgets.delete', 'Delete Budgets', 'Can delete budgets', 'budgets', 'delete', true),

('accounts.create', 'Create Accounts', 'Can create financial accounts', 'accounts', 'create', true),
('accounts.read', 'View Accounts', 'Can view account information', 'accounts', 'read', true),
('accounts.update', 'Update Accounts', 'Can modify accounts', 'accounts', 'update', true),
('accounts.delete', 'Delete Accounts', 'Can delete accounts', 'accounts', 'delete', true),

('categories.create', 'Create Categories', 'Can create transaction categories', 'categories', 'create', true),
('categories.read', 'View Categories', 'Can view categories', 'categories', 'read', true),
('categories.update', 'Update Categories', 'Can modify categories', 'categories', 'update', true),
('categories.delete', 'Delete Categories', 'Can delete categories', 'categories', 'delete', true)

ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
DO $$
DECLARE
    super_admin_role_id UUID;
    admin_role_id UUID;
    user_role_id UUID;
    perm_id UUID;
BEGIN
    -- Get role IDs
    SELECT id FROM roles WHERE name = 'super_admin' INTO super_admin_role_id;
    SELECT id FROM roles WHERE name = 'admin' INTO admin_role_id;
    SELECT id FROM roles WHERE name = 'user' INTO user_role_id;
    
    -- Super Admin gets all permissions
    FOR perm_id IN SELECT id FROM permissions LOOP
        INSERT INTO role_permissions (role_id, permission_id) 
        VALUES (super_admin_role_id, perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
    
    -- Admin gets most permissions (except system.manage)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions 
    WHERE name NOT IN ('system.manage')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- User gets basic permissions for their own data
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT user_role_id, id FROM permissions 
    WHERE name IN (
        'transactions.create', 'transactions.read', 'transactions.update', 'transactions.delete',
        'budgets.create', 'budgets.read', 'budgets.update', 'budgets.delete',
        'accounts.create', 'accounts.read', 'accounts.update', 'accounts.delete',
        'categories.create', 'categories.read', 'categories.update', 'categories.delete'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- Create global categories and accounts (one-time setup)
SELECT public.create_global_categories();
SELECT public.create_global_accounts();

-- =============================================
-- RECURRING TRANSACTIONS FUNCTIONS
-- =============================================

-- Function to automatically execute recurring transactions
CREATE OR REPLACE FUNCTION execute_pending_recurring_transactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    transaction_data JSONB;
    new_transaction_id UUID;
    executed_count INTEGER := 0;
BEGIN
    -- Find all recurring transactions that need to be executed
    FOR rec IN 
        SELECT rt.* 
        FROM recurring_transactions rt
        WHERE rt.is_active = true 
        AND rt.next_execution <= CURRENT_DATE
        AND (rt.end_date IS NULL OR rt.next_execution <= rt.end_date)
    LOOP
        -- Get the transaction template
        transaction_data := rec.transaction_template;
        
        -- Create new transaction from template
        INSERT INTO transactions (
            id,
            user_id,
            type,
            amount,
            currency,
            description,
            notes,
            category_id,
            subcategory_id,
            account_id,
            date,
            tags,
            location,
            vendor,
            is_recurring,
            recurring_template_id,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            rec.user_id,
            COALESCE((transaction_data->>'type')::transaction_type, 'expense'),
            COALESCE((transaction_data->>'amount')::NUMERIC, 0),
            COALESCE(transaction_data->>'currency', 'BDT'),
            COALESCE(transaction_data->>'description', 'Recurring Transaction'),
            transaction_data->>'notes',
            CASE WHEN transaction_data ? 'category_id' THEN CAST(transaction_data->>'category_id' AS UUID) ELSE NULL END,
            CASE WHEN transaction_data ? 'subcategory_id' THEN CAST(transaction_data->>'subcategory_id' AS UUID) ELSE NULL END,
            CASE WHEN transaction_data ? 'account_id' THEN CAST(transaction_data->>'account_id' AS UUID) ELSE NULL END,
            CURRENT_DATE,
            COALESCE((transaction_data->'tags')::JSONB, '[]'::JSONB),
            transaction_data->>'location',
            transaction_data->>'vendor',
            true,
            rec.id,
            NOW(),
            NOW()
        );
        
        -- Calculate next execution date
        UPDATE recurring_transactions 
        SET 
            last_executed = CURRENT_DATE,
            next_execution = CASE 
                WHEN frequency = 'weekly' THEN CURRENT_DATE + INTERVAL '7 days'
                WHEN frequency = 'biweekly' THEN CURRENT_DATE + INTERVAL '14 days'  
                WHEN frequency = 'monthly' THEN CURRENT_DATE + INTERVAL '1 month'
                WHEN frequency = 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months'
                WHEN frequency = 'yearly' THEN CURRENT_DATE + INTERVAL '1 year'
                ELSE CURRENT_DATE + INTERVAL '1 month' -- default fallback
            END,
            updated_at = NOW()
        WHERE id = rec.id;
        
        executed_count := executed_count + 1;
    END LOOP;
    
    RETURN executed_count;
END;
$$;

-- Helper function to calculate next execution date
CREATE OR REPLACE FUNCTION calculate_next_execution_date(
    base_date DATE,
    frequency VARCHAR(20),
    interval_value INTEGER DEFAULT 1
) RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE 
        WHEN frequency = 'weekly' THEN base_date + (interval_value * INTERVAL '7 days')
        WHEN frequency = 'biweekly' THEN base_date + (interval_value * INTERVAL '14 days')
        WHEN frequency = 'monthly' THEN base_date + (interval_value * INTERVAL '1 month')
        WHEN frequency = 'quarterly' THEN base_date + (interval_value * INTERVAL '3 months')
        WHEN frequency = 'yearly' THEN base_date + (interval_value * INTERVAL '1 year')
        ELSE base_date + INTERVAL '1 month'
    END;
END;
$$;

-- Update existing transactions to link to their recurring templates (migration)
-- This updates transactions that have recurring_pattern with recurring_id
UPDATE transactions 
SET recurring_template_id = CAST(recurring_pattern->>'recurring_id' AS UUID)
WHERE recurring_pattern IS NOT NULL 
AND recurring_pattern ? 'recurring_id'
AND CAST(recurring_pattern->>'recurring_id' AS UUID) IN (
    SELECT id FROM recurring_transactions
);

-- =============================================
-- CRON JOB SETUP (Supabase pg_cron extension)
-- =============================================
-- Note: This requires the pg_cron extension to be enabled
-- You can enable it in Supabase Dashboard > Database > Extensions
-- Or run: CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule recurring transactions to run daily at 2 AM
-- Uncomment the following line after enabling pg_cron extension:
-- SELECT cron.schedule('execute-recurring-transactions', '0 2 * * *', 'SELECT execute_pending_recurring_transactions();');

-- =============================================
-- INVESTMENT SYSTEM FUNCTIONS
-- =============================================

-- Function to update investment calculated fields
CREATE OR REPLACE FUNCTION update_investment_calculated_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate current value
    NEW.current_value = NEW.total_units * NEW.current_price;
    
    -- Calculate gain/loss
    NEW.gain_loss = NEW.current_value - NEW.total_invested;
    
    -- Calculate gain/loss percentage
    IF NEW.total_invested > 0 THEN
        NEW.gain_loss_percentage = (NEW.gain_loss / NEW.total_invested) * 100;
    ELSE
        NEW.gain_loss_percentage = 0;
    END IF;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Function to update investment from transactions
CREATE OR REPLACE FUNCTION update_investment_from_transactions()
RETURNS TRIGGER AS $$
DECLARE
    investment_record RECORD;
    total_buy_units DECIMAL(15,4) := 0;
    total_buy_amount DECIMAL(15,2) := 0;
    total_sell_units DECIMAL(15,4) := 0;
    avg_cost DECIMAL(15,2) := 0;
    total_dividend DECIMAL(15,2) := 0;
BEGIN
    -- Get investment record
    SELECT * INTO investment_record FROM investments WHERE id = COALESCE(NEW.investment_id, OLD.investment_id);
    
    IF NOT FOUND THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Recalculate totals from all transactions
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'buy' THEN units ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'buy' THEN net_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'sell' THEN units ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'dividend' THEN net_amount ELSE 0 END), 0)
    INTO total_buy_units, total_buy_amount, total_sell_units, total_dividend
    FROM investment_transactions 
    WHERE investment_id = investment_record.id;
    
    -- Calculate average cost
    IF total_buy_units > 0 THEN
        avg_cost = total_buy_amount / total_buy_units;
    END IF;
    
    -- Update investment record
    UPDATE investments SET
        total_units = total_buy_units - total_sell_units,
        total_invested = total_buy_amount,
        average_cost = COALESCE(avg_cost, average_cost), -- Keep existing if no buy transactions
        dividend_earned = total_dividend,
        updated_at = NOW()
    WHERE id = investment_record.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

-- Function to execute pending investment templates
CREATE OR REPLACE FUNCTION execute_pending_investment_templates()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    template RECORD;
    new_transaction_id UUID;
    executed_count INTEGER := 0;
BEGIN
    -- Find all active investment templates that need execution
    FOR template IN 
        SELECT it.* 
        FROM investment_templates it
        WHERE it.is_active = true 
        AND it.auto_execute = true
        AND it.next_execution <= CURRENT_DATE
        AND (it.end_date IS NULL OR it.next_execution <= it.end_date)
        AND (it.target_amount IS NULL OR it.total_invested < it.target_amount)
    LOOP
        -- Create investment transaction from template
        INSERT INTO investment_transactions (
            user_id,
            investment_id,
            portfolio_id,
            type,
            units,
            price_per_unit,
            total_amount,
            net_amount,
            transaction_date,
            platform,
            account_number,
            currency,
            recurring_investment_id,
            is_recurring,
            notes,
            created_at,
            updated_at
        ) VALUES (
            template.user_id,
            -- Find or create investment record for this template
            (SELECT id FROM investments WHERE user_id = template.user_id AND symbol = template.symbol AND type = template.investment_type LIMIT 1),
            template.portfolio_id,
            'buy',
            1, -- Placeholder - will be calculated based on amount and current price
            template.amount_per_investment, -- Placeholder - for SIP this will be amount, for unit-based this will be price
            template.amount_per_investment,
            template.amount_per_investment,
            CURRENT_DATE,
            template.platform,
            template.account_number,
            template.currency,
            template.id,
            true,
            'Automated investment from template: ' || template.name,
            NOW(),
            NOW()
        ) RETURNING id INTO new_transaction_id;
        
        -- Update investment template
        UPDATE investment_templates 
        SET 
            last_executed = CURRENT_DATE,
            next_execution = CASE 
                WHEN frequency = 'daily' THEN CURRENT_DATE + INTERVAL '1 day' * interval_value
                WHEN frequency = 'weekly' THEN CURRENT_DATE + INTERVAL '1 week' * interval_value
                WHEN frequency = 'biweekly' THEN CURRENT_DATE + INTERVAL '2 weeks' * interval_value
                WHEN frequency = 'monthly' THEN CURRENT_DATE + INTERVAL '1 month' * interval_value
                WHEN frequency = 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months' * interval_value
                WHEN frequency = 'yearly' THEN CURRENT_DATE + INTERVAL '1 year' * interval_value
                ELSE CURRENT_DATE + INTERVAL '1 month' -- default fallback
            END,
            total_executed = total_executed + 1,
            total_invested = total_invested + template.amount_per_investment,
            updated_at = NOW()
        WHERE id = template.id;
        
        executed_count := executed_count + 1;
    END LOOP;
    
    RETURN executed_count;
END;
$$;

-- Function to increment investment template usage count
CREATE OR REPLACE FUNCTION increment_investment_template_usage(template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE investment_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$;

-- =============================================
-- INVESTMENT SYSTEM TRIGGERS
-- =============================================

-- Trigger for investment calculated fields
CREATE TRIGGER trigger_update_investment_calculated_fields
    BEFORE INSERT OR UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_investment_calculated_fields();

-- Trigger for updating investment from transactions
CREATE TRIGGER trigger_update_investment_from_transactions
    AFTER INSERT OR UPDATE OR DELETE ON investment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_investment_from_transactions();

-- Investment-Transaction Integration Triggers
CREATE TRIGGER trigger_create_investment_main_transaction
    BEFORE INSERT ON investment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION create_investment_main_transaction();

CREATE TRIGGER trigger_update_investment_main_transaction
    AFTER UPDATE ON investment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_investment_main_transaction();

CREATE TRIGGER trigger_delete_investment_main_transaction
    AFTER DELETE ON investment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION delete_investment_main_transaction();

-- Triggers for investment system updated_at columns
CREATE TRIGGER update_investment_portfolios_updated_at BEFORE UPDATE ON investment_portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_transactions_updated_at BEFORE UPDATE ON investment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_templates_updated_at BEFORE UPDATE ON investment_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Schedule investment template execution (uncomment after enabling pg_cron)
-- SELECT cron.schedule('execute-investment-templates', '0 3 * * *', 'SELECT execute_pending_investment_templates();');

-- =============================================
-- EMI SYSTEM FUNCTIONS
-- =============================================

-- Function to generate EMI schedule for a loan
CREATE OR REPLACE FUNCTION generate_emi_schedule(
    p_loan_id UUID,
    p_user_id UUID
) RETURNS TABLE (
    installment_number INTEGER,
    due_date DATE,
    emi_amount DECIMAL(15,2),
    principal_amount DECIMAL(15,2),
    interest_amount DECIMAL(15,2),
    outstanding_balance DECIMAL(15,2)
) AS $$
DECLARE
    loan_record RECORD;
    monthly_rate DECIMAL;
    remaining_balance DECIMAL;
    due_date DATE;
    i INTEGER;
    interest_for_month DECIMAL;
    principal_for_month DECIMAL;
BEGIN
    -- Get loan details
    SELECT * INTO loan_record 
    FROM loans 
    WHERE id = p_loan_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan not found or access denied';
    END IF;
    
    monthly_rate := loan_record.interest_rate / 12 / 100;
    remaining_balance := loan_record.principal_amount;
    due_date := loan_record.start_date;
    
    -- Generate schedule for each month
    FOR i IN 1..loan_record.tenure_months LOOP
        -- Calculate interest and principal for this month
        interest_for_month := remaining_balance * monthly_rate;
        principal_for_month := loan_record.emi_amount - interest_for_month;
        remaining_balance := remaining_balance - principal_for_month;
        
        -- Ensure remaining balance doesn't go negative
        IF remaining_balance < 0 THEN
            principal_for_month := principal_for_month + remaining_balance;
            remaining_balance := 0;
        END IF;
        
        -- Set due date (use payment_day if set, otherwise use start_date day)
        due_date := (due_date + INTERVAL '1 month')::DATE;
        IF loan_record.payment_day IS NOT NULL THEN
            due_date := DATE_TRUNC('month', due_date) + (loan_record.payment_day - 1) * INTERVAL '1 day';
        END IF;
        
        RETURN QUERY SELECT 
            i,
            due_date,
            loan_record.emi_amount,
            principal_for_month,
            interest_for_month,
            remaining_balance;
    END LOOP;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to create EMI schedule entries
CREATE OR REPLACE FUNCTION create_emi_schedule_entries(
    p_loan_id UUID,
    p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
    schedule_record RECORD;
    entries_created INTEGER := 0;
BEGIN
    -- Delete existing schedule entries for this loan
    DELETE FROM emi_schedules WHERE loan_id = p_loan_id AND user_id = p_user_id;
    
    -- Create new schedule entries
    FOR schedule_record IN 
        SELECT * FROM generate_emi_schedule(p_loan_id, p_user_id)
    LOOP
        INSERT INTO emi_schedules (
            user_id,
            loan_id,
            installment_number,
            due_date,
            emi_amount,
            principal_amount,
            interest_amount,
            outstanding_balance
        ) VALUES (
            p_user_id,
            p_loan_id,
            schedule_record.installment_number,
            schedule_record.due_date,
            schedule_record.emi_amount,
            schedule_record.principal_amount,
            schedule_record.interest_amount,
            schedule_record.outstanding_balance
        );
        
        entries_created := entries_created + 1;
    END LOOP;
    
    RETURN entries_created;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to get EMI overview for a user
CREATE OR REPLACE FUNCTION get_emi_overview(
    p_user_id UUID,
    p_currency VARCHAR(3) DEFAULT 'BDT'
) RETURNS TABLE (
    total_active_loans INTEGER,
    total_outstanding_amount DECIMAL(15,2),
    total_monthly_emi DECIMAL(15,2),
    overdue_payments INTEGER,
    overdue_amount DECIMAL(15,2),
    next_payment_date DATE,
    next_payment_amount DECIMAL(15,2),
    total_paid_this_month DECIMAL(15,2),
    total_pending_this_month DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Loan summary
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM loans 
            WHERE user_id = p_user_id 
            AND status = 'active' 
            AND currency = p_currency
        ), 0) as total_active_loans,
        
        COALESCE((
            SELECT SUM(outstanding_amount)
            FROM loans 
            WHERE user_id = p_user_id 
            AND status = 'active' 
            AND currency = p_currency
        ), 0) as total_outstanding_amount,
        
        COALESCE((
            SELECT SUM(emi_amount)
            FROM loans 
            WHERE user_id = p_user_id 
            AND status = 'active' 
            AND currency = p_currency
        ), 0) as total_monthly_emi,
        
        -- Overdue summary
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = false 
            AND es.due_date < CURRENT_DATE
            AND l.currency = p_currency
            AND l.status = 'active'
        ), 0) as overdue_payments,
        
        COALESCE((
            SELECT SUM(es.emi_amount)
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = false 
            AND es.due_date < CURRENT_DATE
            AND l.currency = p_currency
            AND l.status = 'active'
        ), 0) as overdue_amount,
        
        -- Next payment (using loans table if emi_schedules is empty)
        COALESCE((
            SELECT es.due_date
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = false 
            AND l.currency = p_currency
            AND l.status = 'active'
            ORDER BY es.due_date ASC
            LIMIT 1
        ), (
            SELECT next_due_date
            FROM loans
            WHERE user_id = p_user_id 
            AND status = 'active'
            AND currency = p_currency
            AND next_due_date IS NOT NULL
            ORDER BY next_due_date ASC
            LIMIT 1
        )) as next_payment_date,
        
        COALESCE((
            SELECT es.emi_amount
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = false 
            AND l.currency = p_currency
            AND l.status = 'active'
            ORDER BY es.due_date ASC
            LIMIT 1
        ), (
            SELECT emi_amount
            FROM loans
            WHERE user_id = p_user_id 
            AND status = 'active'
            AND currency = p_currency
            AND next_due_date IS NOT NULL
            ORDER BY next_due_date ASC
            LIMIT 1
        )) as next_payment_amount,
        
        -- Monthly summary
        COALESCE((
            SELECT SUM(es.emi_amount)
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = true
            AND EXTRACT(MONTH FROM es.due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM es.due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND l.currency = p_currency
            AND l.status = 'active'
        ), 0) as total_paid_this_month,
        
        COALESCE((
            SELECT SUM(es.emi_amount)
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = false
            AND EXTRACT(MONTH FROM es.due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM es.due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND l.currency = p_currency
            AND l.status = 'active'
        ), 0) as total_pending_this_month;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to get lending overview
CREATE OR REPLACE FUNCTION get_lending_overview(
    p_user_id UUID,
    p_currency VARCHAR(3) DEFAULT 'BDT'
) RETURNS TABLE (
    total_lent_amount DECIMAL(15,2),
    total_borrowed_amount DECIMAL(15,2),
    total_lent_pending DECIMAL(15,2),
    total_borrowed_pending DECIMAL(15,2),
    overdue_lent_count INTEGER,
    overdue_borrowed_count INTEGER,
    overdue_lent_amount DECIMAL(15,2),
    overdue_borrowed_amount DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((
            SELECT SUM(amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'lent' 
            AND currency = p_currency
        ), 0) as total_lent_amount,
        
        COALESCE((
            SELECT SUM(amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'borrowed' 
            AND currency = p_currency
        ), 0) as total_borrowed_amount,
        
        COALESCE((
            SELECT SUM(pending_amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'lent' 
            AND status IN ('pending', 'partial') 
            AND currency = p_currency
        ), 0) as total_lent_pending,
        
        COALESCE((
            SELECT SUM(pending_amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'borrowed' 
            AND status IN ('pending', 'partial') 
            AND currency = p_currency
        ), 0) as total_borrowed_pending,
        
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'lent' 
            AND status = 'overdue' 
            AND currency = p_currency
        ), 0) as overdue_lent_count,
        
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'borrowed' 
            AND status = 'overdue' 
            AND currency = p_currency
        ), 0) as overdue_borrowed_count,
        
        COALESCE((
            SELECT SUM(pending_amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'lent' 
            AND status = 'overdue' 
            AND currency = p_currency
        ), 0) as overdue_lent_amount,
        
        COALESCE((
            SELECT SUM(pending_amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'borrowed' 
            AND status = 'overdue' 
            AND currency = p_currency
        ), 0) as overdue_borrowed_amount;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Function to mark EMI payment as paid
CREATE OR REPLACE FUNCTION mark_emi_payment_paid(
    p_schedule_id UUID,
    p_user_id UUID,
    p_payment_amount DECIMAL(15,2),
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_payment_method VARCHAR(50) DEFAULT NULL,
    p_late_fee DECIMAL(15,2) DEFAULT 0,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_schedule_record RECORD;
    v_payment_id UUID;
    v_loan_record RECORD;
BEGIN
    -- Get schedule record
    SELECT * INTO v_schedule_record 
    FROM emi_schedules 
    WHERE id = p_schedule_id AND user_id = p_user_id AND is_paid = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'EMI schedule not found or already paid';
    END IF;
    
    -- Get loan record
    SELECT * INTO v_loan_record 
    FROM loans 
    WHERE id = v_schedule_record.loan_id AND user_id = p_user_id;
    
    -- Create EMI payment record
    INSERT INTO emi_payments (
        user_id,
        loan_id,
        payment_date,
        amount,
        principal_amount,
        interest_amount,
        outstanding_balance,
        is_paid,
        payment_method,
        late_fee,
        notes
    ) VALUES (
        p_user_id,
        v_schedule_record.loan_id,
        p_payment_date,
        p_payment_amount,
        v_schedule_record.principal_amount,
        v_schedule_record.interest_amount,
        v_schedule_record.outstanding_balance,
        true,
        p_payment_method,
        p_late_fee,
        p_notes
    ) RETURNING id INTO v_payment_id;
    
    -- Update schedule as paid
    UPDATE emi_schedules 
    SET 
        is_paid = true,
        payment_date = p_payment_date,
        actual_payment_amount = p_payment_amount,
        late_fee = p_late_fee,
        payment_id = v_payment_id,
        updated_at = NOW()
    WHERE id = p_schedule_id;
    
    -- Update loan outstanding amount and last payment date
    UPDATE loans 
    SET 
        outstanding_amount = outstanding_amount - v_schedule_record.principal_amount,
        last_payment_date = p_payment_date,
        next_due_date = CASE 
            WHEN outstanding_amount - v_schedule_record.principal_amount <= 0 THEN NULL
            ELSE (
                SELECT MIN(due_date) 
                FROM emi_schedules 
                WHERE loan_id = v_loan_record.id AND is_paid = false AND id != p_schedule_id
            )
        END,
        status = CASE 
            WHEN outstanding_amount - v_schedule_record.principal_amount <= 0 THEN 'closed'::loan_status
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = v_schedule_record.loan_id;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- =============================================
-- PURCHASE EMI FUNCTIONS
-- =============================================

-- Create a view for purchase EMIs for easier querying
CREATE OR REPLACE VIEW purchase_emis AS
SELECT 
    l.*,
    (l.metadata->>'item_name') as item_name,
    (l.metadata->>'vendor_name') as vendor_name,
    (l.metadata->>'purchase_category') as purchase_category_text,
    (l.metadata->>'purchase_date')::date as purchase_date,
    (l.metadata->>'item_condition') as item_condition_text,
    (l.metadata->>'warranty_period')::integer as warranty_period_months,
    (l.metadata->>'down_payment')::decimal(15,2) as down_payment
FROM loans l
WHERE l.type = 'purchase_emi';

-- Function to create purchase EMI with proper validation
CREATE OR REPLACE FUNCTION create_purchase_emi(
    p_user_id UUID,
    p_item_name TEXT,
    p_vendor_name TEXT,
    p_purchase_category TEXT,
    p_principal_amount DECIMAL(15,2),
    p_interest_rate DECIMAL(5,2),
    p_tenure_months INTEGER,
    p_purchase_date DATE,
    p_down_payment DECIMAL(15,2) DEFAULT 0,
    p_item_condition TEXT DEFAULT 'new',
    p_warranty_period INTEGER DEFAULT NULL,
    p_payment_day INTEGER DEFAULT 1,
    p_account_id UUID DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_currency TEXT DEFAULT 'BDT'
) RETURNS TABLE(
    loan_id UUID,
    emi_amount DECIMAL(15,2),
    success BOOLEAN,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_loan_id UUID;
    v_emi_amount DECIMAL(15,2);
    v_loan_amount DECIMAL(15,2);
    v_monthly_rate DECIMAL(10,8);
    v_next_due_date DATE;
BEGIN
    -- Validate inputs
    IF p_principal_amount <= 0 THEN
        RETURN QUERY SELECT NULL::UUID, 0::DECIMAL(15,2), FALSE, 'Principal amount must be greater than 0';
        RETURN;
    END IF;
    
    IF p_down_payment < 0 OR p_down_payment >= p_principal_amount THEN
        RETURN QUERY SELECT NULL::UUID, 0::DECIMAL(15,2), FALSE, 'Down payment must be between 0 and principal amount';
        RETURN;
    END IF;
    
    IF p_tenure_months <= 0 OR p_tenure_months > 120 THEN
        RETURN QUERY SELECT NULL::UUID, 0::DECIMAL(15,2), FALSE, 'Tenure must be between 1 and 120 months';
        RETURN;
    END IF;
    
    -- Calculate loan amount after down payment
    v_loan_amount := p_principal_amount - COALESCE(p_down_payment, 0);
    
    -- Calculate EMI amount
    IF p_interest_rate = 0 THEN
        v_emi_amount := v_loan_amount / p_tenure_months;
    ELSE
        v_monthly_rate := p_interest_rate / 12.0 / 100.0;
        v_emi_amount := (v_loan_amount * v_monthly_rate * POWER(1 + v_monthly_rate, p_tenure_months)) / 
                       (POWER(1 + v_monthly_rate, p_tenure_months) - 1);
    END IF;
    
    -- Round EMI to 2 decimal places
    v_emi_amount := ROUND(v_emi_amount, 2);
    
    -- Calculate next due date
    v_next_due_date := DATE_TRUNC('month', p_purchase_date) + INTERVAL '1 month' + (p_payment_day - 1) * INTERVAL '1 day';
    
    -- Insert loan record
    INSERT INTO loans (
        user_id,
        lender,
        principal_amount,
        outstanding_amount,
        interest_rate,
        emi_amount,
        tenure_months,
        start_date,
        next_due_date,
        currency,
        type,
        status,
        account_id,
        category_id,
        payment_day,
        notes,
        metadata
    ) VALUES (
        p_user_id,
        p_vendor_name,
        p_principal_amount,
        v_loan_amount, -- Outstanding is loan amount after down payment
        p_interest_rate,
        v_emi_amount,
        p_tenure_months,
        p_purchase_date,
        v_next_due_date,
        p_currency,
        'purchase_emi'::loan_type,
        'active'::loan_status,
        p_account_id,
        p_category_id,
        p_payment_day,
        p_notes,
        jsonb_build_object(
            'item_name', p_item_name,
            'vendor_name', p_vendor_name,
            'purchase_category', p_purchase_category,
            'purchase_date', p_purchase_date,
            'item_condition', p_item_condition,
            'warranty_period', p_warranty_period,
            'down_payment', p_down_payment
        )
    ) RETURNING id INTO v_loan_id;
    
    -- Return success result
    RETURN QUERY SELECT v_loan_id, v_emi_amount, TRUE, 'Purchase EMI created successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT NULL::UUID, 0::DECIMAL(15,2), FALSE, 'Error creating purchase EMI: ' || SQLERRM;
END;
$$;

-- Function to get purchase EMI statistics
CREATE OR REPLACE FUNCTION get_purchase_emi_overview(p_user_id UUID)
RETURNS TABLE(
    total_purchase_emis INTEGER,
    total_outstanding_amount DECIMAL(15,2),
    total_monthly_emi DECIMAL(15,2),
    active_purchases INTEGER,
    by_category JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH purchase_stats AS (
        SELECT 
            COUNT(*)::INTEGER as total_count,
            COALESCE(SUM(outstanding_amount), 0) as total_outstanding,
            COALESCE(SUM(emi_amount), 0) as total_emi,
            COUNT(CASE WHEN status = 'active' THEN 1 END)::INTEGER as active_count
        FROM loans
        WHERE user_id = p_user_id AND type = 'purchase_emi'
    ),
    category_stats AS (
        SELECT COALESCE(
            jsonb_object_agg(
                COALESCE(metadata->>'purchase_category', 'other'),
                jsonb_build_object(
                    'count', cat_count,
                    'total_amount', cat_total,
                    'outstanding', cat_outstanding
                )
            ),
            '{}'::jsonb
        ) as categories
        FROM (
            SELECT 
                COALESCE(metadata->>'purchase_category', 'other') as category,
                COUNT(*) as cat_count,
                COALESCE(SUM(principal_amount), 0) as cat_total,
                COALESCE(SUM(outstanding_amount), 0) as cat_outstanding
            FROM loans
            WHERE user_id = p_user_id AND type = 'purchase_emi'
            GROUP BY COALESCE(metadata->>'purchase_category', 'other')
        ) cat_data
    )
    SELECT 
        ps.total_count,
        ps.total_outstanding,
        ps.total_emi,
        ps.active_count,
        cs.categories
    FROM purchase_stats ps
    CROSS JOIN category_stats cs;
END;
$$;

-- Function to get all user tables for permissions
CREATE OR REPLACE FUNCTION get_user_tables(p_user_id UUID)
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT unnest(ARRAY[
        'profiles', 'categories', 'subcategories', 'accounts', 'transactions', 'budgets', 'budget_templates',
        'investment_portfolios', 'investments', 'investment_transactions', 'investment_templates', 
        'investment_price_history', 'investment_performance_snapshots',
        'loans', 'lending', 'emi_payments', 'emi_schedules', 'lending_payments', 'emi_templates',
        'recurring_transactions', 'notifications', 'ai_insights', 'user_sessions', 'admin_audit_logs'
    ])::TEXT;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- =============================================
-- PURCHASE EMI INDEXES FOR PERFORMANCE
-- =============================================

-- Add indexes for better performance on purchase EMI queries
CREATE INDEX IF NOT EXISTS idx_loans_type_purchase_emi ON loans(user_id, type) WHERE type = 'purchase_emi';
CREATE INDEX IF NOT EXISTS idx_loans_metadata_purchase_category ON loans((metadata->>'purchase_category')) WHERE type = 'purchase_emi';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================
-- FINAL VERIFICATION
-- =============================================
SELECT 
    'FinMate Complete Database Schema Deployed Successfully!' as message,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'roles', 'permissions', 'role_permissions', 'profiles', 'user_permissions',
    'categories', 'subcategories', 'accounts', 'transactions', 'budgets', 'budget_templates',
    'investment_portfolios', 'investments', 'investment_transactions', 'investment_templates', 
    'investment_price_history', 'investment_performance_snapshots',
    'loans', 'lending', 'emi_payments', 'recurring_transactions',
    'notifications', 'ai_insights', 'user_sessions', 'admin_audit_logs'
);

-- Show default data created
SELECT 'Default roles created:' as info, COUNT(*) as count FROM roles;
SELECT 'Default permissions created:' as info, COUNT(*) as count FROM permissions;
SELECT 'Role permissions assigned:' as info, COUNT(*) as count FROM role_permissions;