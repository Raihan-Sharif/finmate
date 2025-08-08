-- Migration: Budget Templates Enhancement and Paid Users
-- Date: 2025-01-08
-- Description: Add paid_user role, fix categories table, and create sample global budget templates
-- 
-- Run this migration ONLY if you already have the base schema deployed
-- This migration adds the missing features for budget templates and paid users

-- =============================================
-- 1. UPDATE USER ROLES
-- =============================================

-- Add paid_user to existing user_role enum
DO $$
BEGIN
    -- Check if paid_user already exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paid_user' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'paid_user' AFTER 'admin';
    END IF;
END$$;

-- Insert paid_user role record if it doesn't exist
INSERT INTO roles (id, name, display_name, description, is_system, is_active) VALUES 
(uuid_generate_v4(), 'paid_user', 'Paid User', 'Paid user with premium features including custom templates', true, true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 2. UPDATE CATEGORIES TABLE STRUCTURE  
-- =============================================

-- Ensure categories table has proper global structure
DO $$
BEGIN
    -- Add user_id column as nullable if it doesn't exist (for admin-created global categories)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'user_id') THEN
        ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add is_default column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_default') THEN
        ALTER TABLE categories ADD COLUMN is_default BOOLEAN DEFAULT false NOT NULL;
    END IF;
    
    -- Add parent_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'parent_id') THEN
        ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;
    END IF;
    
    -- Ensure proper constraint for global categories (name, type unique - no user_id)
    BEGIN
        ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_user_type_unique;
        ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_type_unique;
        ALTER TABLE categories ADD CONSTRAINT categories_name_type_unique UNIQUE (name, type);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END$$;

-- =============================================
-- 3. ENSURE BUDGET_TEMPLATES TABLE EXISTS
-- =============================================

-- Create budget_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS budget_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    CONSTRAINT budget_templates_alert_percentage_valid CHECK (alert_percentage > 0 AND alert_percentage <= 100)
);

-- Add unique constraint if not exists
DO $$
BEGIN
    BEGIN
        ALTER TABLE budget_templates ADD CONSTRAINT budget_templates_name_user_unique UNIQUE (user_id, name);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END$$;

-- =============================================
-- 4. CREATE DEFAULT CATEGORIES FOR TEMPLATES
-- =============================================

-- Function to create global default categories (NULL user_id means available to all users)
CREATE OR REPLACE FUNCTION create_global_default_categories()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert global default expense categories (user_id = NULL for global)
    INSERT INTO categories (user_id, name, description, icon, color, type, is_default, is_active, sort_order) VALUES
    (NULL, 'Food & Groceries', 'Daily meals and grocery shopping', '🍽️', '#10b981', 'expense', true, true, 1),
    (NULL, 'Transportation', 'Public transport, fuel, maintenance', '🚗', '#3b82f6', 'expense', true, true, 2),
    (NULL, 'Utilities', 'Electricity, water, internet, phone', '⚡', '#f59e0b', 'expense', true, true, 3),
    (NULL, 'Healthcare', 'Medical expenses, medicines, checkups', '🏥', '#ef4444', 'expense', true, true, 4),
    (NULL, 'Entertainment', 'Movies, games, hobbies, fun activities', '🎮', '#8b5cf6', 'expense', true, true, 5),
    (NULL, 'Education', 'Books, courses, training, learning materials', '📚', '#06b6d4', 'expense', true, true, 6),
    (NULL, 'Shopping', 'Clothing, accessories, personal items', '🛒', '#ec4899', 'expense', true, true, 7),
    (NULL, 'Housing', 'Rent, maintenance, home improvement', '🏠', '#84cc16', 'expense', true, true, 8),
    (NULL, 'Personal Care', 'Beauty, grooming, health products', '💅', '#f97316', 'expense', true, true, 9),
    (NULL, 'Insurance', 'Health, life, property insurance premiums', '🛡️', '#6366f1', 'expense', true, true, 10)
    ON CONFLICT (name, type) DO NOTHING;
    
    -- Insert global default income categories
    INSERT INTO categories (user_id, name, description, icon, color, type, is_default, is_active, sort_order) VALUES
    (NULL, 'Salary', 'Monthly salary and wages', '💰', '#10b981', 'income', true, true, 1),
    (NULL, 'Freelance', 'Freelance work and consulting', '💼', '#3b82f6', 'income', true, true, 2),
    (NULL, 'Investment', 'Returns from investments', '📈', '#f59e0b', 'income', true, true, 3),
    (NULL, 'Business', 'Business income and profits', '🏢', '#8b5cf6', 'income', true, true, 4),
    (NULL, 'Other Income', 'Gifts, bonuses, miscellaneous income', '🎁', '#06b6d4', 'income', true, true, 5),
    (NULL, 'Rental Income', 'Property rental income', '🏘️', '#84cc16', 'income', true, true, 6)
    ON CONFLICT (name, type) DO NOTHING;
