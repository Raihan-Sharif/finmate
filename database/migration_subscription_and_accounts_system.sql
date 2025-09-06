-- Migration: Subscription-Based Account System
-- Description: Add subscription plans, account limits, and enhanced account management
-- Date: 2025-01-09

-- ==============================================
-- 1. Create Subscription Plan and Family Types First
-- ==============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_type') THEN
        CREATE TYPE subscription_plan_type AS ENUM ('free', 'pro', 'max');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_type') THEN
        CREATE TYPE subscription_status_type AS ENUM ('active', 'expired', 'cancelled', 'trial');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'family_role_type') THEN
        CREATE TYPE family_role_type AS ENUM ('primary', 'spouse', 'child', 'member');
    END IF;
END $$;

-- ==============================================
-- 2. Add Subscription Fields to Profiles Table
-- ==============================================

DO $$
BEGIN
    -- Add subscription fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
        ALTER TABLE profiles ADD COLUMN subscription_plan VARCHAR(20) DEFAULT 'free' NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE profiles ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'active' NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
        ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_started_at') THEN
        ALTER TABLE profiles ADD COLUMN subscription_started_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'max_accounts') THEN
        ALTER TABLE profiles ADD COLUMN max_accounts INTEGER DEFAULT 3 NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'family_group_id') THEN
        ALTER TABLE profiles ADD COLUMN family_group_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'family_role') THEN
        ALTER TABLE profiles ADD COLUMN family_role family_role_type DEFAULT 'primary';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'invited_by') THEN
        ALTER TABLE profiles ADD COLUMN invited_by UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'joined_family_at') THEN
        ALTER TABLE profiles ADD COLUMN joined_family_at TIMESTAMPTZ;
    END IF;

    -- Change default currency from USD to BDT
    ALTER TABLE profiles ALTER COLUMN currency SET DEFAULT 'BDT';
END $$;

-- ==============================================
-- 3. Enhance Account Table
-- ==============================================

DO $$
BEGIN
    -- Add account enhancement fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'is_default') THEN
        ALTER TABLE accounts ADD COLUMN is_default BOOLEAN DEFAULT false NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'display_order') THEN
        ALTER TABLE accounts ADD COLUMN display_order INTEGER DEFAULT 0 NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'icon') THEN
        ALTER TABLE accounts ADD COLUMN icon VARCHAR(50) DEFAULT 'wallet';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'color') THEN
        ALTER TABLE accounts ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';
    END IF;
END $$;

-- ==============================================
-- 4. Add Cash Account Type to Existing Enum
-- ==============================================

DO $$
BEGIN
    -- Add 'cash' to account_type enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cash' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'account_type')
    ) THEN
        ALTER TYPE account_type ADD VALUE 'cash';
    END IF;
END $$;

-- ==============================================
-- 5. Create Family Groups Table
-- ==============================================

-- Family Groups table for Max plan family sharing
CREATE TABLE IF NOT EXISTS family_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) DEFAULT 'My Family' NOT NULL,
    description TEXT,
    max_members INTEGER DEFAULT 4 NOT NULL,
    current_members INTEGER DEFAULT 1 NOT NULL,
    subscription_plan VARCHAR(20) DEFAULT 'max' NOT NULL,
    subscription_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Family invitations table
CREATE TABLE IF NOT EXISTS family_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role family_role_type DEFAULT 'member' NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, accepted, rejected, expired
    invitation_code VARCHAR(20) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMPTZ
);

