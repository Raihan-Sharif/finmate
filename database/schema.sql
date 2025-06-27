-- FinMate Database Schema for Supabase
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE currency_type AS ENUM ('USD', 'BDT', 'INR', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE investment_type AS ENUM ('stock', 'mutual_fund', 'crypto', 'fd', 'bond', 'real_estate', 'other');
CREATE TYPE loan_status AS ENUM ('active', 'paid', 'overdue', 'closed');
CREATE TYPE lending_status AS ENUM ('lent', 'borrowed', 'paid', 'overdue');

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
email TEXT UNIQUE NOT NULL,
full_name TEXT,
avatar_url TEXT,
currency currency_type DEFAULT 'USD',
timezone TEXT DEFAULT 'UTC',
locale TEXT DEFAULT 'en',
ai_api_key TEXT, -- Encrypted user API key
preferences JSONB DEFAULT '{}',
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
name TEXT NOT NULL,
description TEXT,
color TEXT DEFAULT '#3B82F6',
icon TEXT DEFAULT 'folder',
type transaction_type NOT NULL,
is_default BOOLEAN DEFAULT FALSE,
parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(user_id, name, type)
);

-- Transactions table (expenses and income)
CREATE TABLE transactions (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
currency currency_type DEFAULT 'USD',
description TEXT NOT NULL,
notes TEXT,
type transaction_type NOT NULL,
transaction_date DATE NOT NULL DEFAULT NOW(),
receipt_url TEXT,
tags TEXT[],
vendor TEXT,
is_recurring BOOLEAN DEFAULT FALSE,
recurring_config JSONB, -- {frequency, end_date, etc}
imported_from TEXT, -- bank, credit_card, manual
external_id TEXT, -- for bank imports
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investments table
CREATE TABLE investments (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
name TEXT NOT NULL,
type investment_type NOT NULL,
symbol TEXT, -- for stocks/crypto
initial_amount DECIMAL(15,2) NOT NULL CHECK (initial_amount > 0),
current_value DECIMAL(15,2),
currency currency_type DEFAULT 'USD',
purchase_date DATE NOT NULL,
quantity DECIMAL(15,8),
notes TEXT,
goal_amount DECIMAL(15,2),
goal_date DATE,
broker TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investment transactions table (buy/sell history)
CREATE TABLE investment_transactions (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'dividend')),
quantity DECIMAL(15,8) NOT NULL,
price_per_unit DECIMAL(15,2) NOT NULL,
total_amount DECIMAL(15,2) NOT NULL,
fees DECIMAL(15,2) DEFAULT 0,
transaction_date DATE NOT NULL,
notes TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lending and borrowing table
CREATE TABLE lendings (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
person_name TEXT NOT NULL,
person_contact TEXT,
amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
currency currency_type DEFAULT 'USD',
type TEXT NOT NULL CHECK (type IN ('lent', 'borrowed')),
status lending_status DEFAULT 'lent',
lending_date DATE NOT NULL DEFAULT NOW(),
due_date DATE,
paid_date DATE,
interest_rate DECIMAL(5,2) DEFAULT 0,
notes TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMI and loans table
CREATE TABLE loans (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
loan_name TEXT NOT NULL,
lender TEXT NOT NULL,
principal_amount DECIMAL(15,2) NOT NULL CHECK (principal_amount > 0),
interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0),
tenure_months INTEGER NOT NULL CHECK (tenure_months > 0),
emi_amount DECIMAL(15,2) NOT NULL CHECK (emi_amount > 0),
currency currency_type DEFAULT 'USD',
start_date DATE NOT NULL,
status loan_status DEFAULT 'active',
paid_amount DECIMAL(15,2) DEFAULT 0,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMI payments table
CREATE TABLE emi_payments (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
payment_date DATE NOT NULL,
amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
principal_component DECIMAL(15,2) NOT NULL,
interest_component DECIMAL(15,2) NOT NULL,
outstanding_balance DECIMAL(15,2) NOT NULL,
is_paid BOOLEAN DEFAULT FALSE,
paid_date DATE,
late_fee DECIMAL(15,2) DEFAULT 0,
notes TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
year INTEGER NOT NULL CHECK (year > 2000),
amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
currency currency_type DEFAULT 'USD',
alert_threshold DECIMAL(3,2) DEFAULT 0.80, -- 80%
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(user_id, category_id, month, year)
);

-- Reports table (for saved reports)
CREATE TABLE saved_reports (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
name TEXT NOT NULL,
description TEXT,
filters JSONB NOT NULL,
chart_config JSONB,
is_favorite BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
title TEXT NOT NULL,
message TEXT NOT NULL,
type TEXT NOT NULL CHECK (type IN ('budget_alert', 'emi_reminder', 'lending_reminder', 'goal_reminder')),
is_read BOOLEAN DEFAULT FALSE,
data JSONB,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank accounts table
CREATE TABLE bank_accounts (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
account_name TEXT NOT NULL,
bank_name TEXT NOT NULL,
account_number TEXT,
account_type TEXT CHECK (account_type IN ('savings', 'checking', 'credit_card')),
balance DECIMAL(15,2) DEFAULT 0,
currency currency_type DEFAULT 'USD',
is_active BOOLEAN DEFAULT TRUE,
last_sync_date TIMESTAMP WITH TIME ZONE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import history table
CREATE TABLE import_history (
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
filename TEXT NOT NULL,
file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'pdf', 'excel')),
source TEXT NOT NULL CHECK (source IN ('bank', 'credit_card', 'manual')),
records_imported INTEGER DEFAULT 0,
records_failed INTEGER DEFAULT 0,
status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
error_details JSONB,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_lendings_user_status ON lendings(user_id, status);
CREATE INDEX idx_loans_user_status ON loans(user_id, status);
CREATE INDEX idx_emi_payments_loan ON emi_payments(loan_id);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, year, month);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lendings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Investments
CREATE POLICY "Users can view own investments" ON investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investments" ON investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investments" ON investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investments" ON investments FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables...
-- (Continuing with same pattern for all user-owned tables)

-- Functions for automated tasks
-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
-- Default expense categories
INSERT INTO categories (user_id, name, type, color, icon, is_default) VALUES
(user_uuid, 'Food & Dining', 'expense', '#EF4444', 'utensils', true),
(user_uuid, 'Transportation', 'expense', '#3B82F6', 'car', true),
(user_uuid, 'Shopping', 'expense', '#8B5CF6', 'shopping-bag', true),
(user_uuid, 'Entertainment', 'expense', '#F59E0B', 'film', true),
(user_uuid, 'Bills & Utilities', 'expense', '#10B981', 'receipt', true),
(user_uuid, 'Healthcare', 'expense', '#EC4899', 'heart', true),
(user_uuid, 'Education', 'expense', '#6366F1', 'book', true),
(user_uuid, 'Travel', 'expense', '#14B8A6', 'plane', true),
(user_uuid, 'Other', 'expense', '#6B7280', 'more-horizontal', true);

    -- Default income categories
    INSERT INTO categories (user_id, name, type, color, icon, is_default) VALUES
    (user_uuid, 'Salary', 'income', '#10B981', 'briefcase', true),
    (user_uuid, 'Freelance', 'income', '#3B82F6', 'laptop', true),
    (user_uuid, 'Investment Returns', 'income', '#8B5CF6', 'trending-up', true),
    (user_uuid, 'Business', 'income', '#F59E0B', 'building', true),
    (user_uuid, 'Gift', 'income', '#EC4899', 'gift', true),
    (user_uuid, 'Other Income', 'income', '#6B7280', 'plus-circle', true);

END;

$$
LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS
$$

BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add similar triggers for other tables...

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS
$$

BEGIN
INSERT INTO public.profiles (id, email, full_name, avatar_url)
VALUES (
NEW.id,
NEW.email,
NEW.raw_user_meta_data->>'full_name',
NEW.raw_user_meta_data->>'avatar_url'
);

    -- Create default categories
    PERFORM create_default_categories(NEW.id);

    RETURN NEW;

END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate investment returns
CREATE OR REPLACE FUNCTION calculate_investment_return(
    initial_amount DECIMAL,
    current_value DECIMAL
)
RETURNS DECIMAL AS
$$

BEGIN
IF initial_amount = 0 THEN
RETURN 0;
END IF;
RETURN ROUND(((current_value - initial_amount) / initial_amount \* 100), 2);
END;

$$
LANGUAGE plpgsql;

-- Function to generate EMI schedule
CREATE OR REPLACE FUNCTION generate_emi_schedule(
    loan_uuid UUID,
    principal DECIMAL,
    rate DECIMAL,
    tenure INTEGER,
    emi DECIMAL,
    start_date DATE
)
RETURNS VOID AS
$$

DECLARE
month_counter INTEGER := 0;
outstanding_principal DECIMAL := principal;
monthly_rate DECIMAL := rate / 1200; -- Convert annual rate to monthly decimal
schedule_date DATE := start_date; -- Renamed variable
interest_component DECIMAL;
principal_component DECIMAL;
BEGIN
WHILE month_counter < tenure AND outstanding_principal > 0 LOOP
month_counter := month_counter + 1;
schedule_date := start_date + INTERVAL '1 month' \* (month_counter - 1);

        interest_component := ROUND(outstanding_principal * monthly_rate, 2);
        principal_component := ROUND(emi - interest_component, 2);

        -- Adjust for last payment
        IF month_counter = tenure THEN
            principal_component := outstanding_principal;
        END IF;

        outstanding_principal := outstanding_principal - principal_component;

        INSERT INTO emi_payments (
            loan_id,
            payment_date,
            amount,
            principal_component,
            interest_component,
            outstanding_balance
        ) VALUES (
            loan_uuid,
            schedule_date, -- Updated variable name
            emi,
            principal_component,
            interest_component,
            outstanding_principal
        );
    END LOOP;

END;

$$
LANGUAGE plpgsql;
$$
