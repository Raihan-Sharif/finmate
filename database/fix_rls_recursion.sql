-- Fix RLS Infinite Recursion Issue
-- Run this to fix the profiles table recursion error

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can manage user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;

-- Create simple, non-recursive policies
-- Profiles: Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- System tables: Block regular user access (admin functions use service_role)
CREATE POLICY "Block access to roles" ON roles FOR ALL USING (false);
CREATE POLICY "Block access to permissions" ON permissions FOR ALL USING (false);
CREATE POLICY "Block access to role permissions" ON role_permissions FOR ALL USING (false);
CREATE POLICY "Block access to user permissions" ON user_permissions FOR ALL USING (false);
CREATE POLICY "Block audit logs access" ON admin_audit_logs FOR ALL USING (false);

-- Add missing functions that might be needed
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

SELECT 'RLS recursion issue fixed! Try logging in again.' as message;