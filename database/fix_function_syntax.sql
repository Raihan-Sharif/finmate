-- Fix SQL Function Syntax Errors
-- Run this to fix all broken function definitions

-- Drop all broken functions first
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_categories(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_account_balance() CASCADE;
DROP FUNCTION IF EXISTS update_budget_spent() CASCADE;
DROP FUNCTION IF EXISTS get_financial_summary(UUID, VARCHAR(3)) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_permissions(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_ai_insights() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_profile(UUID) CASCADE;

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

-- Function to get user permissions (used by frontend)
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
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

-- Recreate all triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_budget_spent
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_budget_spent();

SELECT 'All function syntax errors fixed! Database is ready.' as message;