END;
$$;

-- =============================================
-- 5. CREATE GLOBAL BUDGET TEMPLATES
-- =============================================

-- Function to create global budget templates
CREATE OR REPLACE FUNCTION create_global_budget_templates()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    admin_user_id UUID;
    food_cat_id UUID;
    transport_cat_id UUID;
    utilities_cat_id UUID;
    healthcare_cat_id UUID;
    entertainment_cat_id UUID;
    education_cat_id UUID;
    shopping_cat_id UUID;
    housing_cat_id UUID;
    personal_care_cat_id UUID;
    insurance_cat_id UUID;
BEGIN
    -- Get the first admin user for creating global templates
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RETURN; -- No users yet, skip template creation
    END IF;
    
    -- Ensure global categories exist
    PERFORM create_global_default_categories();
    
    -- Get global category IDs (user_id IS NULL for global categories)
    SELECT id INTO food_cat_id FROM categories WHERE user_id IS NULL AND name = 'Food & Groceries' AND type = 'expense' LIMIT 1;
    SELECT id INTO transport_cat_id FROM categories WHERE user_id IS NULL AND name = 'Transportation' AND type = 'expense' LIMIT 1;
    SELECT id INTO utilities_cat_id FROM categories WHERE user_id IS NULL AND name = 'Utilities' AND type = 'expense' LIMIT 1;
    SELECT id INTO healthcare_cat_id FROM categories WHERE user_id IS NULL AND name = 'Healthcare' AND type = 'expense' LIMIT 1;
    SELECT id INTO entertainment_cat_id FROM categories WHERE user_id IS NULL AND name = 'Entertainment' AND type = 'expense' LIMIT 1;
    SELECT id INTO education_cat_id FROM categories WHERE user_id IS NULL AND name = 'Education' AND type = 'expense' LIMIT 1;
    SELECT id INTO shopping_cat_id FROM categories WHERE user_id IS NULL AND name = 'Shopping' AND type = 'expense' LIMIT 1;
    SELECT id INTO housing_cat_id FROM categories WHERE user_id IS NULL AND name = 'Housing' AND type = 'expense' LIMIT 1;
    SELECT id INTO personal_care_cat_id FROM categories WHERE user_id IS NULL AND name = 'Personal Care' AND type = 'expense' LIMIT 1;
    SELECT id INTO insurance_cat_id FROM categories WHERE user_id IS NULL AND name = 'Insurance' AND type = 'expense' LIMIT 1;
    
    -- Insert global budget templates
    INSERT INTO budget_templates (
        user_id, name, description, amount, currency, period, category_ids, 
        alert_percentage, alert_enabled, is_active, is_global, usage_count
    ) VALUES 
    -- Monthly Essential Living Budget
    (
        admin_user_id,
        'Monthly Essentials',
        'A comprehensive monthly budget covering basic living expenses including groceries, transportation, utilities, and personal care.',
        50000,
        'BDT',
        'monthly',
        ARRAY[food_cat_id, transport_cat_id, utilities_cat_id, healthcare_cat_id]::UUID[],
        85,
        true,
        true,
        true,
        0
    ),
    -- Student Budget Template
    (
        admin_user_id,
        'Student Budget',
        'Budget template designed for students covering education expenses, food, transportation, and basic entertainment.',
        25000,
        'BDT',
        'monthly',
        ARRAY[food_cat_id, transport_cat_id, education_cat_id, entertainment_cat_id]::UUID[],
        80,
        true,
        true,
        true,
        0
    ),
    -- Family Budget Template
    (
        admin_user_id,
        'Family Budget',
        'Comprehensive family budget including household expenses, children needs, healthcare, education, and family activities.',
        100000,
        'BDT',
        'monthly',
        ARRAY[food_cat_id, transport_cat_id, utilities_cat_id, healthcare_cat_id, education_cat_id, entertainment_cat_id, housing_cat_id, shopping_cat_id, personal_care_cat_id, insurance_cat_id]::UUID[],
        90,
        true,
        true,
        true,
        0
    ),
    -- Professional Budget Template
    (
        admin_user_id,
        'Professional Budget',
        'Budget for working professionals including work-related expenses, dining, entertainment, savings, and investments.',
        75000,
        'BDT',
        'monthly',
        ARRAY[food_cat_id, transport_cat_id, utilities_cat_id, healthcare_cat_id, entertainment_cat_id, shopping_cat_id]::UUID[],
        85,
        true,
        true,
        true,
        0
    ),
    -- Emergency Fund Builder
    (
        admin_user_id,
        'Emergency Fund Builder',
        'Focused budget template to build emergency fund while maintaining essential expenses.',
        40000,
        'BDT',
        'monthly',
        ARRAY[food_cat_id, transport_cat_id, utilities_cat_id]::UUID[],
        75,
        true,
        true,
        true,
        0
    ),
    -- Debt Payoff Budget
    (
        admin_user_id,
        'Debt Payoff Budget',
        'Strategic budget template focused on aggressive debt repayment while maintaining minimal living expenses.',
        35000,
        'BDT',
        'monthly',
        ARRAY[food_cat_id, transport_cat_id, utilities_cat_id]::UUID[],
        70,
        true,
        true,
        true,
        0
    )
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$;

