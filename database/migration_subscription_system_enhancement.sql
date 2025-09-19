-- =====================================================
-- 🎯 SUBSCRIPTION SYSTEM ENHANCEMENT MIGRATION
-- =====================================================
-- Purpose: Fix duplicate functions and enhance subscription management
-- Date: 2025-01-20
-- Version: 1.0

-- =====================================================
-- 🧹 CLEANUP: Remove duplicate functions
-- =====================================================

-- Drop the old simplified function (without parameters)
DROP FUNCTION IF EXISTS "public"."admin_get_subscription_payments"();

-- Keep the comprehensive function with parameters and enhance it

-- =====================================================
-- 📊 ENHANCED SUBSCRIPTION MANAGEMENT FUNCTIONS
-- =====================================================

-- 1. 🎯 Enhanced Payment Management Function
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
    -- Enhanced fields
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

COMMENT ON FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) IS 'Enhanced comprehensive function to fetch subscription payments with advanced filtering, search, and detailed user information.';

-- 2. 🎯 Enhanced Payment Count Function
CREATE OR REPLACE FUNCTION "public"."admin_get_subscription_payments_count"(
    "p_admin_user_id" "uuid",
    "p_status" "text" DEFAULT NULL::"text",
    "p_search" "text" DEFAULT NULL::"text"
) RETURNS integer
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  payment_count INTEGER;
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

  -- Get count with search support
  SELECT COUNT(*)
  INTO payment_count
  FROM subscription_payments sp
  LEFT JOIN profiles p ON sp.user_id = p.user_id
  LEFT JOIN auth.users au ON sp.user_id = au.id
  WHERE
    (p_status IS NULL OR p_status = 'all' OR sp.status::text = p_status)
    AND
    (p_search IS NULL OR
     sp.transaction_id ILIKE '%' || p_search || '%' OR
     p.full_name ILIKE '%' || p_search || '%' OR
     au.email ILIKE '%' || p_search || '%' OR
     sp.sender_number ILIKE '%' || p_search || '%'
    );

  RETURN payment_count;
END;
$$;

COMMENT ON FUNCTION "public"."admin_get_subscription_payments_count"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text") IS 'Enhanced count function for subscription payments with search support.';

-- 3. 🎯 Payment Status Update Function
CREATE OR REPLACE FUNCTION "public"."admin_update_payment_status"(
    "p_admin_user_id" "uuid",
    "p_payment_id" "uuid",
    "p_status" "text",
    "p_admin_notes" "text" DEFAULT NULL,
    "p_rejection_reason" "text" DEFAULT NULL
) RETURNS TABLE(
    "success" boolean,
    "message" "text",
    "payment_id" "uuid",
    "new_status" "text",
    "user_id" "uuid"
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    v_payment_record RECORD;
    v_user_subscription_id UUID;
    v_plan_record RECORD;
    v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = p_admin_user_id
        AND r.name IN ('admin', 'super_admin')
    ) THEN
        RETURN QUERY SELECT false, 'Insufficient permissions'::text, NULL::uuid, NULL::text, NULL::uuid;
        RETURN;
    END IF;

    -- Get payment details
    SELECT * INTO v_payment_record
    FROM subscription_payments
    WHERE id = p_payment_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Payment not found'::text, NULL::uuid, NULL::text, NULL::uuid;
        RETURN;
    END IF;

    -- Update payment status
    UPDATE subscription_payments SET
        status = p_status::payment_status_type,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
        verified_at = CASE WHEN p_status = 'verified' THEN NOW() ELSE verified_at END,
        approved_at = CASE WHEN p_status = 'approved' THEN NOW() ELSE approved_at END,
        rejected_at = CASE WHEN p_status = 'rejected' THEN NOW() ELSE rejected_at END,
        verified_by = CASE WHEN p_status IN ('verified', 'approved', 'rejected') THEN p_admin_user_id ELSE verified_by END,
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- If approved, create or extend user subscription
    IF p_status = 'approved' THEN
        -- Get plan details
        SELECT * INTO v_plan_record FROM subscription_plans WHERE id = v_payment_record.plan_id;

        -- Calculate end date based on billing cycle
        IF v_payment_record.billing_cycle = 'monthly' THEN
            v_end_date := NOW() + INTERVAL '1 month';
        ELSE
            v_end_date := NOW() + INTERVAL '1 year';
        END IF;

        -- Create or update user subscription
        INSERT INTO user_subscriptions (user_id, plan_id, billing_cycle, payment_id, status, end_date)
        VALUES (v_payment_record.user_id, v_payment_record.plan_id, v_payment_record.billing_cycle, p_payment_id, 'active', v_end_date)
        ON CONFLICT (user_id)
        DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            billing_cycle = EXCLUDED.billing_cycle,
            payment_id = EXCLUDED.payment_id,
            status = EXCLUDED.status,
            end_date = EXCLUDED.end_date,
            updated_at = NOW()
        RETURNING id INTO v_user_subscription_id;

        -- Add to subscription history
        INSERT INTO subscription_history (user_id, plan_id, plan_name, action_type, amount_paid, payment_id, effective_date)
        VALUES (
            v_payment_record.user_id,
            v_payment_record.plan_id,
            v_plan_record.plan_name,
            CASE WHEN v_payment_record.billing_cycle = 'monthly' THEN 'monthly_subscription' ELSE 'yearly_subscription' END,
            v_payment_record.final_amount,
            p_payment_id,
            NOW()
        );
    END IF;

    RETURN QUERY SELECT
        true,
        'Payment status updated successfully'::text,
        p_payment_id,
        p_status,
        v_payment_record.user_id;
