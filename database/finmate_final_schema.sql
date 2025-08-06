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
DROP TABLE IF EXISTS recurring_transactions CASCADE;
DROP TABLE IF EXISTS emi_payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS lending CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
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
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE account_type AS ENUM ('bank', 'credit_card', 'wallet', 'investment', 'savings', 'other');
CREATE TYPE investment_type AS ENUM ('stock', 'mutual_fund', 'crypto', 'bond', 'fd', 'other');
CREATE TYPE loan_type AS ENUM ('personal', 'home', 'car', 'education', 'business', 'other');
CREATE TYPE loan_status AS ENUM ('active', 'closed', 'defaulted');
CREATE TYPE lending_type AS ENUM ('lent', 'borrowed');
CREATE TYPE lending_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE theme_type AS ENUM ('light', 'dark', 'system');
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user');
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

-- Categories Table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'folder' NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280' NOT NULL,
    type transaction_type NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT categories_name_user_type_unique UNIQUE (user_id, name, type)
);

-- Accounts Table
CREATE TABLE accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type account_type DEFAULT 'bank' NOT NULL,
    bank_name VARCHAR(100),
    account_number TEXT,
    balance DECIMAL(15,2) DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    include_in_total BOOLEAN DEFAULT true NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6' NOT NULL,
    icon VARCHAR(50) DEFAULT 'credit-card' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    transfer_to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    tags TEXT[],
    receipt_url TEXT,
    location TEXT,
    vendor TEXT,
    is_recurring BOOLEAN DEFAULT false NOT NULL,
    recurring_pattern JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT transactions_transfer_accounts_different CHECK (
        account_id IS NULL OR transfer_to_account_id IS NULL OR account_id != transfer_to_account_id
    )
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT budgets_amount_positive CHECK (amount > 0),
    CONSTRAINT budgets_spent_non_negative CHECK (spent >= 0),
    CONSTRAINT budgets_dates_valid CHECK (end_date > start_date),
    CONSTRAINT budgets_alert_threshold_valid CHECK (alert_threshold > 0 AND alert_threshold <= 100)
);

-- =============================================
-- ADVANCED FINANCIAL TABLES
-- =============================================

-- Investments Table
CREATE TABLE investments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type investment_type DEFAULT 'stock' NOT NULL,
    symbol VARCHAR(20),
    units DECIMAL(15,4) NOT NULL,
    purchase_price DECIMAL(15,2) NOT NULL,
    current_price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    purchase_date DATE NOT NULL,
    platform VARCHAR(100),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT investments_units_positive CHECK (units > 0),
    CONSTRAINT investments_purchase_price_positive CHECK (purchase_price > 0),
    CONSTRAINT investments_current_price_positive CHECK (current_price > 0)
);

-- Loans Table
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
    next_due_date DATE NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    type loan_type DEFAULT 'personal' NOT NULL,
    status loan_status DEFAULT 'active' NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT loans_principal_positive CHECK (principal_amount > 0),
    CONSTRAINT loans_outstanding_non_negative CHECK (outstanding_amount >= 0),
    CONSTRAINT loans_interest_rate_valid CHECK (interest_rate >= 0 AND interest_rate <= 100),
    CONSTRAINT loans_emi_positive CHECK (emi_amount > 0),
    CONSTRAINT loans_tenure_positive CHECK (tenure_months > 0)
);

-- Lending Table
CREATE TABLE lending (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    person_name VARCHAR(100) NOT NULL,
    person_contact VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    type lending_type NOT NULL,
    date DATE NOT NULL,
    due_date DATE,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    status lending_status DEFAULT 'pending' NOT NULL,
    description TEXT,
    paid_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT lending_amount_positive CHECK (amount > 0),
    CONSTRAINT lending_paid_amount_non_negative CHECK (paid_amount >= 0),
    CONSTRAINT lending_paid_amount_not_exceeds CHECK (paid_amount <= amount),
    CONSTRAINT lending_interest_rate_valid CHECK (interest_rate >= 0 AND interest_rate <= 100)
);

