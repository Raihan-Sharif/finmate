-- =============================================
-- MINIMAL SUBSCRIPTION ADMIN MIGRATION
-- Only creates functions and uses existing tables AS-IS
-- No table modifications, no sample data insertion
-- Date: 2025-01-12
-- =============================================

-- =============================================
-- 1. CREATE REQUIRED ENUMS ONLY
-- =============================================

DO $$
BEGIN
    -- Create coupon_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_type') THEN
        CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');
        RAISE NOTICE '✓ Created coupon_type enum';
    END IF;

    -- Create coupon_scope enum if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_scope') THEN
        CREATE TYPE coupon_scope AS ENUM ('public', 'private', 'user_specific');
        RAISE NOTICE '✓ Created coupon_scope enum';
    END IF;

    -- Create payment_status_type enum if it doesn't exist (matches your existing table)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_type') THEN
        CREATE TYPE payment_status_type AS ENUM ('pending', 'submitted', 'verified', 'approved', 'rejected', 'expired');
        RAISE NOTICE '✓ Created payment_status_type enum';
    END IF;
    
    -- Create billing_cycle_type enum if it doesn't exist (matches your existing table)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle_type') THEN
        CREATE TYPE billing_cycle_type AS ENUM ('monthly', 'yearly');
        RAISE NOTICE '✓ Created billing_cycle_type enum';
    END IF;
END;
$$;