END;
$$;

COMMENT ON FUNCTION "public"."admin_update_payment_status"("p_admin_user_id" "uuid", "p_payment_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_rejection_reason" "text") IS 'Update payment status and automatically manage user subscriptions on approval.';

-- 4. 🎯 Subscription Analytics Function
CREATE OR REPLACE FUNCTION "public"."admin_get_subscription_analytics"(
    "p_admin_user_id" "uuid"
) RETURNS TABLE(
    "total_revenue" numeric,
    "monthly_revenue" numeric,
    "yearly_revenue" numeric,
    "pending_payments" integer,
    "approved_payments_today" integer,
    "active_subscriptions" integer,
    "expired_subscriptions" integer,
    "plan_stats" jsonb,
    "monthly_growth" jsonb
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    v_plan_stats JSONB;
    v_monthly_growth JSONB;
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

    -- Calculate plan statistics
    SELECT jsonb_agg(
        jsonb_build_object(
            'plan_name', spl.display_name,
            'plan_id', spl.id,
            'total_revenue', COALESCE(stats.total_revenue, 0),
            'subscriber_count', COALESCE(stats.subscriber_count, 0),
            'avg_revenue_per_user', COALESCE(stats.avg_revenue, 0)
        )
    ) INTO v_plan_stats
    FROM subscription_plans spl
    LEFT JOIN (
        SELECT
            sp.plan_id,
            SUM(sp.final_amount) as total_revenue,
            COUNT(DISTINCT sp.user_id) as subscriber_count,
            AVG(sp.final_amount) as avg_revenue
        FROM subscription_payments sp
        WHERE sp.status = 'approved'
        GROUP BY sp.plan_id
    ) stats ON spl.id = stats.plan_id
    WHERE spl.is_active = true;

    -- Calculate monthly growth
    SELECT jsonb_build_object(
        'current_month', COALESCE(current_month.revenue, 0),
        'previous_month', COALESCE(previous_month.revenue, 0),
        'growth_percentage',
        CASE
            WHEN COALESCE(previous_month.revenue, 0) > 0 THEN
                ROUND(((COALESCE(current_month.revenue, 0) - COALESCE(previous_month.revenue, 0)) / previous_month.revenue * 100)::numeric, 2)
            ELSE 0
        END
    ) INTO v_monthly_growth
    FROM (
        SELECT SUM(final_amount) as revenue
        FROM subscription_payments
        WHERE status = 'approved'
        AND DATE_TRUNC('month', approved_at) = DATE_TRUNC('month', CURRENT_DATE)
    ) current_month
    CROSS JOIN (
        SELECT SUM(final_amount) as revenue
        FROM subscription_payments
        WHERE status = 'approved'
        AND DATE_TRUNC('month', approved_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    ) previous_month;

    -- Return comprehensive analytics
    RETURN QUERY
    SELECT
        -- Total revenue
        COALESCE((SELECT SUM(final_amount) FROM subscription_payments WHERE status = 'approved'), 0) as total_revenue,

        -- Monthly revenue
        COALESCE((
            SELECT SUM(final_amount)
            FROM subscription_payments
            WHERE status = 'approved'
            AND billing_cycle = 'monthly'
        ), 0) as monthly_revenue,

        -- Yearly revenue
        COALESCE((
            SELECT SUM(final_amount)
            FROM subscription_payments
            WHERE status = 'approved'
            AND billing_cycle = 'yearly'
        ), 0) as yearly_revenue,

        -- Pending payments
        (SELECT COUNT(*) FROM subscription_payments WHERE status IN ('pending', 'submitted', 'verified'))::integer as pending_payments,

        -- Approved today
        (SELECT COUNT(*) FROM subscription_payments WHERE status = 'approved' AND DATE(approved_at) = CURRENT_DATE)::integer as approved_payments_today,

        -- Active subscriptions
        (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active' AND end_date > NOW())::integer as active_subscriptions,

        -- Expired subscriptions
        (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active' AND end_date <= NOW())::integer as expired_subscriptions,

        -- Plan statistics
        v_plan_stats as plan_stats,

        -- Monthly growth
        v_monthly_growth as monthly_growth;
END;
$$;

COMMENT ON FUNCTION "public"."admin_get_subscription_analytics"("p_admin_user_id" "uuid") IS 'Comprehensive subscription analytics for admin dashboard.';

-- 5. 🎯 User Subscription Management Function
CREATE OR REPLACE FUNCTION "public"."admin_manage_user_subscription"(
    "p_admin_user_id" "uuid",
    "p_user_id" "uuid",
    "p_action" "text", -- 'activate', 'suspend', 'cancel', 'extend'
    "p_plan_id" "uuid" DEFAULT NULL,
    "p_extend_months" integer DEFAULT NULL
) RETURNS TABLE(
    "success" boolean,
    "message" "text",
    "subscription_status" "text",
    "end_date" timestamp with time zone
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    v_subscription_record RECORD;
    v_new_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Verify admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = p_admin_user_id
        AND r.name IN ('admin', 'super_admin')
    ) THEN
        RETURN QUERY SELECT false, 'Insufficient permissions'::text, NULL::text, NULL::timestamp with time zone;
        RETURN;
    END IF;

    -- Get current subscription
    SELECT * INTO v_subscription_record
    FROM user_subscriptions
    WHERE user_id = p_user_id;

    CASE p_action
        WHEN 'suspend' THEN
            UPDATE user_subscriptions SET status = 'suspended', updated_at = NOW() WHERE user_id = p_user_id;
            INSERT INTO subscription_history (user_id, plan_id, plan_name, action_type, effective_date)
            VALUES (p_user_id, v_subscription_record.plan_id, 'suspended', 'suspension', NOW());

        WHEN 'cancel' THEN
            UPDATE user_subscriptions SET status = 'cancelled', updated_at = NOW() WHERE user_id = p_user_id;
            INSERT INTO subscription_history (user_id, plan_id, plan_name, action_type, effective_date)
            VALUES (p_user_id, v_subscription_record.plan_id, 'cancelled', 'cancellation', NOW());

        WHEN 'activate' THEN
            UPDATE user_subscriptions SET status = 'active', updated_at = NOW() WHERE user_id = p_user_id;
            INSERT INTO subscription_history (user_id, plan_id, plan_name, action_type, effective_date)
            VALUES (p_user_id, v_subscription_record.plan_id, 'activated', 'activation', NOW());

        WHEN 'extend' THEN
            v_new_end_date := COALESCE(v_subscription_record.end_date, NOW()) + (p_extend_months || ' months')::INTERVAL;
            UPDATE user_subscriptions SET
                end_date = v_new_end_date,
                status = 'active',
                updated_at = NOW()
            WHERE user_id = p_user_id;
            INSERT INTO subscription_history (user_id, plan_id, plan_name, action_type, effective_date)
            VALUES (p_user_id, v_subscription_record.plan_id, 'extended', 'extension', NOW());
    END CASE;

    -- Get updated subscription info
    SELECT * INTO v_subscription_record
    FROM user_subscriptions
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT
        true,
        'Subscription ' || p_action || ' completed successfully'::text,
        v_subscription_record.status,
        v_subscription_record.end_date;
END;
$$;

COMMENT ON FUNCTION "public"."admin_manage_user_subscription"("p_admin_user_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_plan_id" "uuid", "p_extend_months" integer) IS 'Comprehensive user subscription management for admins.';

-- =====================================================
-- 🔐 GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for enhanced functions
GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments_count"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments_count"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."admin_update_payment_status"("p_admin_user_id" "uuid", "p_payment_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_rejection_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_payment_status"("p_admin_user_id" "uuid", "p_payment_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_rejection_reason" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."admin_get_subscription_analytics"("p_admin_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_analytics"("p_admin_user_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."admin_manage_user_subscription"("p_admin_user_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_plan_id" "uuid", "p_extend_months" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_manage_user_subscription"("p_admin_user_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_plan_id" "uuid", "p_extend_months" integer) TO "service_role";

-- =====================================================
-- ✅ MIGRATION COMPLETE
-- =====================================================

COMMENT ON SCHEMA "public" IS 'Enhanced subscription system with comprehensive admin management functions - Migration completed successfully';