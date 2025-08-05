-- Fix Profile Creation Trigger
-- Run this in Supabase SQL Editor

-- =============================================
-- DROP AND RECREATE TRIGGER FUNCTION
-- =============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create improved trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    default_role_id UUID;
    admin_role_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = NEW.id) INTO profile_exists;
    
    IF profile_exists THEN
        RAISE LOG 'Profile already exists for user %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Count existing users (excluding service accounts)
    SELECT COUNT(*) FROM auth.users 
    WHERE email NOT LIKE '%supabase.co%' 
    AND email NOT LIKE '%localhost%' INTO user_count;
    
    -- Get role IDs safely
    SELECT id FROM roles WHERE name = 'user' LIMIT 1 INTO default_role_id;
    SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1 INTO admin_role_id;
    
    -- If roles don't exist yet, log and return
    IF default_role_id IS NULL OR admin_role_id IS NULL THEN
        RAISE WARNING 'Roles not found. user: %, super_admin: %', default_role_id, admin_role_id;
        RETURN NEW;
    END IF;
    
    -- Insert profile with proper error handling
    BEGIN
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
                split_part(NEW.email, '@', 1)
            ),
            NEW.raw_user_meta_data->>'avatar_url',
            CASE 
                WHEN user_count <= 1 THEN admin_role_id 
                ELSE default_role_id 
            END,
            COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
        );
        
        RAISE LOG 'Profile created successfully for user %', NEW.id;
        
    EXCEPTION
        WHEN unique_violation THEN
            RAISE LOG 'Profile already exists for user % (unique violation)', NEW.id;
        WHEN OTHERS THEN
            RAISE WARNING 'Failed to create profile for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    END;
    
    -- Create default categories and account (with error handling)
    BEGIN
        PERFORM create_default_categories(NEW.id);
        RAISE LOG 'Default categories created for user %', NEW.id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Failed to create default categories for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ALSO FIX THE DEFAULT CATEGORIES FUNCTION
-- =============================================

DROP FUNCTION IF EXISTS create_default_categories(UUID) CASCADE;

CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if categories already exist
    IF EXISTS(SELECT 1 FROM categories WHERE user_id = p_user_id LIMIT 1) THEN
        RAISE LOG 'Categories already exist for user %', p_user_id;
        RETURN;
    END IF;
    
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
    
    -- Create default account if none exists
    IF NOT EXISTS(SELECT 1 FROM accounts WHERE user_id = p_user_id LIMIT 1) THEN
        INSERT INTO accounts (user_id, name, type, balance, currency) VALUES
        (p_user_id, 'Main Account', 'bank', 0, 'USD');
    END IF;
    
    RAISE LOG 'Default categories and account created for user %', p_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating default categories for user %: % %', p_user_id, SQLSTATE, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- MANUAL PROFILE CREATION FOR EXISTING USERS
-- =============================================

-- Create profiles for any existing users that don't have them
DO $$
DECLARE
    user_record RECORD;
    user_count INTEGER;
    default_role_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id FROM roles WHERE name = 'user' INTO default_role_id;
    SELECT id FROM roles WHERE name = 'super_admin' INTO admin_role_id;
    
    IF default_role_id IS NULL OR admin_role_id IS NULL THEN
        RAISE WARNING 'Roles not found, skipping profile creation';
        RETURN;
    END IF;
    
    -- Count existing users
    SELECT COUNT(*) FROM auth.users INTO user_count;
    
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
                avatar_url, 
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
                user_record.raw_user_meta_data->>'avatar_url',
                CASE 
                    WHEN user_count <= 1 THEN admin_role_id 
                    ELSE default_role_id 
                END,
                COALESCE(user_record.email_confirmed_at IS NOT NULL, false)
            );
            
            -- Create default categories
            PERFORM create_default_categories(user_record.id);
            
            RAISE LOG 'Created profile for existing user %', user_record.email;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create profile for user %: % %', user_record.email, SQLSTATE, SQLERRM;
        END;
    END LOOP;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 
    'Profile trigger fixed successfully!' as message,
    COUNT(*) as profiles_created
FROM profiles;