-- Add RLS policies for family groups
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- Family groups policies
CREATE POLICY "Users can view their own family group" ON family_groups
    FOR SELECT USING (
        created_by = (SELECT user_id FROM profiles WHERE user_id = auth.uid())
        OR id = (SELECT family_group_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Primary users can manage their family group" ON family_groups
    FOR ALL USING (
        created_by = (SELECT user_id FROM profiles WHERE user_id = auth.uid())
    );

-- Family invitations policies
CREATE POLICY "Family members can view family invitations" ON family_invitations
    FOR SELECT USING (
        invited_by = (SELECT user_id FROM profiles WHERE user_id = auth.uid())
        OR family_group_id = (SELECT family_group_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Primary users can manage family invitations" ON family_invitations
    FOR ALL USING (
        invited_by = (SELECT user_id FROM profiles WHERE user_id = auth.uid())
    );

-- Add foreign key for family_group_id
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_family_group 
    FOREIGN KEY (family_group_id) REFERENCES family_groups(id) ON DELETE SET NULL;

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_invited_by 
    FOREIGN KEY (invited_by) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- ==============================================
-- 6. Create Account Limit Functions
-- ==============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_account_limit(TEXT);
DROP FUNCTION IF EXISTS get_allowed_account_types(TEXT);
DROP FUNCTION IF EXISTS is_family_primary(UUID);
DROP FUNCTION IF EXISTS get_family_account_count(UUID);

-- Function to get account limit based on subscription plan
CREATE OR REPLACE FUNCTION get_account_limit(plan_type TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE plan_type
        WHEN 'free' THEN 3
        WHEN 'pro' THEN 15
        WHEN 'max' THEN 50  -- Family shared limit
        ELSE 3
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to get allowed account types based on plan
CREATE OR REPLACE FUNCTION get_allowed_account_types(plan_type TEXT)
RETURNS TEXT[] AS $$
BEGIN
    RETURN CASE plan_type
        WHEN 'free' THEN ARRAY['cash', 'bank']
        WHEN 'pro' THEN ARRAY['cash', 'bank', 'credit_card', 'savings', 'investment']
        WHEN 'max' THEN ARRAY['cash', 'bank', 'credit_card', 'savings', 'investment', 'wallet', 'other']
        ELSE ARRAY['cash', 'bank']
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is family primary (for Max plan)
CREATE OR REPLACE FUNCTION is_family_primary(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role family_role_type;
BEGIN
    SELECT family_role INTO user_role
    FROM profiles 
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(user_role, 'primary') = 'primary';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get family account count (for Max plan)
CREATE OR REPLACE FUNCTION get_family_account_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    family_id UUID;
    account_count INTEGER;
BEGIN
    -- Get user's family group ID
    SELECT family_group_id INTO family_id
    FROM profiles 
    WHERE user_id = p_user_id;
    
    -- If not in a family, count only user's accounts
    IF family_id IS NULL THEN
        SELECT COUNT(*) INTO account_count
        FROM accounts 
        WHERE user_id = p_user_id AND is_active = true;
    ELSE
        -- Count all family members' accounts
        SELECT COUNT(*) INTO account_count
        FROM accounts a
        INNER JOIN profiles p ON a.user_id = p.user_id
        WHERE p.family_group_id = family_id AND a.is_active = true;
    END IF;
    
    RETURN COALESCE(account_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 6. Default Account Creation Function
-- ==============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_default_accounts(UUID);

-- Function to create default accounts for a new user
CREATE OR REPLACE FUNCTION create_default_accounts(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    user_currency VARCHAR(3);
    user_plan TEXT;
BEGIN
    -- Get user's currency and plan
    SELECT currency, subscription_plan INTO user_currency, user_plan
    FROM profiles WHERE user_id = p_user_id;
    
    -- Set default currency if null
    IF user_currency IS NULL THEN
        user_currency := 'BDT';
    END IF;
    
    -- Set default plan if null
    IF user_plan IS NULL THEN
        user_plan := 'free';
    END IF;

    -- Create Cash Wallet (default account)
    INSERT INTO accounts (user_id, name, description, type, currency, balance, is_default, display_order, icon, color, is_active)
    VALUES (p_user_id, 'Cash Wallet', 'Primary cash wallet for daily expenses', 'cash', user_currency, 0, true, 1, 'wallet', '#10B981', true);
    
    -- Create Primary Bank Account
    INSERT INTO accounts (user_id, name, description, type, currency, balance, is_default, display_order, icon, color, is_active)
    VALUES (p_user_id, 'Primary Bank', 'Main bank account', 'bank', user_currency, 0, false, 2, 'building-2', '#3B82F6', true);
    
    -- Create Savings Account for Pro and Premium users
    IF user_plan IN ('pro', 'premium') THEN
        INSERT INTO accounts (user_id, name, description, type, currency, balance, is_default, display_order, icon, color, is_active)
        VALUES (p_user_id, 'Savings Account', 'Long-term savings account', 'savings', user_currency, 0, false, 3, 'piggy-bank', '#8B5CF6', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 7. Account Balance Update Functions
-- ==============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_account_balance(UUID, DECIMAL, transaction_type);
DROP FUNCTION IF EXISTS reverse_account_balance(UUID, DECIMAL, transaction_type);
DROP FUNCTION IF EXISTS trigger_update_account_balance_on_insert();
DROP FUNCTION IF EXISTS trigger_update_account_balance_on_update();
DROP FUNCTION IF EXISTS trigger_update_account_balance_on_delete();

-- Function to update account balance when transaction is created/updated
CREATE OR REPLACE FUNCTION update_account_balance(
    p_account_id UUID,
    p_amount DECIMAL(15,2),
    p_transaction_type transaction_type
)
RETURNS VOID AS $$
BEGIN
    -- Update account balance based on transaction type
    IF p_transaction_type = 'income' THEN
        UPDATE accounts 
        SET balance = balance + p_amount,
            updated_at = NOW()
        WHERE id = p_account_id;
    ELSIF p_transaction_type = 'expense' THEN
        UPDATE accounts 
        SET balance = balance - p_amount,
            updated_at = NOW()
        WHERE id = p_account_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reverse account balance update (for transaction deletion)
CREATE OR REPLACE FUNCTION reverse_account_balance(
    p_account_id UUID,
    p_amount DECIMAL(15,2),
    p_transaction_type transaction_type
)
RETURNS VOID AS $$
BEGIN
    -- Reverse account balance based on transaction type
    IF p_transaction_type = 'income' THEN
        UPDATE accounts 
        SET balance = balance - p_amount,
            updated_at = NOW()
        WHERE id = p_account_id;
    ELSIF p_transaction_type = 'expense' THEN
        UPDATE accounts 
        SET balance = balance + p_amount,
            updated_at = NOW()
        WHERE id = p_account_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 8. Account Validation Functions
-- ==============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS can_create_account(UUID);
DROP FUNCTION IF EXISTS can_create_account_type(UUID, account_type);

-- Function to check if user can create more accounts (with family support)
CREATE OR REPLACE FUNCTION can_create_account(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    user_plan TEXT;
BEGIN
    -- Get user plan
    SELECT subscription_plan INTO user_plan
    FROM profiles 
    WHERE user_id = p_user_id;
    
    -- Get max allowed accounts
    max_allowed := get_account_limit(COALESCE(user_plan, 'free'));
    
    -- For Max plan (family), count family-wide accounts
    IF user_plan = 'max' THEN
        current_count := get_family_account_count(p_user_id);
    ELSE
        -- For Free/Pro plans, count only user's accounts
        SELECT COUNT(*) INTO current_count
        FROM accounts 
        WHERE user_id = p_user_id AND is_active = true;
    END IF;
    
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate account type for user plan
CREATE OR REPLACE FUNCTION can_create_account_type(p_user_id UUID, p_account_type account_type)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan TEXT;
    allowed_types TEXT[];
BEGIN
    -- Get user plan
    SELECT subscription_plan INTO user_plan
    FROM profiles 
    WHERE user_id = p_user_id;
    
    -- Get allowed account types
    allowed_types := get_allowed_account_types(COALESCE(user_plan, 'free'));
    
    RETURN p_account_type::TEXT = ANY(allowed_types);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 9. Trigger Functions for Transaction Balance Updates
-- ==============================================

-- Trigger function for transaction insert
CREATE OR REPLACE FUNCTION trigger_update_account_balance_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Update account balance when transaction is created
    IF NEW.account_id IS NOT NULL THEN
        PERFORM update_account_balance(NEW.account_id, NEW.amount, NEW.type);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for transaction update
CREATE OR REPLACE FUNCTION trigger_update_account_balance_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Reverse old balance if account or amount changed
    IF OLD.account_id IS NOT NULL AND (
        OLD.account_id != NEW.account_id OR 
        OLD.amount != NEW.amount OR 
        OLD.type != NEW.type
    ) THEN
        PERFORM reverse_account_balance(OLD.account_id, OLD.amount, OLD.type);
    END IF;
    
    -- Apply new balance
    IF NEW.account_id IS NOT NULL THEN
        PERFORM update_account_balance(NEW.account_id, NEW.amount, NEW.type);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for transaction delete
CREATE OR REPLACE FUNCTION trigger_update_account_balance_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Reverse account balance when transaction is deleted
    IF OLD.account_id IS NOT NULL THEN
        PERFORM reverse_account_balance(OLD.account_id, OLD.amount, OLD.type);
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 10. Create Triggers
-- ==============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_transaction_balance_insert ON transactions;
DROP TRIGGER IF EXISTS trigger_transaction_balance_update ON transactions;  
DROP TRIGGER IF EXISTS trigger_transaction_balance_delete ON transactions;

-- Create triggers for automatic balance updates
CREATE TRIGGER trigger_transaction_balance_insert
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_account_balance_on_insert();

CREATE TRIGGER trigger_transaction_balance_update
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_account_balance_on_update();

CREATE TRIGGER trigger_transaction_balance_delete
    AFTER DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_account_balance_on_delete();

-- ==============================================
-- 11. Update Existing Data
-- ==============================================

-- Update existing profiles with subscription data
UPDATE profiles 
SET 
    subscription_plan = 'free',
    subscription_status = 'active',
    subscription_started_at = created_at,
    max_accounts = 3,
    currency = COALESCE(currency, 'BDT')
WHERE subscription_plan IS NULL OR subscription_plan = '';

-- Set first account as default for existing users (if no default exists)
WITH first_accounts AS (
    SELECT DISTINCT ON (user_id) user_id, id
    FROM accounts 
    WHERE is_active = true
    ORDER BY user_id, created_at ASC
)
UPDATE accounts 
SET is_default = true 
FROM first_accounts 
WHERE accounts.id = first_accounts.id 
AND accounts.user_id NOT IN (
    SELECT user_id FROM accounts WHERE is_default = true
);

-- ==============================================
-- 12. Family Management Functions
-- ==============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_family_group(UUID, VARCHAR);
DROP FUNCTION IF EXISTS invite_family_member(UUID, TEXT, family_role_type);
DROP FUNCTION IF EXISTS accept_family_invitation(UUID, TEXT);
DROP FUNCTION IF EXISTS get_family_members(UUID);

-- Function to create a family group (for Max plan)
CREATE OR REPLACE FUNCTION create_family_group(
    p_user_id UUID,
    p_family_name VARCHAR(100) DEFAULT 'My Family'
)
RETURNS UUID AS $$
DECLARE
    family_id UUID;
BEGIN
    -- Create family group
    INSERT INTO family_groups (created_by, name, max_members, current_members)
    VALUES (p_user_id, p_family_name, 4, 1)
    RETURNING id INTO family_id;
    
    -- Update user's profile to be primary in this family
    UPDATE profiles 
    SET family_group_id = family_id,
        family_role = 'primary',
        joined_family_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite family member
CREATE OR REPLACE FUNCTION invite_family_member(
    p_inviter_id UUID,
    p_email TEXT,
    p_role family_role_type DEFAULT 'member'
)
RETURNS TEXT AS $$
DECLARE
    family_id UUID;
    invitation_code TEXT;
BEGIN
    -- Get inviter's family group
    SELECT family_group_id INTO family_id
    FROM profiles 
    WHERE user_id = p_inviter_id AND family_role = 'primary';
    
    IF family_id IS NULL THEN
        RAISE EXCEPTION 'User is not a family primary or not in a family group';
    END IF;
    
    -- Generate unique invitation code
    invitation_code := UPPER(substr(md5(random()::text), 1, 8));
    
    -- Create invitation
    INSERT INTO family_invitations (
        family_group_id, 
        invited_by, 
        email, 
        role, 
        invitation_code
    ) VALUES (
        family_id, 
        p_inviter_id, 
        p_email, 
        p_role, 
        invitation_code
    );
    
    RETURN invitation_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept family invitation
CREATE OR REPLACE FUNCTION accept_family_invitation(
    p_user_id UUID,
    p_invitation_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record family_invitations%ROWTYPE;
    user_email TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email
    FROM profiles 
    WHERE user_id = p_user_id;
    
    -- Get invitation
    SELECT * INTO invitation_record
    FROM family_invitations 
    WHERE invitation_code = p_invitation_code 
    AND email = user_email
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update user profile
    UPDATE profiles 
    SET family_group_id = invitation_record.family_group_id,
        family_role = invitation_record.role,
        invited_by = invitation_record.invited_by,
        joined_family_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Update invitation status
    UPDATE family_invitations 
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Update family group member count
    UPDATE family_groups 
    SET current_members = current_members + 1
    WHERE id = invitation_record.family_group_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get family members
CREATE OR REPLACE FUNCTION get_family_members(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    family_role family_role_type,
    joined_at TIMESTAMPTZ,
    account_count INTEGER
) AS $$
DECLARE
    family_id UUID;
BEGIN
    -- Get user's family group
    SELECT family_group_id INTO family_id
    FROM profiles 
    WHERE user_id = p_user_id;
    
    IF family_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        p.user_id,
        p.full_name,
        p.email,
        p.family_role,
        p.joined_family_at,
        COUNT(a.id)::INTEGER as account_count
    FROM profiles p
    LEFT JOIN accounts a ON p.user_id = a.user_id AND a.is_active = true
    WHERE p.family_group_id = family_id
    GROUP BY p.user_id, p.full_name, p.email, p.family_role, p.joined_family_at
    ORDER BY p.family_role, p.joined_family_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 13. Create Account Summary Function
-- ==============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_account_summary(UUID);

-- Function to get user's account summary
CREATE OR REPLACE FUNCTION get_user_account_summary(p_user_id UUID)
RETURNS TABLE (
    account_count INTEGER,
    total_balance DECIMAL(15,2),
    default_account_id UUID,
    default_currency VARCHAR(3),
    subscription_plan TEXT,
    max_accounts INTEGER,
    can_create_more BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(a.id)::INTEGER,
        SUM(CASE WHEN a.type != 'credit_card' THEN a.balance ELSE -a.balance END),
        (SELECT id FROM accounts WHERE user_id = p_user_id AND is_default = true LIMIT 1),
        p.currency,
        p.subscription_plan,
        p.max_accounts,
        can_create_account(p_user_id)
    FROM accounts a
    CROSS JOIN profiles p
    WHERE a.user_id = p_user_id 
    AND p.user_id = p_user_id
    AND a.is_active = true
    GROUP BY p.currency, p.subscription_plan, p.max_accounts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 13. Grant Permissions
-- ==============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_account_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_allowed_account_types(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_accounts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_account_type(UUID, account_type) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_account_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_family_primary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_family_account_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_family_group(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION invite_family_member(UUID, TEXT, family_role_type) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_family_invitation(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_family_members(UUID) TO authenticated;

-- Grant update permissions on accounts table
GRANT UPDATE ON accounts TO authenticated;

-- ==============================================
-- Migration Complete
-- ==============================================

-- Log migration completion
INSERT INTO admin_audit_logs (
    admin_user_id,
    action,
    resource_type,
    old_values,
    new_values
) VALUES (
    (SELECT user_id FROM profiles WHERE role_id = (SELECT id FROM roles WHERE name = 'admin') LIMIT 1),
    'create',
    'migration',
    NULL,
    '{"migration": "subscription_and_accounts_system", "date": "2025-01-09", "features": ["subscription_plans", "account_limits", "default_accounts", "balance_tracking"]}'::jsonb
);

COMMENT ON TABLE profiles IS 'User profiles with subscription and account management features';
COMMENT ON COLUMN profiles.subscription_plan IS 'User subscription plan: free, pro, premium';
COMMENT ON COLUMN profiles.max_accounts IS 'Maximum number of accounts allowed for this user';
COMMENT ON COLUMN accounts.is_default IS 'Whether this is the default account for the user';
COMMENT ON COLUMN accounts.display_order IS 'Order for displaying accounts in UI';