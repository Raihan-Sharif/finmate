-- Update default accounts creation to be more generic and useful
-- This script updates the create_default_categories function

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

    -- Create default accounts (more generic and useful)
    INSERT INTO public.accounts (user_id, name, type, balance, currency, description) VALUES
    (user_id_param, 'Salary Account', 'bank', 0.00, 'USD', 'Main salary receiving account'),
    (user_id_param, 'Savings Account', 'savings', 0.00, 'USD', 'Personal savings account'),
    (user_id_param, 'bKash', 'wallet', 0.00, 'BDT', 'Mobile financial service'),
    (user_id_param, 'Nagad', 'wallet', 0.00, 'BDT', 'Mobile financial service'),
    (user_id_param, 'Credit Card', 'credit_card', 0.00, 'USD', 'Credit card account'),
    (user_id_param, 'Cash', 'other', 0.00, 'USD', 'Physical cash');
    
    RAISE NOTICE 'Created default categories and accounts for user: %', user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create better default accounts for existing users
CREATE OR REPLACE FUNCTION public.create_better_default_accounts(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete existing default accounts to replace with better ones
    DELETE FROM public.accounts 
    WHERE user_id = user_id_param 
    AND name = 'Main Account';
    
    -- Create better default accounts
    INSERT INTO public.accounts (user_id, name, type, balance, currency, description) VALUES
    (user_id_param, 'Salary Account', 'bank', 0.00, 'USD', 'Main salary receiving account'),
    (user_id_param, 'Savings Account', 'savings', 0.00, 'USD', 'Personal savings account'),
    (user_id_param, 'bKash', 'wallet', 0.00, 'BDT', 'Mobile financial service'),
    (user_id_param, 'Nagad', 'wallet', 0.00, 'BDT', 'Mobile financial service'),
    (user_id_param, 'Credit Card', 'credit_card', 0.00, 'USD', 'Credit card account'),
    (user_id_param, 'Cash', 'other', 0.00, 'USD', 'Physical cash')
    ON CONFLICT (user_id, name) DO NOTHING;
    
    RAISE NOTICE 'Created better default accounts for user: %', user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;