-- Migration: Admin Coupon Management Functions
-- Description: Add functions for admin coupon CRUD operations that bypass RLS
-- Date: 2025-01-11

BEGIN;

-- ==============================================
-- 1. Admin Coupon Management Functions
-- ==============================================

-- Function to get all coupons for admin (bypasses RLS)
CREATE OR REPLACE FUNCTION admin_get_all_coupons()
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
    allowed_users UUID[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.code,
        c.description,
        c.type,
        c.value,
        c.max_uses,
        c.max_uses_per_user,
        c.used_count,
        c.minimum_amount,
        c.max_discount_amount,
        c.expires_at,
        c.is_active,
        c.scope,
        c.allowed_users,
        c.created_at,
        c.updated_at
    FROM coupons c
    ORDER BY c.created_at DESC;
END;
$$;

-- Function to create coupon (admin only)
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
    -- Check if coupon code already exists
    IF EXISTS (SELECT 1 FROM coupons WHERE UPPER(code) = UPPER(p_code)) THEN
        RAISE EXCEPTION 'Coupon code already exists';
    END IF;

    -- Validate input
    IF p_type NOT IN ('percentage', 'fixed') THEN
        RAISE EXCEPTION 'Invalid coupon type. Must be percentage or fixed';
    END IF;

    IF p_type = 'percentage' AND (p_value < 0 OR p_value > 100) THEN
        RAISE EXCEPTION 'Percentage value must be between 0 and 100';
    END IF;

    IF p_type = 'fixed' AND p_value < 0 THEN
        RAISE EXCEPTION 'Fixed value must be greater than 0';
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
        p_type,
        p_value,
        p_max_uses,
        p_max_uses_per_user,
        p_minimum_amount,
        p_max_discount_amount,
        p_expires_at,
        p_scope,
        p_is_active,
        0
    )
    RETURNING coupons.id INTO v_coupon_id;

    -- Return the created coupon
    RETURN QUERY
    SELECT 
        c.id,
        c.code,
        c.description,
        c.type,
        c.value,
        c.max_uses,
        c.max_uses_per_user,
        c.used_count,
        c.minimum_amount,
        c.max_discount_amount,
        c.expires_at,
        c.is_active,
        c.scope,
        c.created_at,
        c.updated_at
    FROM coupons c
    WHERE c.id = v_coupon_id;
END;
$$;

-- Function to update coupon (admin only)
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

    IF p_type = 'percentage' AND p_value IS NOT NULL AND (p_value < 0 OR p_value > 100) THEN
        RAISE EXCEPTION 'Percentage value must be between 0 and 100';
    END IF;

    IF p_type = 'fixed' AND p_value IS NOT NULL AND p_value < 0 THEN
        RAISE EXCEPTION 'Fixed value must be greater than 0';
    END IF;

    -- Update coupon with only provided values
    UPDATE coupons SET
        description = COALESCE(p_description, description),
        type = COALESCE(p_type, type),
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
        c.id,
        c.code,
        c.description,
        c.type,
        c.value,
        c.max_uses,
        c.max_uses_per_user,
        c.used_count,
        c.minimum_amount,
        c.max_discount_amount,
        c.expires_at,
        c.is_active,
        c.scope,
        c.created_at,
        c.updated_at
    FROM coupons c
    WHERE c.id = p_coupon_id;
END;
$$;

-- Function to delete coupon (admin only)
CREATE OR REPLACE FUNCTION admin_delete_coupon(p_coupon_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if coupon exists
    IF NOT EXISTS (SELECT 1 FROM coupons WHERE id = p_coupon_id) THEN
        RAISE EXCEPTION 'Coupon not found';
    END IF;

    -- Check if coupon is used in any payments
    IF EXISTS (SELECT 1 FROM subscription_payments WHERE coupon_id = p_coupon_id) THEN
        RAISE EXCEPTION 'Cannot delete coupon that has been used in payments';
    END IF;

    -- Delete the coupon
    DELETE FROM coupons WHERE id = p_coupon_id;

    RETURN true;
END;
$$;

-- Function to toggle coupon status (admin only)
CREATE OR REPLACE FUNCTION admin_toggle_coupon_status(
    p_coupon_id UUID,
    p_is_active BOOLEAN
)
RETURNS TABLE (
    id UUID,
    code VARCHAR(50),
    is_active BOOLEAN,
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

    -- Update status
    UPDATE coupons SET
        is_active = p_is_active,
        updated_at = NOW()
    WHERE coupons.id = p_coupon_id;

    -- Return the updated coupon info
    RETURN QUERY
    SELECT 
        c.id,
        c.code,
        c.is_active,
        c.updated_at
    FROM coupons c
    WHERE c.id = p_coupon_id;
END;
$$;

-- ==============================================
-- 2. Grant Permissions
-- ==============================================

-- Grant execute permissions to authenticated users
-- (admin role check will be done in the API layer)
GRANT EXECUTE ON FUNCTION admin_get_all_coupons() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_coupon(VARCHAR, TEXT, VARCHAR, DECIMAL, INTEGER, INTEGER, DECIMAL, DECIMAL, TIMESTAMPTZ, VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_coupon(UUID, TEXT, VARCHAR, DECIMAL, INTEGER, INTEGER, DECIMAL, DECIMAL, TIMESTAMPTZ, VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_coupon(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_toggle_coupon_status(UUID, BOOLEAN) TO authenticated;

COMMIT;