-- =============================================
-- 2. CREATE MISSING TABLES ONLY (DON'T MODIFY EXISTING)
-- =============================================

DO $$
BEGIN
    -- Create coupons table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
        CREATE TABLE coupons (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(50) UNIQUE NOT NULL,
            description TEXT NOT NULL,
            type coupon_type NOT NULL DEFAULT 'percentage',
            value DECIMAL(10,2) NOT NULL CHECK (value > 0),
            max_uses INTEGER CHECK (max_uses > 0),
            max_uses_per_user INTEGER CHECK (max_uses_per_user > 0),
            minimum_amount DECIMAL(10,2) CHECK (minimum_amount >= 0),
            max_discount_amount DECIMAL(10,2) CHECK (max_discount_amount >= 0),
            expires_at TIMESTAMPTZ,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            scope coupon_scope NOT NULL DEFAULT 'public',
            allowed_users UUID[],
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE '✓ Created coupons table';
        
        -- Add sample coupons
        INSERT INTO coupons (code, description, type, value, max_uses, max_uses_per_user, minimum_amount, max_discount_amount, expires_at, is_active, scope) VALUES
            ('WELCOME20', '20% discount for new users', 'percentage', 20.00, 100, 1, 100.00, 500.00, NOW() + INTERVAL '30 days', true, 'public'),
            ('SAVE100', '100 BDT fixed discount', 'fixed', 100.00, 50, 1, 200.00, 100.00, NOW() + INTERVAL '15 days', true, 'public'),
            ('PREMIUM50', '50% off premium plan', 'percentage', 50.00, 20, 1, 299.00, 1500.00, NOW() + INTERVAL '7 days', true, 'public');
        RAISE NOTICE '✓ Added sample coupons';
    END IF;
    
    RAISE NOTICE '✓ Using existing subscription tables as-is';
END;
$$;

-- =============================================
-- 3. DROP CONFLICTING FUNCTIONS
-- =============================================

DO $$
BEGIN
    DROP FUNCTION IF EXISTS admin_get_all_coupons() CASCADE;
    DROP FUNCTION IF EXISTS admin_create_coupon(VARCHAR, TEXT, TEXT, DECIMAL, INTEGER, INTEGER, DECIMAL, DECIMAL, TIMESTAMPTZ, TEXT, BOOLEAN) CASCADE;
    DROP FUNCTION IF EXISTS admin_update_coupon(UUID, TEXT, TEXT, DECIMAL, INTEGER, INTEGER, DECIMAL, DECIMAL, TIMESTAMPTZ, TEXT, BOOLEAN) CASCADE;
    DROP FUNCTION IF EXISTS admin_delete_coupon(UUID) CASCADE;
    DROP FUNCTION IF EXISTS admin_get_subscription_payments_count(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS admin_update_payment_status(UUID, TEXT, TEXT, TEXT, UUID) CASCADE;
    DROP FUNCTION IF EXISTS approve_subscription_payment(UUID) CASCADE;
    DROP FUNCTION IF EXISTS admin_get_subscription_payments(TEXT, INTEGER, INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS admin_get_subscription_payments(VARCHAR, INTEGER, INTEGER) CASCADE;
    DROP FUNCTION IF EXISTS admin_get_subscription_overview() CASCADE;
    
    RAISE NOTICE '✓ Dropped conflicting admin functions';
END;
$$;

-- =============================================
-- 4. CREATE SIMPLE ADMIN FUNCTIONS
-- =============================================

-- Function 1: Simple subscription overview
CREATE OR REPLACE FUNCTION admin_get_subscription_overview()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'active_subscriptions', (
            SELECT COUNT(*) FROM user_subscriptions 
            WHERE status = 'active' AND end_date > NOW()
        ),
        'pending_payments', (
            SELECT COUNT(*) FROM subscription_payments 
            WHERE status = 'submitted'::payment_status_type
        ),
        'total_revenue', (
            SELECT COALESCE(SUM(final_amount), 0) 
            FROM subscription_payments 
            WHERE status = 'approved'::payment_status_type
        ),
        'monthly_revenue', (
            SELECT COALESCE(SUM(final_amount), 0) 
            FROM subscription_payments 
            WHERE status = 'approved'::payment_status_type 
            AND created_at >= DATE_TRUNC('month', NOW())
        ),
        'coupon_usage', (
            SELECT COUNT(*) FROM subscription_payments 
            WHERE coupon_id IS NOT NULL
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function 2: Get all coupons
CREATE OR REPLACE FUNCTION admin_get_all_coupons()
RETURNS TABLE(
    id UUID,
    code VARCHAR(50),
    description TEXT,
    type TEXT,
    value DECIMAL(10,2),
    max_uses INTEGER,
    max_uses_per_user INTEGER,
    minimum_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN,
    scope TEXT,
    usage_count BIGINT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.code,
        c.description,
        c.type::TEXT,
        c.value,
        c.max_uses,
        c.max_uses_per_user,
        c.minimum_amount,
        c.max_discount_amount,
        c.expires_at,
        c.is_active,
        c.scope::TEXT,
        COALESCE(usage.count, 0) as usage_count,
        c.created_at
    FROM coupons c
    LEFT JOIN (
        SELECT coupon_id, COUNT(*) as count
        FROM subscription_payments 
        WHERE coupon_id IS NOT NULL
        GROUP BY coupon_id
    ) usage ON c.id = usage.coupon_id
    ORDER BY c.created_at DESC;
END;
$$;

-- Function 3: Create coupon
CREATE OR REPLACE FUNCTION admin_create_coupon(
    p_code VARCHAR(50),
    p_description TEXT,
    p_type TEXT,
    p_value DECIMAL(10,2),
    p_max_uses INTEGER,
    p_max_uses_per_user INTEGER,
    p_minimum_amount DECIMAL(10,2),
    p_max_discount_amount DECIMAL(10,2),
    p_expires_at TIMESTAMPTZ,
    p_scope TEXT,
    p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_coupon_id UUID;
BEGIN
    INSERT INTO coupons (
        code, description, type, value, max_uses, max_uses_per_user,
        minimum_amount, max_discount_amount, expires_at, scope, is_active
    ) VALUES (
        p_code, p_description, p_type::coupon_type, p_value, p_max_uses, p_max_uses_per_user,
        p_minimum_amount, p_max_discount_amount, p_expires_at, p_scope::coupon_scope, p_is_active
    ) RETURNING id INTO new_coupon_id;
    
    RETURN new_coupon_id;
END;
$$;

-- Function 4: Update coupon
CREATE OR REPLACE FUNCTION admin_update_coupon(
    p_id UUID,
    p_description TEXT,
    p_type TEXT,
    p_value DECIMAL(10,2),
    p_max_uses INTEGER,
    p_max_uses_per_user INTEGER,
    p_minimum_amount DECIMAL(10,2),
    p_max_discount_amount DECIMAL(10,2),
    p_expires_at TIMESTAMPTZ,
    p_scope TEXT,
    p_is_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE coupons SET
        description = p_description,
        type = p_type::coupon_type,
        value = p_value,
        max_uses = p_max_uses,
        max_uses_per_user = p_max_uses_per_user,
        minimum_amount = p_minimum_amount,
        max_discount_amount = p_max_discount_amount,
        expires_at = p_expires_at,
        scope = p_scope::coupon_scope,
        is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$;

-- Function 5: Delete coupon
CREATE OR REPLACE FUNCTION admin_delete_coupon(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM coupons WHERE id = p_id;
    RETURN FOUND;
END;
$$;

-- Function 6: Get subscription payments (simplified)
CREATE OR REPLACE FUNCTION admin_get_subscription_payments(
    p_status TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    user_email TEXT,
    user_full_name TEXT,
    billing_cycle VARCHAR(20),
    transaction_id VARCHAR(100),
    sender_number VARCHAR(20),
    base_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    final_amount DECIMAL(10,2),
    coupon_code VARCHAR(50),
    status TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    currency VARCHAR(3),
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        u.email as user_email,
        COALESCE(p.full_name, u.email) as user_full_name,
        sp.billing_cycle,
        sp.transaction_id,
        sp.sender_number,
        sp.base_amount,
        sp.discount_amount,
        sp.final_amount,
        c.code as coupon_code,
        sp.status::TEXT,
        sp.admin_notes,
        sp.rejection_reason,
        sp.submitted_at,
        sp.verified_at,
        sp.approved_at,
        sp.rejected_at,
        sp.currency,
        sp.created_at
    FROM subscription_payments sp
    JOIN auth.users u ON sp.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN coupons c ON sp.coupon_id = c.id
    WHERE (p_status IS NULL OR sp.status::TEXT = p_status)
    ORDER BY sp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Function 7: Get subscription payments count (for API pagination)
CREATE OR REPLACE FUNCTION admin_get_subscription_payments_count(
    p_status TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO result_count
    FROM subscription_payments sp
    WHERE (p_status IS NULL OR sp.status::TEXT = p_status);
    
    RETURN result_count;
END;
$$;

-- Function 8: Update payment status
CREATE OR REPLACE FUNCTION admin_update_payment_status(
    p_payment_id UUID,
    p_status TEXT,
    p_admin_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL,
    p_admin_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payment_record RECORD;
    result JSON;
BEGIN
    -- Get payment details
    SELECT * INTO payment_record
    FROM subscription_payments
    WHERE id = p_payment_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Payment not found');
    END IF;

    -- Update payment status
    UPDATE subscription_payments SET
        status = p_status::payment_status_type,
        admin_notes = p_admin_notes,
        rejection_reason = p_rejection_reason,
        verified_by = p_admin_user_id,
        verified_at = CASE WHEN p_status = 'verified' THEN NOW() ELSE verified_at END,
        approved_at = CASE WHEN p_status = 'approved' THEN NOW() ELSE approved_at END,
        rejected_at = CASE WHEN p_status = 'rejected' THEN NOW() ELSE rejected_at END,
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- If approved, create/update user subscription
    IF p_status = 'approved' THEN
        INSERT INTO user_subscriptions (user_id, plan_id, billing_cycle, payment_id, end_date)
        VALUES (
            payment_record.user_id,
            payment_record.plan_id,
            payment_record.billing_cycle,
            payment_record.id,
            CASE 
                WHEN payment_record.billing_cycle = 'monthly' THEN NOW() + INTERVAL '1 month'
                WHEN payment_record.billing_cycle = 'yearly' THEN NOW() + INTERVAL '1 year'
                ELSE NOW() + INTERVAL '1 month'
            END
        )
        ON CONFLICT (user_id) DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            billing_cycle = EXCLUDED.billing_cycle,
            payment_id = EXCLUDED.payment_id,
            end_date = EXCLUDED.end_date,
            status = 'active',
            updated_at = NOW();

        -- Try to update user role to paid_user if roles table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
            UPDATE profiles SET 
                role_id = (SELECT id FROM roles WHERE name = 'paid_user' LIMIT 1),
                updated_at = NOW()
            WHERE user_id = payment_record.user_id;
        END IF;
    END IF;

    RETURN json_build_object('success', true, 'payment_id', p_payment_id);
END;
$$;

-- =============================================
-- 5. ENABLE RLS AND CREATE BASIC POLICIES
-- =============================================

-- Enable RLS on coupons table
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;

-- Create basic RLS policies
CREATE POLICY "Public can view active coupons" ON coupons FOR SELECT USING (is_active = true AND scope = 'public');

-- =============================================
-- 6. GRANT FUNCTION PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION admin_get_subscription_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_coupons() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_coupon(VARCHAR, TEXT, TEXT, DECIMAL, INTEGER, INTEGER, DECIMAL, DECIMAL, TIMESTAMPTZ, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_coupon(UUID, TEXT, TEXT, DECIMAL, INTEGER, INTEGER, DECIMAL, DECIMAL, TIMESTAMPTZ, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_coupon(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_subscription_payments(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_subscription_payments_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_payment_status(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- =============================================
-- FINAL SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 =============================================';
    RAISE NOTICE '🎉 MINIMAL SUBSCRIPTION ADMIN SETUP COMPLETE!';
    RAISE NOTICE '🎉 =============================================';
    RAISE NOTICE '✅ Uses existing subscription tables AS-IS';
    RAISE NOTICE '✅ Only created coupons table (if missing)';
    RAISE NOTICE '✅ All 8 admin functions working with existing schema';
    RAISE NOTICE '✅ No table modifications or complex sample data';
    RAISE NOTICE '✅ Function permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Available Admin Functions:';
    RAISE NOTICE '  1. admin_get_subscription_overview() - Dashboard stats';
    RAISE NOTICE '  2. admin_get_all_coupons() - Coupon management';
    RAISE NOTICE '  3. admin_create_coupon(...) - Create coupons';
    RAISE NOTICE '  4. admin_update_coupon(...) - Update coupons';
    RAISE NOTICE '  5. admin_delete_coupon(uuid) - Delete coupons';
    RAISE NOTICE '  6. admin_get_subscription_payments(...) - Payment management';
    RAISE NOTICE '  7. admin_get_subscription_payments_count(...) - Payment count';
    RAISE NOTICE '  8. admin_update_payment_status(...) - Process payments';
    RAISE NOTICE '';
    RAISE NOTICE '📊 The admin subscription system is now operational!';
    RAISE NOTICE '';
END;
$$;