-- EMI Payments Table
CREATE TABLE emi_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_amount DECIMAL(15,2) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    is_paid BOOLEAN DEFAULT false NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT emi_payments_amount_positive CHECK (amount > 0),
    CONSTRAINT emi_payments_principal_positive CHECK (principal_amount > 0),
    CONSTRAINT emi_payments_interest_non_negative CHECK (interest_amount >= 0),
    CONSTRAINT emi_payments_outstanding_non_negative CHECK (outstanding_balance >= 0)
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
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
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

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_period ON budgets(period);
CREATE INDEX idx_budgets_active ON budgets(is_active);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);

-- Advanced features indexes
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_type ON investments(type);
CREATE INDEX idx_investments_symbol ON investments(symbol);

CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_next_due_date ON loans(next_due_date);

CREATE INDEX idx_lending_user_id ON lending(user_id);
CREATE INDEX idx_lending_type ON lending(type);
CREATE INDEX idx_lending_status ON lending(status);
CREATE INDEX idx_lending_due_date ON lending(due_date);

CREATE INDEX idx_emi_payments_user_id ON emi_payments(user_id);
CREATE INDEX idx_emi_payments_loan_id ON emi_payments(loan_id);
CREATE INDEX idx_emi_payments_payment_date ON emi_payments(payment_date);
CREATE INDEX idx_emi_payments_is_paid ON emi_payments(is_paid);

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
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_payments ENABLE ROW LEVEL SECURITY;
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

-- User data policies (users manage their own data)
CREATE POLICY "Users can manage own categories" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own investments" ON investments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own loans" ON loans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own lending" ON lending FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own emi payments" ON emi_payments FOR ALL USING (auth.uid() = user_id);
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

-- Function to create default categories and account
CREATE OR REPLACE FUNCTION public.create_default_categories(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert default income categories
    INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (user_id_param, 'Salary', 'briefcase', '#10B981', 'income', true),
    (user_id_param, 'Freelance', 'laptop', '#3B82F6', 'income', true),
    (user_id_param, 'Investment Returns', 'trending-up', '#8B5CF6', 'income', true),
    (user_id_param, 'Gift', 'gift', '#F59E0B', 'income', true),
    (user_id_param, 'Other Income', 'plus-circle', '#6B7280', 'income', true);
    
    -- Insert default expense categories
    INSERT INTO public.categories (user_id, name, icon, color, type, is_default) VALUES
    (user_id_param, 'Food & Dining', 'utensils', '#EF4444', 'expense', true),
    (user_id_param, 'Transportation', 'car', '#3B82F6', 'expense', true),
    (user_id_param, 'Shopping', 'shopping-bag', '#F59E0B', 'expense', true),
    (user_id_param, 'Entertainment', 'film', '#8B5CF6', 'expense', true),
    (user_id_param, 'Bills & Utilities', 'zap', '#10B981', 'expense', true),
    (user_id_param, 'Healthcare', 'heart', '#EF4444', 'expense', true),
    (user_id_param, 'Education', 'book', '#3B82F6', 'expense', true),
    (user_id_param, 'Travel', 'map-pin', '#F59E0B', 'expense', true),
    (user_id_param, 'Personal Care', 'user', '#8B5CF6', 'expense', true),
    (user_id_param, 'Other Expenses', 'minus-circle', '#6B7280', 'expense', true);

    -- Create default account
    INSERT INTO public.accounts (user_id, name, type, balance, currency) VALUES
    (user_id_param, 'Main Account', 'bank', 0.00, 'USD');
    
    RAISE NOTICE 'Created default categories and account for user: %', user_id_param;
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
        'USD',
        'UTC', 
        'system',
        true,
        true,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    );

    -- Create default categories and account
    PERFORM public.create_default_categories(NEW.id);
    
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
        COALESCE((SELECT SUM(balance) FROM accounts WHERE user_id = p_user_id AND currency = p_currency AND include_in_total = true), 0),
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
        r.name as role_name,
        r.display_name as role_display_name
    FROM profiles p
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
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
    'categories', 'accounts', 'transactions', 'budgets', 'investments',
    'loans', 'lending', 'emi_payments', 'recurring_transactions',
    'notifications', 'ai_insights', 'user_sessions', 'admin_audit_logs'
);

-- Show default data created
SELECT 'Default roles created:' as info, COUNT(*) as count FROM roles;
SELECT 'Default permissions created:' as info, COUNT(*) as count FROM permissions;
SELECT 'Role permissions assigned:' as info, COUNT(*) as count FROM role_permissions;