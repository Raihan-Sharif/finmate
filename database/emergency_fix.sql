-- Emergency Fix for FinMate Database
-- This script addresses the critical issues: missing profiles table and infinite recursion

-- =============================================
-- STEP 1: DROP ALL EXISTING POLICIES FIRST
-- =============================================

-- Drop ALL existing policies to prevent conflicts
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies on all tables
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- =============================================
-- STEP 2: ENSURE TABLES EXIST
-- =============================================

-- Enable extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('bank', 'credit_card', 'wallet', 'investment', 'savings', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'manage');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'role_change', 'permission_change');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS permissions (
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

-- Create role_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT role_permissions_unique UNIQUE (role_id, permission_id)
);

-- Create profiles table if it doesn't exist (THIS IS THE CRITICAL ONE)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD' NOT NULL,
    time_format VARCHAR(10) DEFAULT '24h' NOT NULL,
    language VARCHAR(5) DEFAULT 'en' NOT NULL,
    theme VARCHAR(10) DEFAULT 'system' NOT NULL,
    email_verified BOOLEAN DEFAULT false NOT NULL,
    phone_number TEXT,
    phone_verified BOOLEAN DEFAULT false NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create other essential tables
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    
    CONSTRAINT categories_name_user_type_unique UNIQUE (user_id, name, type)
);

CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type account_type DEFAULT 'bank' NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    account_number TEXT,
    bank_name TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    include_in_total BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
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
    recurring_interval VARCHAR(20),
    recurring_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT transactions_transfer_accounts_different CHECK (
        account_id IS NULL OR transfer_to_account_id IS NULL OR account_id != transfer_to_account_id
    )
);

CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    spent DECIMAL(15,2) DEFAULT 0 NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly' NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    category_ids UUID[],
    alert_percentage INTEGER DEFAULT 80 NOT NULL,
    alert_enabled BOOLEAN DEFAULT true NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT budgets_amount_positive CHECK (amount > 0),
    CONSTRAINT budgets_spent_non_negative CHECK (spent >= 0),
    CONSTRAINT budgets_alert_percentage_valid CHECK (alert_percentage > 0 AND alert_percentage <= 100)
);

-- =============================================
-- STEP 3: INSERT DEFAULT DATA IF MISSING
-- =============================================

-- Insert default roles if they don't exist
INSERT INTO roles (name, display_name, description, is_system) 
SELECT * FROM (VALUES
    ('super_admin', 'Super Administrator', 'Full system access with all permissions', true),
    ('admin', 'Administrator', 'Administrative access to manage users and system', true),
    ('manager', 'Manager', 'Can view reports and manage team members', true),
    ('user', 'User', 'Standard user with basic access', true)
) AS v(name, display_name, description, is_system)
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE roles.name = v.name);

-- Insert default permissions if they don't exist
INSERT INTO permissions (name, display_name, description, resource, action, is_system)
SELECT * FROM (VALUES
    ('users.create', 'Create Users', 'Can create new user accounts', 'users', 'create'::permission_action, true),
    ('users.read', 'View Users', 'Can view user profiles and information', 'users', 'read'::permission_action, true),
    ('users.update', 'Update Users', 'Can modify user profiles and settings', 'users', 'update'::permission_action, true),
    ('users.delete', 'Delete Users', 'Can delete user accounts', 'users', 'delete'::permission_action, true),
    ('transactions.create', 'Create Transactions', 'Can create new transactions', 'transactions', 'create'::permission_action, true),
    ('transactions.read', 'View Transactions', 'Can view transaction data', 'transactions', 'read'::permission_action, true),
    ('transactions.update', 'Update Transactions', 'Can modify transactions', 'transactions', 'update'::permission_action, true),
    ('transactions.delete', 'Delete Transactions', 'Can delete transactions', 'transactions', 'delete'::permission_action, true)
) AS v(name, display_name, description, resource, action, is_system)
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permissions.name = v.name);

-- =============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 5: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- =============================================

-- Profiles: Simple policies without recursion
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_system" ON profiles FOR INSERT WITH CHECK (true);

-- Categories: Users manage their own
CREATE POLICY "categories_all_own" ON categories FOR ALL USING (auth.uid() = user_id);

-- Accounts: Users manage their own
CREATE POLICY "accounts_all_own" ON accounts FOR ALL USING (auth.uid() = user_id);

-- Transactions: Users manage their own
CREATE POLICY "transactions_all_own" ON transactions FOR ALL USING (auth.uid() = user_id);

-- Budgets: Users manage their own
CREATE POLICY "budgets_all_own" ON budgets FOR ALL USING (auth.uid() = user_id);

-- Roles and permissions: Only allow reading for now (no recursion)
CREATE POLICY "roles_select_all" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "permissions_select_all" ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_select_all" ON role_permissions FOR SELECT TO authenticated USING (true);

-- =============================================
-- STEP 6: CREATE TRIGGER FUNCTION FOR PROFILES
-- =============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create simple profile creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    default_role_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id FROM roles WHERE name = 'user' INTO default_role_id;
    SELECT id FROM roles WHERE name = 'super_admin' INTO admin_role_id;
    
    -- If roles don't exist, skip profile creation (shouldn't happen after this script)
    IF default_role_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Count existing users to determine if this should be admin
    SELECT COUNT(*) FROM auth.users INTO user_count;
    
    -- Insert profile
    INSERT INTO profiles (
        user_id, 
        email, 
        full_name, 
        role_id,
        email_verified
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        CASE 
            WHEN user_count <= 1 AND admin_role_id IS NOT NULL THEN admin_role_id 
            ELSE default_role_id 
        END,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail user creation if profile creation fails
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- STEP 7: CREATE PROFILES FOR EXISTING USERS
-- =============================================

-- Create profiles for any existing users that don't have them
DO $$
DECLARE
    user_record RECORD;
    default_role_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id FROM roles WHERE name = 'user' INTO default_role_id;
    SELECT id FROM roles WHERE name = 'super_admin' INTO admin_role_id;
    
    -- Create profiles for users without them
    FOR user_record IN 
        SELECT u.* FROM auth.users u 
        LEFT JOIN profiles p ON u.id = p.user_id 
        WHERE p.user_id IS NULL
    LOOP
        BEGIN
            INSERT INTO profiles (
                user_id, 
                email, 
                full_name, 
                role_id,
                email_verified
            )
            VALUES (
                user_record.id,
                user_record.email,
                COALESCE(
                    user_record.raw_user_meta_data->>'full_name', 
                    user_record.raw_user_meta_data->>'name',
                    split_part(user_record.email, '@', 1)
                ),
                COALESCE(admin_role_id, default_role_id),
                COALESCE(user_record.email_confirmed_at IS NOT NULL, false)
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- Skip this user if there's an error
                CONTINUE;
        END;
    END LOOP;
END $$;

-- =============================================
-- STEP 8: GRANT PERMISSIONS
-- =============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================
-- VERIFICATION
-- =============================================

SELECT 
    'Emergency fix completed successfully!' as message,
    (SELECT COUNT(*) FROM roles) as roles_count,
    (SELECT COUNT(*) FROM profiles) as profiles_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies_count;