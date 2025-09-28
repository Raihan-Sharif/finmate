-- Migration: Add coupon usage increment/decrement functions
-- Date: 2025-09-28
-- Description: Add helper functions for safely updating coupon usage counts

-- Function to increment coupon usage count
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET
    used_count = used_count + 1,
    updated_at = NOW()
  WHERE id = coupon_id;
END;
$$;

-- Function to decrement coupon usage count (with safety check)
CREATE OR REPLACE FUNCTION decrement_coupon_usage(coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET
    used_count = GREATEST(used_count - 1, 0),
    updated_at = NOW()
  WHERE id = coupon_id;
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_coupon_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_coupon_usage(UUID) TO authenticated;