-- Add role-based authentication to FinMate
-- Run this AFTER the main schema.sql

-- Create user role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user' NOT NULL;

-- Add admin-specific columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS can_manage_system BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT false NOT NULL;

-- Create admin logs table for audit trail
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_resource VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on admin logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Admin logs policies - only admins can view logs
DROP POLICY IF EXISTS "Admins can view admin logs" ON admin_logs;
CREATE POLICY "Admins can view admin logs" ON admin_logs 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;
CREATE POLICY "Admins can insert admin logs" ON admin_logs 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Update profiles policies to allow admins to manage other users
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can update user profiles" ON profiles;
CREATE POLICY "Admins can update user profiles" ON profiles 
FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
        AND can_manage_users = true
    )
);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = user_uuid 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check specific admin permissions
CREATE OR REPLACE FUNCTION has_admin_permission(user_uuid UUID, permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = user_uuid 
        AND role = 'admin'
        AND (
            (permission = 'manage_users' AND can_manage_users = true) OR
            (permission = 'manage_system' AND can_manage_system = true) OR
            (permission = 'view_analytics' AND can_view_analytics = true)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to promote user to admin (can only be called by existing admin)
CREATE OR REPLACE FUNCTION promote_to_admin(
    target_user_id UUID,
    can_manage_users_param BOOLEAN DEFAULT false,
    can_manage_system_param BOOLEAN DEFAULT false,
    can_view_analytics_param BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_is_admin BOOLEAN;
BEGIN
    -- Check if current user is admin with user management permissions
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
        AND can_manage_users = true
    ) INTO current_user_is_admin;
    
    IF NOT current_user_is_admin THEN
        RAISE EXCEPTION 'Only admins with user management permissions can promote users';
    END IF;
    
    -- Update the target user's profile
    UPDATE profiles 
    SET 
        role = 'admin',
        can_manage_users = can_manage_users_param,
        can_manage_system = can_manage_system_param,
        can_view_analytics = can_view_analytics_param,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Log the action
    INSERT INTO admin_logs (admin_user_id, action, target_user_id, details)
    VALUES (
        auth.uid(), 
        'promote_to_admin', 
        target_user_id,
        jsonb_build_object(
            'can_manage_users', can_manage_users_param,
            'can_manage_system', can_manage_system_param,
            'can_view_analytics', can_view_analytics_param
        )
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to demote admin to regular user
CREATE OR REPLACE FUNCTION demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_is_admin BOOLEAN;
BEGIN
    -- Check if current user is admin with user management permissions
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
        AND can_manage_users = true
    ) INTO current_user_is_admin;
    
    IF NOT current_user_is_admin THEN
        RAISE EXCEPTION 'Only admins with user management permissions can demote users';
    END IF;
    
    -- Prevent self-demotion
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot demote yourself';
    END IF;
    
    -- Update the target user's profile
    UPDATE profiles 
    SET 
        role = 'user',
        can_manage_users = false,
        can_manage_system = false,
        can_view_analytics = false,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Log the action
    INSERT INTO admin_logs (admin_user_id, action, target_user_id)
    VALUES (auth.uid(), 'demote_from_admin', target_user_id);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to support making first user admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    is_first_user BOOLEAN := false;
BEGIN
    -- Check if this is the first user (make them admin)
    SELECT COUNT(*) FROM auth.users INTO user_count;
    
    IF user_count <= 1 THEN
        is_first_user := true;
    END IF;
    
    -- Create profile with all required fields
    INSERT INTO profiles (
        user_id, 
        full_name, 
        avatar_url, 
        currency, 
        timezone, 
        theme, 
        notifications_enabled, 
        ai_insights_enabled,
        role,
        can_manage_users,
        can_manage_system,
        can_view_analytics
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        'USD',
        'UTC',
        'system',
        true,
        true,
        CASE WHEN is_first_user THEN 'admin'::user_role ELSE 'user'::user_role END,
        is_first_user,
        is_first_user,
        is_first_user
    );
    
    -- Create default categories
    PERFORM create_default_categories(NEW.id);
    
    -- Log admin creation if first user
    IF is_first_user THEN
        INSERT INTO admin_logs (admin_user_id, action, details)
        VALUES (
            NEW.id, 
            'first_admin_created',
            jsonb_build_object('email', NEW.email)
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create index for admin logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Add trigger for admin logs updated_at (if needed)
CREATE OR REPLACE FUNCTION update_admin_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;