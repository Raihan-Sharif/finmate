-- FinMate Professional Database Schema
-- Complete enterprise-grade design with role-based access control
-- Run this ONCE in Supabase SQL Editor

-- =============================================
-- CLEANUP (Run first if tables exist)
-- =============================================
-- DROP TABLE IF EXISTS user_sessions CASCADE;
-- DROP TABLE IF EXISTS admin_audit_logs CASCADE;
-- DROP TABLE IF EXISTS user_permissions CASCADE;
-- DROP TABLE IF EXISTS role_permissions CASCADE;
-- DROP TABLE IF EXISTS permissions CASCADE;
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS budgets CASCADE;
-- DROP TABLE IF EXISTS accounts CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;
-- DROP TYPE IF EXISTS user_role CASCADE;
-- DROP TYPE IF EXISTS transaction_type CASCADE;
-- DROP TYPE IF EXISTS account_type CASCADE;
-- DROP TYPE IF EXISTS permission_action CASCADE;
-- DROP TYPE IF EXISTS audit_action CASCADE;

-- =============================================
-- ENABLE EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'user');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE account_type AS ENUM ('bank', 'credit_card', 'wallet', 'investment', 'savings', 'other');
CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'manage');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'role_change', 'permission_change');

-- =============================================
-- ROLES TABLE
-- =============================================
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

-- =============================================
-- PERMISSIONS TABLE
-- =============================================
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

-- =============================================
-- ROLE PERMISSIONS (Many-to-Many)
-- =============================================
CREATE TABLE role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT role_permissions_unique UNIQUE (role_id, permission_id)
);

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE profiles (
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

-- =============================================
-- USER PERMISSIONS (Individual overrides)
-- =============================================
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
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE categories (
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

-- =============================================
-- ACCOUNTS TABLE
-- =============================================
CREATE TABLE accounts (
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

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================
CREATE TABLE transactions (
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

-- =============================================
-- BUDGETS TABLE
-- =============================================
CREATE TABLE budgets (
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
-- USER SESSIONS TABLE
-- =============================================
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

-- =============================================
-- ADMIN AUDIT LOGS TABLE
-- =============================================
CREATE TABLE admin_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
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
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_active ON profiles(is_active);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_active ON categories(is_active);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_active ON accounts(is_active);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_type ON transactions(type);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_period ON budgets(period);
CREATE INDEX idx_budgets_active ON budgets(is_active);

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
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Roles: Only admins can view/manage
CREATE POLICY "Admins can manage roles" ON roles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = auth.uid() AND r.name IN ('super_admin', 'admin')
    )
);

-- Permissions: Only admins can view/manage
CREATE POLICY "Admins can manage permissions" ON permissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = auth.uid() AND r.name IN ('super_admin', 'admin')
    )
);

-- Role Permissions: Only admins can manage
CREATE POLICY "Admins can manage role permissions" ON role_permissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = auth.uid() AND r.name IN ('super_admin', 'admin')
    )
);

-- Profiles: Users can view own, admins can view all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = auth.uid() AND r.name IN ('super_admin', 'admin', 'manager')
    )
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = auth.uid() AND r.name IN ('super_admin', 'admin')
    )
);

-- User Permissions: Only admins can manage
CREATE POLICY "Admins can manage user permissions" ON user_permissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = auth.uid() AND r.name IN ('super_admin', 'admin')
    )
);

-- Categories: Users manage own
CREATE POLICY "Users can manage own categories" ON categories FOR ALL USING (auth.uid() = user_id);

-- Accounts: Users manage own
CREATE POLICY "Users can manage own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);

-- Transactions: Users manage own
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

-- Budgets: Users manage own
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);

-- User Sessions: Users can view own
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage sessions" ON user_sessions FOR ALL USING (true);

