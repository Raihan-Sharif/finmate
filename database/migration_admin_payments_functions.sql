-- Migration: Admin Payment Management Functions
-- Description: Add functions for admin payment operations that bypass RLS
-- Date: 2025-01-11

BEGIN;

-- ==============================================
-- 1. Admin Payment Management Functions
-- ==============================================

-- Function to get all subscription payments for admin (bypasses RLS)
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
        sp.billing_cycle,
        sp.transaction_id,
        sp.sender_number,
        sp.base_amount,
        sp.discount_amount,
        sp.final_amount,
        sp.coupon_id,
        sp.notes,
        sp.status,
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
        c.type as coupon_type,
        c.value as coupon_value
    FROM subscription_payments sp
    LEFT JOIN profiles p ON sp.user_id = p.user_id
    LEFT JOIN subscription_plans splan ON sp.plan_id = splan.id
    LEFT JOIN payment_methods pm ON sp.payment_method_id = pm.id
    LEFT JOIN coupons c ON sp.coupon_id = c.id
    WHERE (p_status IS NULL OR p_status = 'all' OR sp.status = p_status)
    ORDER BY sp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Function to get total count of subscription payments for admin
CREATE OR REPLACE FUNCTION admin_get_subscription_payments_count(
    p_status TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM subscription_payments sp
    WHERE (p_status IS NULL OR p_status = 'all' OR sp.status = p_status);
    
    RETURN v_count;
END;
$$;

-- Function to update payment status (admin only)
CREATE OR REPLACE FUNCTION admin_update_payment_status(
    p_payment_id UUID,
    p_status VARCHAR(20),
    p_admin_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL,
    p_admin_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    status VARCHAR(20),
    admin_notes TEXT,
    rejection_reason TEXT,
    verified_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    verified_by UUID,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_status VARCHAR(20);
    v_payment_record RECORD;
BEGIN
    -- Check if payment exists and get current status
    SELECT status INTO v_old_status 
    FROM subscription_payments 
    WHERE subscription_payments.id = p_payment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    -- Validate status transition
    IF p_status NOT IN ('submitted', 'verified', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid payment status';
    END IF;

    -- Update payment record
    UPDATE subscription_payments SET
        status = p_status,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        rejection_reason = CASE 
            WHEN p_status = 'rejected' THEN COALESCE(p_rejection_reason, rejection_reason)
            ELSE NULL
        END,
        verified_by = COALESCE(p_admin_user_id, verified_by),
        verified_at = CASE 
            WHEN p_status IN ('verified', 'approved') AND verified_at IS NULL THEN NOW()
            ELSE verified_at
        END,
        approved_at = CASE 
            WHEN p_status = 'approved' THEN NOW()
            WHEN p_status != 'approved' THEN NULL
            ELSE approved_at
        END,
        rejected_at = CASE 
            WHEN p_status = 'rejected' THEN NOW()
            WHEN p_status != 'rejected' THEN NULL
            ELSE rejected_at
        END,
        updated_at = NOW()
    WHERE subscription_payments.id = p_payment_id;

    -- If approved, we might want to trigger subscription activation
    -- This would be handled by existing triggers or additional logic

    -- Return updated payment info
    RETURN QUERY
    SELECT 
        sp.id,
        sp.status,
        sp.admin_notes,
        sp.rejection_reason,
        sp.verified_at,
        sp.approved_at,
        sp.rejected_at,
        sp.verified_by,
        sp.updated_at
    FROM subscription_payments sp
    WHERE sp.id = p_payment_id;
END;
$$;

-- ==============================================
-- 2. Grant Permissions
-- ==============================================

-- Grant execute permissions to authenticated users
-- (admin role check will be done in the API layer)
GRANT EXECUTE ON FUNCTION admin_get_subscription_payments(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_subscription_payments_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_payment_status(UUID, VARCHAR, TEXT, TEXT, UUID) TO authenticated;

COMMIT;