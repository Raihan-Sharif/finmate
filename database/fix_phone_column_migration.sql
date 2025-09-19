-- Fix phone column reference in admin_get_subscription_payments function
-- This fixes the error: column p.phone does not exist

-- Drop and recreate the function with correct phone_number reference
DROP FUNCTION IF EXISTS "public"."admin_get_subscription_payments"(uuid, text, text, integer, integer);

CREATE OR REPLACE FUNCTION "public"."admin_get_subscription_payments"(
    "p_admin_user_id" "uuid",
    "p_status" "text" DEFAULT NULL::"text",
    "p_search" "text" DEFAULT NULL::"text",
    "p_limit" integer DEFAULT 50,
    "p_offset" integer DEFAULT 0
) RETURNS TABLE(
    "id" "uuid",
    "user_id" "uuid",
    "plan_id" "uuid",
    "payment_method_id" "uuid",
    "billing_cycle" "text",
    "transaction_id" "text",
    "sender_number" "text",
    "base_amount" numeric,
    "discount_amount" numeric,
    "final_amount" numeric,
    "coupon_id" "uuid",
    "status" "text",
    "admin_notes" "text",
    "rejection_reason" "text",
    "submitted_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "currency" "text",
    "user_full_name" "text",
    "user_email" "text",
    "plan_name" "text",
    "plan_display_name" "text",
    "plan_price_monthly" numeric,
    "plan_price_yearly" numeric,
    "payment_method_name" "text",
    "payment_method_display_name" "text",
    "coupon_code" "text",
    "coupon_type" "text",
    "coupon_value" numeric,
    "user_phone" "text",
    "days_since_submission" integer,
    "subscription_status" "text"
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.user_id = p_admin_user_id
    AND r.name IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions for admin operations';
  END IF;

  -- Return comprehensive payment data with enhanced filtering
  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    sp.plan_id,
    sp.payment_method_id,
    sp.billing_cycle::text,
    sp.transaction_id,
    sp.sender_number,
    sp.base_amount,
    sp.discount_amount,
    sp.final_amount,
    sp.coupon_id,
    sp.status::text,
    sp.admin_notes,
    sp.rejection_reason,
    sp.submitted_at,
    sp.verified_at,
    sp.approved_at,
    sp.rejected_at,
    sp.created_at,
    sp.updated_at,
    COALESCE(sp.currency, 'BDT') as currency,
    -- Enhanced user data
    COALESCE(p.full_name, 'Unknown User') as user_full_name,
    COALESCE(au.email, 'unknown@example.com') as user_email,
    -- Plan data
    COALESCE(spl.plan_name, 'unknown') as plan_name,
    COALESCE(spl.display_name, 'Unknown Plan') as plan_display_name,
    COALESCE(spl.price_monthly, 0) as plan_price_monthly,
    COALESCE(spl.price_yearly, 0) as plan_price_yearly,
    -- Payment method data
    COALESCE(pm.method_name, 'manual') as payment_method_name,
    COALESCE(pm.display_name, 'Manual Payment') as payment_method_display_name,
    -- Coupon data
    c.code as coupon_code,
    c.type::text as coupon_type,
    c.value as coupon_value,
    -- Enhanced fields - FIXED: Use phone_number instead of phone
    COALESCE(p.phone_number, sp.sender_number) as user_phone,
    CASE
      WHEN sp.submitted_at IS NOT NULL THEN
        EXTRACT(DAY FROM NOW() - sp.submitted_at)::integer
      ELSE NULL
    END as days_since_submission,
    COALESCE(us.status, 'no_subscription') as subscription_status
  FROM subscription_payments sp
  -- Core joins
  LEFT JOIN profiles p ON sp.user_id = p.user_id
  LEFT JOIN auth.users au ON sp.user_id = au.id
  LEFT JOIN subscription_plans spl ON sp.plan_id = spl.id
  LEFT JOIN payment_methods pm ON sp.payment_method_id = pm.id
  LEFT JOIN coupons c ON sp.coupon_id = c.id
  LEFT JOIN user_subscriptions us ON sp.user_id = us.user_id
  WHERE
    -- Status filter
    (p_status IS NULL OR p_status = 'all' OR sp.status::text = p_status)
    AND
    -- Search filter (transaction ID, user name, email, phone)
    (p_search IS NULL OR
     sp.transaction_id ILIKE '%' || p_search || '%' OR
     p.full_name ILIKE '%' || p_search || '%' OR
     au.email ILIKE '%' || p_search || '%' OR
     sp.sender_number ILIKE '%' || p_search || '%'
    )
  ORDER BY sp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";

COMMENT ON FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) IS 'Fixed function to fetch subscription payments with correct phone_number column reference.';