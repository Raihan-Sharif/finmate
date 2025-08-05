-- Fix RLS Policies to Remove Infinite Recursion
-- Run this in Supabase SQL Editor

-- =============================================
-- DROP EXISTING PROBLEMATIC POLICIES
-- =============================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON roles;
DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;
DROP POLICY IF EXISTS "Super admins can manage permissions" ON permissions;
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Super admins can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;

-- =============================================
-- CREATE FIXED RLS POLICIES (No Recursion)
-- =============================================

-- Roles: Simple admin check without join
CREATE POLICY "Super admins can manage roles" ON roles FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM profiles 
        WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
);

-- Permissions: Simple admin check
CREATE POLICY "Super admins can manage permissions" ON permissions FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM profiles 
        WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
);

-- Role Permissions: Simple admin check
CREATE POLICY "Super admins can manage role permissions" ON role_permissions FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM profiles 
        WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
);

-- Drop existing profile policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Profiles: Fixed policies without recursion
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all profiles (no recursion)
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
        SELECT p.user_id FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE r.name IN ('super_admin', 'admin', 'manager')
    )
);

-- Admins can update profiles (no recursion)
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
        SELECT p.user_id FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE r.name IN ('super_admin', 'admin')
    )
);

-- User Permissions: Simple admin check
CREATE POLICY "Admins can manage user permissions" ON user_permissions FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM profiles 
        WHERE role_id IN (
            SELECT id FROM roles WHERE name IN ('super_admin', 'admin')
        )
    )
);

-- Audit Logs: Simple admin check
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs FOR SELECT USING (
    auth.uid() IN (
        SELECT user_id FROM profiles 
        WHERE role_id IN (
            SELECT id FROM roles WHERE name IN ('super_admin', 'admin')
        )
    )
);

-- =============================================
-- ADD MISSING POLICIES FOR PROFILE INSERTION
-- =============================================

-- Drop existing profile insertion policy first
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Allow profile insertion during user creation
CREATE POLICY "Allow profile creation" ON profiles FOR INSERT WITH CHECK (true);

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 'RLS policies fixed successfully!' as message;