-- =============================================
-- 6. CREATE INDEXES AND CONSTRAINTS
-- =============================================

-- Budget templates indexes
CREATE INDEX IF NOT EXISTS idx_budget_templates_user_id ON budget_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_templates_active ON budget_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_budget_templates_global ON budget_templates(is_global);
CREATE INDEX IF NOT EXISTS idx_budget_templates_usage_count ON budget_templates(usage_count);
CREATE INDEX IF NOT EXISTS idx_budget_templates_created_at ON budget_templates(created_at);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_is_default ON categories(is_default);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- =============================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on budget_templates if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'budget_templates' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;
    END IF;
END$$;

-- Create RLS policies for budget templates
DROP POLICY IF EXISTS "Users can manage own templates" ON budget_templates;
DROP POLICY IF EXISTS "Users can read global templates" ON budget_templates;
DROP POLICY IF EXISTS "Admins can manage global templates" ON budget_templates;

CREATE POLICY "Users can manage own templates" ON budget_templates 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read global templates" ON budget_templates 
FOR SELECT USING (is_global = true);

CREATE POLICY "Admins can manage global templates" ON budget_templates 
FOR ALL USING (
    is_global = true AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role_id IN (
            SELECT id FROM roles WHERE name IN ('admin', 'super_admin')
        )
    )
);

-- =============================================
-- 8. CREATE UTILITY FUNCTIONS
-- =============================================

-- Function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE budget_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$;

-- =============================================
-- 9. EXECUTE INITIAL SETUP
-- =============================================

-- Create global budget templates
SELECT create_global_budget_templates();

-- =============================================
-- 10. UPDATE TRIGGERS
-- =============================================

-- Ensure updated_at trigger exists for budget_templates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_templates_updated_at') THEN
        CREATE TRIGGER update_budget_templates_updated_at 
        BEFORE UPDATE ON budget_templates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

-- =============================================
-- CLEANUP
-- =============================================

-- Drop temporary functions
DROP FUNCTION IF EXISTS create_global_default_categories();
DROP FUNCTION IF EXISTS create_global_budget_templates();

-- Add helpful comments
COMMENT ON TABLE budget_templates IS 'Budget templates for recurring budget creation. Supports both user templates and global templates for all users.';
COMMENT ON COLUMN budget_templates.is_global IS 'When true, template is available to all users. Only admins can create global templates.';
COMMENT ON COLUMN budget_templates.usage_count IS 'Track how many times this template has been used to create budgets.';

-- Migration completed
SELECT 'Migration completed successfully: Budget templates and paid users feature added' as result;