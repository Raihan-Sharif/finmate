-- FinMate Database Schema
-- Run this script in your Supabase SQL editor to set up the complete database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('bank', 'credit_card', 'wallet', 'investment', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE investment_type AS ENUM ('stock', 'mutual_fund', 'crypto', 'bond', 'fd', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loan_type AS ENUM ('personal', 'home', 'car', 'education', 'business', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE loan_status AS ENUM ('active', 'closed', 'defaulted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lending_type AS ENUM ('lent', 'borrowed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lending_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE theme_type AS ENUM ('light', 'dark', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    theme theme_type DEFAULT 'system' NOT NULL,
    notifications_enabled BOOLEAN DEFAULT true NOT NULL,
    ai_insights_enabled BOOLEAN DEFAULT true NOT NULL,
    monthly_budget_limit DECIMAL(15,2),
    ai_api_key TEXT, -- User's personal AI API key (encrypted)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'folder' NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280' NOT NULL,
    type transaction_type NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false NOT NULL,
    budget_limit DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT categories_name_user_unique UNIQUE (user_id, name, type)
);

-- =============================================
-- ACCOUNTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type account_type DEFAULT 'bank' NOT NULL,
    bank_name VARCHAR(100),
    account_number VARCHAR(50), -- Encrypted in application
    balance DECIMAL(15,2) DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6' NOT NULL,
    icon VARCHAR(50) DEFAULT 'credit-card' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    tags TEXT[],
    receipt_url TEXT,
    location TEXT,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false NOT NULL,
    recurring_pattern JSONB, -- Store recurring pattern details
    metadata JSONB, -- Additional transaction metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT transactions_amount_positive CHECK (amount > 0)
);

-- =============================================
-- BUDGETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    spent DECIMAL(15,2) DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    period budget_period DEFAULT 'monthly' NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    category_ids UUID[],
    is_active BOOLEAN DEFAULT true NOT NULL,
    alert_threshold DECIMAL(5,2) DEFAULT 80.00, -- Alert when 80% of budget is used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT budgets_amount_positive CHECK (amount > 0),
    CONSTRAINT budgets_spent_non_negative CHECK (spent >= 0),
    CONSTRAINT budgets_dates_valid CHECK (end_date > start_date),
    CONSTRAINT budgets_alert_threshold_valid CHECK (alert_threshold > 0 AND alert_threshold <= 100)
);

-- =============================================
-- INVESTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS investments (
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
    metadata JSONB, -- Store additional investment data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT investments_units_positive CHECK (units > 0),
    CONSTRAINT investments_purchase_price_positive CHECK (purchase_price > 0),
    CONSTRAINT investments_current_price_positive CHECK (current_price > 0)
);

-- =============================================
-- LOANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS loans (
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

-- =============================================
-- LENDING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS lending (
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

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
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

-- =============================================
-- EMI PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS emi_payments (
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

-- =============================================
-- RECURRING TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_template JSONB NOT NULL, -- Template for creating transactions
    frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    interval_value INTEGER DEFAULT 1 NOT NULL, -- Every X days/weeks/months/years
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
-- AI INSIGHTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL, -- spending_analysis, budget_recommendation, etc.
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    is_dismissed BOOLEAN DEFAULT false NOT NULL,
    metadata JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);

-- Budgets indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);
CREATE INDEX IF NOT EXISTS idx_budgets_is_active ON budgets(is_active);
CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets(start_date, end_date);

-- Investments indexes
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(type);
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol);

-- Loans indexes
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_next_due_date ON loans(next_due_date);

-- Lending indexes
CREATE INDEX IF NOT EXISTS idx_lending_user_id ON lending(user_id);
CREATE INDEX IF NOT EXISTS idx_lending_type ON lending(type);
CREATE INDEX IF NOT EXISTS idx_lending_status ON lending(status);
CREATE INDEX IF NOT EXISTS idx_lending_due_date ON lending(due_date);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- EMI payments indexes  
CREATE INDEX IF NOT EXISTS idx_emi_payments_user_id ON emi_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_emi_payments_loan_id ON emi_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_emi_payments_payment_date ON emi_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_emi_payments_is_paid ON emi_payments(is_paid);

-- Recurring transactions indexes
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_execution ON recurring_transactions(next_execution);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_is_active ON recurring_transactions(is_active);

-- AI insights indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_is_dismissed ON ai_insights(is_dismissed);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires_at ON ai_insights(expires_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Categories policies
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Accounts policies
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- Investments policies
DROP POLICY IF EXISTS "Users can view own investments" ON investments;
CREATE POLICY "Users can view own investments" ON investments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own investments" ON investments;
CREATE POLICY "Users can insert own investments" ON investments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own investments" ON investments;
CREATE POLICY "Users can update own investments" ON investments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own investments" ON investments;
CREATE POLICY "Users can delete own investments" ON investments FOR DELETE USING (auth.uid() = user_id);

-- Loans policies  
DROP POLICY IF EXISTS "Users can view own loans" ON loans;
CREATE POLICY "Users can view own loans" ON loans FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own loans" ON loans;
CREATE POLICY "Users can insert own loans" ON loans FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own loans" ON loans;
CREATE POLICY "Users can update own loans" ON loans FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own loans" ON loans;
CREATE POLICY "Users can delete own loans" ON loans FOR DELETE USING (auth.uid() = user_id);

-- Lending policies
DROP POLICY IF EXISTS "Users can view own lending" ON lending;
CREATE POLICY "Users can view own lending" ON lending FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own lending" ON lending;
CREATE POLICY "Users can insert own lending" ON lending FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own lending" ON lending;
CREATE POLICY "Users can update own lending" ON lending FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own lending" ON lending;
CREATE POLICY "Users can delete own lending" ON lending FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- EMI payments policies
DROP POLICY IF EXISTS "Users can view own emi payments" ON emi_payments;
CREATE POLICY "Users can view own emi payments" ON emi_payments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own emi payments" ON emi_payments;
CREATE POLICY "Users can insert own emi payments" ON emi_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own emi payments" ON emi_payments;
CREATE POLICY "Users can update own emi payments" ON emi_payments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own emi payments" ON emi_payments;
CREATE POLICY "Users can delete own emi payments" ON emi_payments FOR DELETE USING (auth.uid() = user_id);

-- Recurring transactions policies
DROP POLICY IF EXISTS "Users can view own recurring transactions" ON recurring_transactions;
CREATE POLICY "Users can view own recurring transactions" ON recurring_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own recurring transactions" ON recurring_transactions;
CREATE POLICY "Users can insert own recurring transactions" ON recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own recurring transactions" ON recurring_transactions;
CREATE POLICY "Users can update own recurring transactions" ON recurring_transactions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own recurring transactions" ON recurring_transactions;
CREATE POLICY "Users can delete own recurring transactions" ON recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- AI insights policies
DROP POLICY IF EXISTS "Users can view own ai insights" ON ai_insights;
CREATE POLICY "Users can view own ai insights" ON ai_insights FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own ai insights" ON ai_insights;
CREATE POLICY "Users can insert own ai insights" ON ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own ai insights" ON ai_insights;
CREATE POLICY "Users can update own ai insights" ON ai_insights FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own ai insights" ON ai_insights;
CREATE POLICY "Users can delete own ai insights" ON ai_insights FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investments_updated_at ON investments;
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loans_updated_at ON loans;
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lending_updated_at ON lending;
CREATE TRIGGER update_lending_updated_at BEFORE UPDATE ON lending FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emi_payments_updated_at ON emi_payments;
CREATE TRIGGER update_emi_payments_updated_at BEFORE UPDATE ON emi_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_transactions_updated_at ON recurring_transactions;
CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update account balance when transaction is added/updated/deleted
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + CASE 
                WHEN NEW.type = 'income' THEN NEW.amount 
                ELSE -NEW.amount 
            END
            WHERE id = NEW.account_id;
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
                ELSE -OLD.amount 
            END
            WHERE id = OLD.account_id;
        END IF;
        
        -- Apply new transaction effect
        IF NEW.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + CASE 
                WHEN NEW.type = 'income' THEN NEW.amount 
                ELSE -NEW.amount 
            END
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - CASE 
                WHEN OLD.type = 'income' THEN OLD.amount 
                ELSE -OLD.amount 
            END
            WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for account balance updates
DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

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
            SELECT id FROM budgets 
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
                AND (budgets.category_ids IS NULL OR t.category_id = ANY(budgets.category_ids))
            )
            WHERE id = budget_record.id;
        END LOOP;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' AND OLD.type = 'expense' THEN
        -- Find all budgets that included this transaction's category
        FOR budget_record IN 
            SELECT id FROM budgets 
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
                AND (budgets.category_ids IS NULL OR t.category_id = ANY(budgets.category_ids))
            )
            WHERE id = budget_record.id;
        END LOOP;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger for budget spent updates
DROP TRIGGER IF EXISTS trigger_update_budget_spent ON transactions;
CREATE TRIGGER trigger_update_budget_spent
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_budget_spent();

-- =============================================
-- DEFAULT CATEGORIES
-- =============================================

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Default Income Categories
    INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
    (p_user_id, 'Salary', 'briefcase', '#10B981', 'income', true),
    (p_user_id, 'Freelance', 'laptop', '#3B82F6', 'income', true),
    (p_user_id, 'Investment Returns', 'trending-up', '#8B5CF6', 'income', true),
    (p_user_id, 'Gift', 'gift', '#F59E0B', 'income', true),
    (p_user_id, 'Other Income', 'plus-circle', '#6B7280', 'income', true);
    
    -- Default Expense Categories
    INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
    (p_user_id, 'Food & Dining', 'utensils', '#EF4444', 'expense', true),
    (p_user_id, 'Transportation', 'car', '#3B82F6', 'expense', true),
    (p_user_id, 'Shopping', 'shopping-bag', '#F59E0B', 'expense', true),
    (p_user_id, 'Entertainment', 'film', '#8B5CF6', 'expense', true),
    (p_user_id, 'Bills & Utilities', 'zap', '#10B981', 'expense', true),
    (p_user_id, 'Healthcare', 'heart', '#EF4444', 'expense', true),
    (p_user_id, 'Education', 'book', '#3B82F6', 'expense', true),
    (p_user_id, 'Travel', 'map-pin', '#F59E0B', 'expense', true),
    (p_user_id, 'Personal Care', 'user', '#8B5CF6', 'expense', true),
    (p_user_id, 'Other Expenses', 'minus-circle', '#6B7280', 'expense', true);
END;
$$ language 'plpgsql';

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile with all required fields
    INSERT INTO profiles (
        user_id, 
        full_name, 
        avatar_url, 
        currency, 
        timezone, 
        theme, 
        notifications_enabled, 
        ai_insights_enabled
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        'USD',
        'UTC',
        'system',
        true,
        true
    );
    
    -- Create default categories
    PERFORM create_default_categories(NEW.id);
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

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
        COALESCE((SELECT SUM(balance) FROM accounts WHERE user_id = p_user_id AND currency = p_currency), 0),
        md.income,
        md.expenses,
        md.income - md.expenses,
        COALESCE((SELECT SUM(units * current_price) FROM investments WHERE user_id = p_user_id AND currency = p_currency), 0),
        COALESCE((SELECT SUM(outstanding_amount) FROM loans WHERE user_id = p_user_id AND currency = p_currency AND status = 'active'), 0)
    FROM monthly_data md;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to cleanup expired AI insights
CREATE OR REPLACE FUNCTION cleanup_expired_ai_insights()
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
$$ language 'plpgsql';

-- =============================================
-- SAMPLE DATA (Optional - for development/testing)
-- =============================================

-- You can uncomment this section to insert sample data for testing
/*
-- Sample user (replace with actual user ID from auth.users)
-- INSERT INTO profiles (user_id, full_name, currency) VALUES 
-- ('your-user-id-here', 'John Doe', 'USD');

-- Sample categories will be created automatically via trigger

-- Sample accounts
-- INSERT INTO accounts (user_id, name, type, balance) VALUES 
-- ('your-user-id-here', 'Checking Account', 'bank', 5000.00),
-- ('your-user-id-here', 'Credit Card', 'credit_card', -1200.00);

-- Sample transactions
-- INSERT INTO transactions (user_id, type, amount, description, date) VALUES 
-- ('your-user-id-here', 'income', 4000.00, 'Monthly Salary', CURRENT_DATE),
-- ('your-user-id-here', 'expense', 50.00, 'Grocery Shopping', CURRENT_DATE - INTERVAL '1 day');
*/

-- End of schema