-- Audit Logs: Only admins can view
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = auth.uid() AND r.name IN ('super_admin', 'admin')
    )
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.name as permission_name,
        p.resource,
        p.action::TEXT
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN profiles pr ON rp.role_id = pr.role_id
    WHERE pr.user_id = p_user_id
    
    UNION
    
    SELECT DISTINCT
        p.name as permission_name,
        p.resource,
        p.action::TEXT
    FROM permissions p
    JOIN user_permissions up ON p.id = up.permission_id
    WHERE up.user_id = p_user_id 
    AND up.granted = true
    AND (up.expires_at IS NULL OR up.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_resource TEXT, p_action TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM get_user_permissions(p_user_id)
        WHERE resource = p_resource 
        AND action = p_action
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    default_role_id UUID;
    admin_role_id UUID;
BEGIN
    -- Count existing users
    SELECT COUNT(*) FROM auth.users INTO user_count;
    
    -- Get role IDs
    SELECT id FROM roles WHERE name = 'user' INTO default_role_id;
    SELECT id FROM roles WHERE name = 'super_admin' INTO admin_role_id;
    
    -- Insert profile
    INSERT INTO profiles (
        user_id, 
        email, 
        full_name, 
        avatar_url, 
        role_id,
        email_verified
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name',
            NEW.email
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        CASE 
            WHEN user_count <= 1 THEN admin_role_id 
            ELSE default_role_id 
        END,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    );
    
    -- Create default categories for new user
    PERFORM create_default_categories(NEW.id);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default categories
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Default Income Categories
    INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
    (p_user_id, 'Salary', 'briefcase', '#10B981', 'income', true),
    (p_user_id, 'Freelance', 'laptop', '#3B82F6', 'income', true),
    (p_user_id, 'Investment Returns', 'trending-up', '#8B5CF6', 'income', true),
    (p_user_id, 'Other Income', 'plus-circle', '#6B7280', 'income', true);
    
    -- Default Expense Categories  
    INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
    (p_user_id, 'Food & Dining', 'utensils', '#EF4444', 'expense', true),
    (p_user_id, 'Transportation', 'car', '#3B82F6', 'expense', true),
    (p_user_id, 'Shopping', 'shopping-bag', '#F59E0B', 'expense', true),
    (p_user_id, 'Bills & Utilities', 'zap', '#10B981', 'expense', true),
    (p_user_id, 'Healthcare', 'heart', '#EC4899', 'expense', true),
    (p_user_id, 'Entertainment', 'film', '#8B5CF6', 'expense', true),
    (p_user_id, 'Education', 'book-open', '#06B6D4', 'expense', true),
    (p_user_id, 'Other Expenses', 'minus-circle', '#6B7280', 'expense', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update account balance after transaction
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update account balance for new transaction
        IF NEW.type = 'income' AND NEW.account_id IS NOT NULL THEN
            UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' AND NEW.account_id IS NOT NULL THEN
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            -- Transfer from account_id to transfer_to_account_id
            IF NEW.account_id IS NOT NULL THEN
                UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            END IF;
            IF NEW.transfer_to_account_id IS NOT NULL THEN
                UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.transfer_to_account_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Revert old transaction effect
        IF OLD.type = 'income' AND OLD.account_id IS NOT NULL THEN
            UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' AND OLD.account_id IS NOT NULL THEN
            UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            IF OLD.account_id IS NOT NULL THEN
                UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            END IF;
            IF OLD.transfer_to_account_id IS NOT NULL THEN
                UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.transfer_to_account_id;
            END IF;
        END IF;
        
        -- Apply new transaction effect
        IF NEW.type = 'income' AND NEW.account_id IS NOT NULL THEN
            UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' AND NEW.account_id IS NOT NULL THEN
            UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            IF NEW.account_id IS NOT NULL THEN
                UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            END IF;
            IF NEW.transfer_to_account_id IS NOT NULL THEN
                UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.transfer_to_account_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Revert transaction effect
        IF OLD.type = 'income' AND OLD.account_id IS NOT NULL THEN
            UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' AND OLD.account_id IS NOT NULL THEN
            UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            IF OLD.account_id IS NOT NULL THEN
                UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            END IF;
            IF OLD.transfer_to_account_id IS NOT NULL THEN
                UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.transfer_to_account_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create trigger for account balance updates
DROP TRIGGER IF EXISTS on_transaction_change ON transactions;
CREATE TRIGGER on_transaction_change
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Create trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default roles
INSERT INTO roles (name, display_name, description, is_system) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', true),
('admin', 'Administrator', 'Administrative access to manage users and system', true),
('manager', 'Manager', 'Can view reports and manage team members', true),
('user', 'User', 'Standard user with basic access', true);

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

-- Financial data
('transactions.create', 'Create Transactions', 'Can create new transactions', 'transactions', 'create', true),
('transactions.read', 'View Transactions', 'Can view transaction data', 'transactions', 'read', true),
('transactions.update', 'Update Transactions', 'Can modify transactions', 'transactions', 'update', true),
('transactions.delete', 'Delete Transactions', 'Can delete transactions', 'transactions', 'delete', true),

('budgets.create', 'Create Budgets', 'Can create new budgets', 'budgets', 'create', true),
('budgets.read', 'View Budgets', 'Can view budget information', 'budgets', 'read', true),
('budgets.update', 'Update Budgets', 'Can modify budgets', 'budgets', 'update', true),
('budgets.delete', 'Delete Budgets', 'Can delete budgets', 'budgets', 'delete', true),

('accounts.create', 'Create Accounts', 'Can create new accounts', 'accounts', 'create', true),
('accounts.read', 'View Accounts', 'Can view account information', 'accounts', 'read', true),
('accounts.update', 'Update Accounts', 'Can modify accounts', 'accounts', 'update', true),
('accounts.delete', 'Delete Accounts', 'Can delete accounts', 'accounts', 'delete', true),

('categories.create', 'Create Categories', 'Can create new categories', 'categories', 'create', true),
('categories.read', 'View Categories', 'Can view categories', 'categories', 'read', true),
('categories.update', 'Update Categories', 'Can modify categories', 'categories', 'update', true),
('categories.delete', 'Delete Categories', 'Can delete categories', 'categories', 'delete', true),

-- System
('system.manage', 'System Management', 'Can manage system settings', 'system', 'manage', true),
('analytics.read', 'View Analytics', 'Can view analytics and reports', 'analytics', 'read', true),
('audit.read', 'View Audit Logs', 'Can view audit logs', 'audit', 'read', true);

-- Assign permissions to roles
DO $$
DECLARE
    super_admin_role_id UUID;
    admin_role_id UUID;
    manager_role_id UUID;
    user_role_id UUID;
    perm_id UUID;
BEGIN
    -- Get role IDs
    SELECT id FROM roles WHERE name = 'super_admin' INTO super_admin_role_id;
    SELECT id FROM roles WHERE name = 'admin' INTO admin_role_id;
    SELECT id FROM roles WHERE name = 'manager' INTO manager_role_id;
    SELECT id FROM roles WHERE name = 'user' INTO user_role_id;
    
    -- Super Admin gets all permissions
    FOR perm_id IN SELECT id FROM permissions LOOP
        INSERT INTO role_permissions (role_id, permission_id) 
        VALUES (super_admin_role_id, perm_id);
    END LOOP;
    
    -- Admin gets most permissions (except super admin stuff)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions 
    WHERE name NOT IN ('system.manage');
    
    -- Manager gets read access and basic management
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM permissions 
    WHERE name IN (
        'users.read', 'analytics.read', 'audit.read',
        'transactions.read', 'budgets.read', 'accounts.read', 'categories.read'
    );
    
    -- User gets basic permissions for their own data
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT user_role_id, id FROM permissions 
    WHERE name IN (
        'transactions.create', 'transactions.read', 'transactions.update', 'transactions.delete',
        'budgets.create', 'budgets.read', 'budgets.update', 'budgets.delete',
        'accounts.create', 'accounts.read', 'accounts.update', 'accounts.delete',
        'categories.create', 'categories.read', 'categories.update', 'categories.delete'
    );
END $$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- End of professional schema