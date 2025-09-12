-- =============================================
-- MINIMAL ADMIN FIXES - Essential Only
-- Fix critical admin panel issues with minimal changes
-- Date: 2025-01-12
-- =============================================

BEGIN;

-- =============================================
-- 1. Fix Admin Payment Function Type Casting
-- =============================================

CREATE OR REPLACE FUNCTION admin_get_subscription_payments(
    p_status TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    plan_id UUID,
    payment_method_id UUID,
    billing_cycle VARCHAR(20),
    transaction_id VARCHAR(100),
    sender_number VARCHAR(20),
    base_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    final_amount DECIMAL(10,2),
    coupon_id UUID,
    notes TEXT,
    status VARCHAR(20),
    admin_notes TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    verified_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    currency VARCHAR(3),
    user_full_name TEXT,
    user_email TEXT,
    plan_display_name TEXT,
    plan_name TEXT,
    payment_method_display_name TEXT,
    payment_method_name TEXT,
    coupon_code TEXT,
    coupon_type TEXT,
    coupon_value DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.user_id,
        sp.plan_id,
        sp.payment_method_id,
        sp.billing_cycle::VARCHAR(20),
        sp.transaction_id,
        sp.sender_number,
        sp.base_amount,
        sp.discount_amount,
        sp.final_amount,
        sp.coupon_id,
        sp.notes,
        sp.status::VARCHAR(20),
        sp.admin_notes,
        sp.rejection_reason,
        sp.submitted_at,
        sp.verified_at,
        sp.approved_at,
        sp.rejected_at,
        sp.verified_by,
        sp.created_at,
        sp.updated_at,
        sp.currency,
        p.full_name as user_full_name,
        p.email as user_email,
        splan.display_name as plan_display_name,
        splan.plan_name,
        pm.display_name as payment_method_display_name,
        pm.method_name as payment_method_name,
        c.code as coupon_code,
        c.type::TEXT as coupon_type,
        c.value as coupon_value
    FROM subscription_payments sp
    LEFT JOIN profiles p ON sp.user_id = p.user_id
    LEFT JOIN subscription_plans splan ON sp.plan_id = splan.id
    LEFT JOIN payment_methods pm ON sp.payment_method_id = pm.id
    LEFT JOIN coupons c ON sp.coupon_id = c.id
    WHERE (
        p_status IS NULL OR 
        p_status = 'all' OR 
        sp.status::TEXT = p_status
    )
    ORDER BY sp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- =============================================
-- 2. Fix Admin Payment Count Function
-- =============================================

CREATE OR REPLACE FUNCTION admin_get_subscription_payments_count(
    p_status TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER
    INTO payment_count
    FROM subscription_payments sp
    WHERE (
        p_status IS NULL OR 
        p_status = 'all' OR 
        sp.status::TEXT = p_status
    );
    
    RETURN payment_count;
END;
$$;

-- =============================================
-- 3. Fix Admin Coupon Create Function - Resolve Ambiguous References
-- =============================================

CREATE OR REPLACE FUNCTION admin_create_coupon(
    p_code VARCHAR(50),
    p_description TEXT,
    p_type VARCHAR(20),
    p_value DECIMAL(10,2),
    p_max_uses INTEGER DEFAULT NULL,
    p_max_uses_per_user INTEGER DEFAULT NULL,
    p_minimum_amount DECIMAL(10,2) DEFAULT NULL,
    p_max_discount_amount DECIMAL(10,2) DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_scope VARCHAR(20) DEFAULT 'public',
    p_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    code VARCHAR(50),
    description TEXT,
    type VARCHAR(20),
    value DECIMAL(10,2),
    max_uses INTEGER,
    max_uses_per_user INTEGER,
    used_count INTEGER,
    minimum_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN,
    scope VARCHAR(20),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon_id UUID;
BEGIN
    -- Check if coupon code already exists (qualified table reference)
    IF EXISTS (SELECT 1 FROM coupons existing_coupon WHERE UPPER(existing_coupon.code) = UPPER(p_code)) THEN
        RAISE EXCEPTION 'Coupon code already exists';
    END IF;

    -- Validate input
    IF p_type NOT IN ('percentage', 'fixed') THEN
        RAISE EXCEPTION 'Invalid coupon type. Must be percentage or fixed';
    END IF;

    -- Insert new coupon
    INSERT INTO coupons (
        code,
        description,
        type,
        value,
        max_uses,
        max_uses_per_user,
        minimum_amount,
        max_discount_amount,
        expires_at,
        scope,
        is_active,
        used_count
    ) VALUES (
        UPPER(p_code),
        p_description,
        p_type::coupon_type,
        p_value,
        p_max_uses,
        p_max_uses_per_user,
        p_minimum_amount,
        p_max_discount_amount,
        p_expires_at,
        p_scope::VARCHAR(20),
        p_is_active,
        0
    )
    RETURNING coupons.id INTO v_coupon_id;

    -- Return the created coupon
    RETURN QUERY
    SELECT 
        created_coupon.id,
        created_coupon.code,
        created_coupon.description,
        created_coupon.type::VARCHAR(20),
        created_coupon.value,
        created_coupon.max_uses,
        created_coupon.max_uses_per_user,
        created_coupon.used_count,
        created_coupon.minimum_amount,
        created_coupon.max_discount_amount,
        created_coupon.expires_at,
        created_coupon.is_active,
        created_coupon.scope::VARCHAR(20),
        created_coupon.created_at,
        created_coupon.updated_at
    FROM coupons created_coupon
    WHERE created_coupon.id = v_coupon_id;
END;
$$;

-- =============================================
-- 4. Fix Admin Coupon Update Function
-- =============================================

CREATE OR REPLACE FUNCTION admin_update_coupon(
    p_coupon_id UUID,
    p_description TEXT DEFAULT NULL,
    p_type VARCHAR(20) DEFAULT NULL,
    p_value DECIMAL(10,2) DEFAULT NULL,
    p_max_uses INTEGER DEFAULT NULL,
    p_max_uses_per_user INTEGER DEFAULT NULL,
    p_minimum_amount DECIMAL(10,2) DEFAULT NULL,
    p_max_discount_amount DECIMAL(10,2) DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_scope VARCHAR(20) DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    code VARCHAR(50),
    description TEXT,
    type VARCHAR(20),
    value DECIMAL(10,2),
    max_uses INTEGER,
    max_uses_per_user INTEGER,
    used_count INTEGER,
    minimum_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN,
    scope VARCHAR(20),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if coupon exists
    IF NOT EXISTS (SELECT 1 FROM coupons WHERE coupons.id = p_coupon_id) THEN
        RAISE EXCEPTION 'Coupon not found';
    END IF;

    -- Validate input if provided
    IF p_type IS NOT NULL AND p_type NOT IN ('percentage', 'fixed') THEN
        RAISE EXCEPTION 'Invalid coupon type. Must be percentage or fixed';
    END IF;

    -- Update coupon with only provided values
    UPDATE coupons SET
        description = COALESCE(p_description, description),
        type = COALESCE(p_type::coupon_type, type),
        value = COALESCE(p_value, value),
        max_uses = CASE WHEN p_max_uses IS NOT NULL THEN p_max_uses ELSE max_uses END,
        max_uses_per_user = CASE WHEN p_max_uses_per_user IS NOT NULL THEN p_max_uses_per_user ELSE max_uses_per_user END,
        minimum_amount = CASE WHEN p_minimum_amount IS NOT NULL THEN p_minimum_amount ELSE minimum_amount END,
        max_discount_amount = CASE WHEN p_max_discount_amount IS NOT NULL THEN p_max_discount_amount ELSE max_discount_amount END,
        expires_at = CASE WHEN p_expires_at IS NOT NULL THEN p_expires_at ELSE expires_at END,
        scope = COALESCE(p_scope, scope),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = NOW()
    WHERE coupons.id = p_coupon_id;

    -- Return the updated coupon
    RETURN QUERY
    SELECT 
        updated_coupon.id,
        updated_coupon.code,
        updated_coupon.description,
        updated_coupon.type::VARCHAR(20),
        updated_coupon.value,
        updated_coupon.max_uses,
        updated_coupon.max_uses_per_user,
        updated_coupon.used_count,
        updated_coupon.minimum_amount,
        updated_coupon.max_discount_amount,
        updated_coupon.expires_at,
        updated_coupon.is_active,
        updated_coupon.scope::VARCHAR(20),
        updated_coupon.created_at,
        updated_coupon.updated_at
    FROM coupons updated_coupon
    WHERE updated_coupon.id = p_coupon_id;
END;
$$;

-- =============================================
-- 5. Grant Execute Permissions
-- =============================================

GRANT EXECUTE ON FUNCTION admin_get_subscription_payments(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_subscription_payments_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_coupon(VARCHAR, TEXT, VARCHAR, DECIMAL, INTEGER, INTEGER, DECIMAL, DECIMAL, TIMESTAMPTZ, VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_coupon(UUID, TEXT, VARCHAR, DECIMAL, INTEGER, INTEGER, DECIMAL, DECIMAL, TIMESTAMPTZ, VARCHAR, BOOLEAN) TO authenticated;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ MINIMAL ADMIN FIXES APPLIED SUCCESSFULLY!';
    RAISE NOTICE '🔧 Payment fetch should now work';
    RAISE NOTICE '🔧 Coupon creation should work';
    RAISE NOTICE '🔧 Type casting issues resolved';
END $$;