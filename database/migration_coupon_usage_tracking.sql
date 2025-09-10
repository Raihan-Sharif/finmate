-- Migration: Add Coupon Usage Tracking
-- Description: Track coupon usage when payments are submitted and approved
-- Date: 2025-01-09

BEGIN;

-- ==============================================
-- 1. Add Coupon Usage Tracking Function
-- ==============================================

-- Function to track coupon usage when payment is submitted
CREATE OR REPLACE FUNCTION track_coupon_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If coupon is used and payment is submitted, increment used count
    IF NEW.coupon_id IS NOT NULL AND NEW.status = 'submitted' THEN
        UPDATE coupons 
        SET used_count = used_count + 1,
            updated_at = NOW()
        WHERE id = NEW.coupon_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to revert coupon usage when payment is rejected
CREATE OR REPLACE FUNCTION revert_coupon_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If payment status changed from submitted/verified to rejected and coupon was used
    IF OLD.coupon_id IS NOT NULL 
       AND OLD.status IN ('submitted', 'verified') 
       AND NEW.status = 'rejected' THEN
        
        UPDATE coupons 
        SET used_count = GREATEST(0, used_count - 1),
            updated_at = NOW()
        WHERE id = OLD.coupon_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- ==============================================
-- 2. Create Triggers
-- ==============================================

-- Trigger to track coupon usage on payment submission
DROP TRIGGER IF EXISTS trigger_track_coupon_usage ON subscription_payments;
CREATE TRIGGER trigger_track_coupon_usage
    AFTER INSERT ON subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION track_coupon_usage();

-- Trigger to revert coupon usage on payment status changes
DROP TRIGGER IF EXISTS trigger_revert_coupon_usage ON subscription_payments;
CREATE TRIGGER trigger_revert_coupon_usage
    AFTER UPDATE ON subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION revert_coupon_usage();

-- ==============================================
-- 3. Update Coupon Validation Function
-- ==============================================

-- Enhanced coupon validation with better error messages
CREATE OR REPLACE FUNCTION validate_coupon_usage(
    p_user_id UUID,
    p_coupon_code VARCHAR(50),
    p_base_amount DECIMAL(10,2) DEFAULT 0
)
RETURNS TABLE (
    is_valid BOOLEAN,
    coupon_id UUID,
    discount_type VARCHAR(20),
    discount_value DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    message TEXT,
    description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon RECORD;
    v_discount DECIMAL(10,2);
    v_usage_count INTEGER;
BEGIN
    -- Get coupon details
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = UPPER(p_coupon_code)
    AND is_active = true;

    -- Check if coupon exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, ''::VARCHAR, 0::DECIMAL, 0::DECIMAL, 'Invalid coupon code'::TEXT, ''::TEXT;
        RETURN;
    END IF;

    -- Check expiration
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= CURRENT_TIMESTAMP THEN
        RETURN QUERY SELECT false, v_coupon.id, v_coupon.type::VARCHAR, v_coupon.value, 0::DECIMAL, 'Coupon has expired'::TEXT, v_coupon.description;
        RETURN;
    END IF;

    -- Check minimum amount
    IF v_coupon.minimum_amount IS NOT NULL AND p_base_amount > 0 AND p_base_amount < v_coupon.minimum_amount THEN
        RETURN QUERY SELECT false, v_coupon.id, v_coupon.type::VARCHAR, v_coupon.value, 0::DECIMAL, 
            CONCAT('Minimum purchase amount ৳', v_coupon.minimum_amount, ' required')::TEXT, v_coupon.description;
        RETURN;
    END IF;

    -- Check maximum usage
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
        RETURN QUERY SELECT false, v_coupon.id, v_coupon.type::VARCHAR, v_coupon.value, 0::DECIMAL, 
            'Coupon usage limit exceeded'::TEXT, v_coupon.description;
        RETURN;
    END IF;

    -- Check user-specific usage
    IF v_coupon.max_uses_per_user IS NOT NULL THEN
        SELECT COUNT(*) INTO v_usage_count
        FROM subscription_payments
        WHERE coupon_id = v_coupon.id 
        AND user_id = p_user_id
        AND status IN ('verified', 'approved');

        IF v_usage_count >= v_coupon.max_uses_per_user THEN
            RETURN QUERY SELECT false, v_coupon.id, v_coupon.type::VARCHAR, v_coupon.value, 0::DECIMAL, 
                'You have already used this coupon'::TEXT, v_coupon.description;
            RETURN;
        END IF;
    END IF;

    -- Calculate discount (basic calculation, will be recalculated on frontend)
    IF v_coupon.type = 'percentage' THEN
        v_discount = (p_base_amount * v_coupon.value / 100);
        -- Apply maximum discount if specified
        IF v_coupon.max_discount_amount IS NOT NULL THEN
            v_discount = LEAST(v_discount, v_coupon.max_discount_amount);
        END IF;
    ELSE
        v_discount = v_coupon.value;
    END IF;

    -- Ensure discount doesn't exceed base amount
    IF p_base_amount > 0 THEN
        v_discount = LEAST(v_discount, p_base_amount);
    END IF;

    RETURN QUERY SELECT true, v_coupon.id, v_coupon.type::VARCHAR, v_coupon.value, v_discount, 
        'Coupon is valid'::TEXT, COALESCE(v_coupon.description, '');
END;
$$;

-- ==============================================
-- 4. Grant Permissions
-- ==============================================
GRANT EXECUTE ON FUNCTION track_coupon_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION revert_coupon_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_coupon_usage(UUID, VARCHAR, DECIMAL) TO authenticated;

-- ==============================================
-- 5. Add Sample Test Coupons (if not exist)
-- ==============================================
INSERT INTO coupons (code, description, type, value, max_uses, max_uses_per_user, expires_at, is_active) VALUES 
('FREEPRO', 'Get Pro plan for free (100% discount)', 'percentage', 100, 10, 1, NOW() + INTERVAL '30 days', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO coupons (code, description, type, value, max_uses, max_uses_per_user, expires_at, is_active) VALUES 
('SAVE50', '৳50 off on any plan', 'fixed', 50, 100, 2, NOW() + INTERVAL '60 days', true)
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ COUPON USAGE TRACKING MIGRATION COMPLETED!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '🔄 TRIGGERS: Added coupon usage tracking';
    RAISE NOTICE '📊 FUNCTIONS: Enhanced coupon validation';
    RAISE NOTICE '🎫 COUPONS: Added FREEPRO and SAVE50 test coupons';
    RAISE NOTICE '==============================================';
END $$;