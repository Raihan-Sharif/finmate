

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'Foreign key relationships fixed for subscription system - PostgREST joins should now work properly';



CREATE TYPE "public"."account_type" AS ENUM (
    'bank',
    'credit_card',
    'wallet',
    'investment',
    'savings',
    'other',
    'cash'
);


ALTER TYPE "public"."account_type" OWNER TO "postgres";


CREATE TYPE "public"."audit_action" AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'role_change'
);


ALTER TYPE "public"."audit_action" OWNER TO "postgres";


CREATE TYPE "public"."balance_type" AS ENUM (
    'debit',
    'credit'
);


ALTER TYPE "public"."balance_type" OWNER TO "postgres";


CREATE TYPE "public"."billing_cycle_type" AS ENUM (
    'monthly',
    'yearly'
);


ALTER TYPE "public"."billing_cycle_type" OWNER TO "postgres";


CREATE TYPE "public"."budget_period" AS ENUM (
    'weekly',
    'monthly',
    'quarterly',
    'yearly'
);


ALTER TYPE "public"."budget_period" OWNER TO "postgres";


CREATE TYPE "public"."coupon_scope" AS ENUM (
    'public',
    'private',
    'user_specific'
);


ALTER TYPE "public"."coupon_scope" OWNER TO "postgres";


CREATE TYPE "public"."coupon_type" AS ENUM (
    'percentage',
    'fixed'
);


ALTER TYPE "public"."coupon_type" OWNER TO "postgres";


CREATE TYPE "public"."family_role_type" AS ENUM (
    'primary',
    'spouse',
    'child',
    'member'
);


ALTER TYPE "public"."family_role_type" OWNER TO "postgres";


CREATE TYPE "public"."investment_frequency" AS ENUM (
    'daily',
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'yearly'
);


ALTER TYPE "public"."investment_frequency" OWNER TO "postgres";


CREATE TYPE "public"."investment_status" AS ENUM (
    'active',
    'matured',
    'sold',
    'paused',
    'closed'
);


ALTER TYPE "public"."investment_status" OWNER TO "postgres";


CREATE TYPE "public"."investment_type" AS ENUM (
    'stock',
    'mutual_fund',
    'crypto',
    'bond',
    'fd',
    'other',
    'sip',
    'dps',
    'shanchay_potro',
    'recurring_fd',
    'gold',
    'real_estate',
    'pf',
    'pension'
);


ALTER TYPE "public"."investment_type" OWNER TO "postgres";


CREATE TYPE "public"."item_condition" AS ENUM (
    'new',
    'refurbished',
    'used'
);


ALTER TYPE "public"."item_condition" OWNER TO "postgres";


CREATE TYPE "public"."lending_status" AS ENUM (
    'pending',
    'partial',
    'paid',
    'overdue'
);


ALTER TYPE "public"."lending_status" OWNER TO "postgres";


CREATE TYPE "public"."lending_type" AS ENUM (
    'lent',
    'borrowed'
);


ALTER TYPE "public"."lending_type" OWNER TO "postgres";


CREATE TYPE "public"."loan_status" AS ENUM (
    'active',
    'closed',
    'defaulted'
);


ALTER TYPE "public"."loan_status" OWNER TO "postgres";


CREATE TYPE "public"."loan_type" AS ENUM (
    'personal',
    'home',
    'car',
    'education',
    'business',
    'other',
    'purchase_emi',
    'credit_card'
);


ALTER TYPE "public"."loan_type" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'info',
    'warning',
    'error',
    'success'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'submitted',
    'verified',
    'approved',
    'rejected',
    'expired'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status_type" AS ENUM (
    'pending',
    'submitted',
    'verified',
    'approved',
    'rejected',
    'expired'
);


ALTER TYPE "public"."payment_status_type" OWNER TO "postgres";


CREATE TYPE "public"."permission_action" AS ENUM (
    'create',
    'read',
    'update',
    'delete',
    'manage'
);


ALTER TYPE "public"."permission_action" OWNER TO "postgres";


CREATE TYPE "public"."purchase_emi_category" AS ENUM (
    'electronics',
    'furniture',
    'appliances',
    'jewelry',
    'gadgets',
    'clothing',
    'sports',
    'travel',
    'other'
);


ALTER TYPE "public"."purchase_emi_category" OWNER TO "postgres";


CREATE TYPE "public"."subscription_plan_type" AS ENUM (
    'free',
    'pro',
    'max'
);


ALTER TYPE "public"."subscription_plan_type" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status_type" AS ENUM (
    'active',
    'canceled',
    'expired',
    'pending'
);


ALTER TYPE "public"."subscription_status_type" OWNER TO "postgres";


CREATE TYPE "public"."theme_type" AS ENUM (
    'light',
    'dark',
    'system'
);


ALTER TYPE "public"."theme_type" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'income',
    'expense',
    'transfer',
    'investment_buy',
    'investment_sell',
    'investment_dividend',
    'investment_return'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'super_admin',
    'admin',
    'paid_user',
    'user'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_family_invitation"("p_user_id" "uuid", "p_invitation_code" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    invitation_record family_invitations%ROWTYPE;
    user_email TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email
    FROM profiles 
    WHERE user_id = p_user_id;
    
    -- Get invitation
    SELECT * INTO invitation_record
    FROM family_invitations 
    WHERE invitation_code = p_invitation_code 
    AND email = user_email
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update user profile
    UPDATE profiles 
    SET family_group_id = invitation_record.family_group_id,
        family_role = invitation_record.role,
        invited_by = invitation_record.invited_by,
        joined_family_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Update invitation status
    UPDATE family_invitations 
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Update family group member count
    UPDATE family_groups 
    SET current_members = current_members + 1
    WHERE id = invitation_record.family_group_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."accept_family_invitation"("p_user_id" "uuid", "p_invitation_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_create_coupon"("p_code" character varying, "p_description" "text", "p_type" "text", "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" "text", "p_is_active" boolean DEFAULT true) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."admin_create_coupon"("p_code" character varying, "p_description" "text", "p_type" "text", "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" "text", "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_create_coupon"("p_code" character varying, "p_description" "text", "p_type" character varying, "p_value" numeric, "p_max_uses" integer DEFAULT NULL::integer, "p_max_uses_per_user" integer DEFAULT NULL::integer, "p_minimum_amount" numeric DEFAULT NULL::numeric, "p_max_discount_amount" numeric DEFAULT NULL::numeric, "p_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_scope" character varying DEFAULT 'public'::character varying, "p_is_active" boolean DEFAULT true) RETURNS TABLE("id" "uuid", "code" character varying, "description" "text", "type" character varying, "value" numeric, "max_uses" integer, "max_uses_per_user" integer, "used_count" integer, "minimum_amount" numeric, "max_discount_amount" numeric, "expires_at" timestamp with time zone, "is_active" boolean, "scope" character varying, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."admin_create_coupon"("p_code" character varying, "p_description" "text", "p_type" character varying, "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" character varying, "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_delete_coupon"("p_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM coupons WHERE id = p_id;
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."admin_delete_coupon"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_all_coupons"() RETURNS TABLE("id" "uuid", "code" character varying, "description" "text", "type" "text", "value" numeric, "max_uses" integer, "max_uses_per_user" integer, "minimum_amount" numeric, "max_discount_amount" numeric, "expires_at" timestamp with time zone, "is_active" boolean, "scope" "text", "usage_count" bigint, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."admin_get_all_coupons"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_subscription_analytics"("p_admin_user_id" "uuid") RETURNS TABLE("total_revenue" numeric, "monthly_revenue" numeric, "yearly_revenue" numeric, "pending_payments" integer, "approved_payments_today" integer, "active_subscriptions" integer, "expired_subscriptions" integer, "plan_stats" "jsonb", "monthly_growth" "jsonb")
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


ALTER FUNCTION "public"."admin_get_subscription_analytics"("p_admin_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_get_subscription_analytics"("p_admin_user_id" "uuid") IS 'Comprehensive subscription analytics for admin dashboard.';



CREATE OR REPLACE FUNCTION "public"."admin_get_subscription_overview"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."admin_get_subscription_overview"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text" DEFAULT NULL::"text", "p_search" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "user_id" "uuid", "plan_id" "uuid", "payment_method_id" "uuid", "billing_cycle" "text", "transaction_id" character varying, "sender_number" character varying, "base_amount" numeric, "discount_amount" numeric, "final_amount" numeric, "coupon_id" "uuid", "status" "text", "admin_notes" "text", "rejection_reason" "text", "submitted_at" timestamp with time zone, "verified_at" timestamp with time zone, "approved_at" timestamp with time zone, "rejected_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "currency" character varying, "user_full_name" "text", "user_email" "text", "plan_name" character varying, "plan_display_name" character varying, "plan_price_monthly" numeric, "plan_price_yearly" numeric, "payment_method_name" character varying, "payment_method_display_name" character varying, "coupon_code" "text", "coupon_type" "text", "coupon_value" numeric, "user_phone" "text", "days_since_submission" integer, "subscription_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Verify admin permissions using profiles table only (avoid auth.users access issues)
  IF NOT EXISTS (
    SELECT 1
    FROM profiles p
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
    sp.currency,
    -- Enhanced user data (avoid auth.users to prevent permission issues)
    COALESCE(p.full_name, 'Unknown User') as user_full_name,
    COALESCE(p.email, 'unknown@example.com') as user_email,
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
     p.email ILIKE '%' || p_search || '%' OR
     sp.sender_number ILIKE '%' || p_search || '%'
    )
  ORDER BY sp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) IS 'Fixed admin subscription payments function - Removed auth.users dependency to avoid permission issues';



CREATE OR REPLACE FUNCTION "public"."admin_get_subscription_payments_count"("p_admin_user_id" "uuid", "p_status" "text" DEFAULT NULL::"text", "p_search" "text" DEFAULT NULL::"text") RETURNS integer
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


ALTER FUNCTION "public"."admin_get_subscription_payments_count"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_get_subscription_payments_count"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text") IS 'Enhanced count function for subscription payments with search support.';



CREATE OR REPLACE FUNCTION "public"."admin_manage_user_subscription"("p_admin_user_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_plan_id" "uuid" DEFAULT NULL::"uuid", "p_extend_months" integer DEFAULT NULL::integer) RETURNS TABLE("success" boolean, "message" "text", "subscription_status" "text", "end_date" timestamp with time zone)
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


ALTER FUNCTION "public"."admin_manage_user_subscription"("p_admin_user_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_plan_id" "uuid", "p_extend_months" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_manage_user_subscription"("p_admin_user_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_plan_id" "uuid", "p_extend_months" integer) IS 'Comprehensive user subscription management for admins.';



CREATE OR REPLACE FUNCTION "public"."admin_toggle_coupon_status"("p_coupon_id" "uuid", "p_is_active" boolean) RETURNS TABLE("id" "uuid", "code" character varying, "is_active" boolean, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."admin_toggle_coupon_status"("p_coupon_id" "uuid", "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_coupon"("p_id" "uuid", "p_description" "text", "p_type" "text", "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" "text", "p_is_active" boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."admin_update_coupon"("p_id" "uuid", "p_description" "text", "p_type" "text", "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" "text", "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_coupon"("p_coupon_id" "uuid", "p_description" "text" DEFAULT NULL::"text", "p_type" character varying DEFAULT NULL::character varying, "p_value" numeric DEFAULT NULL::numeric, "p_max_uses" integer DEFAULT NULL::integer, "p_max_uses_per_user" integer DEFAULT NULL::integer, "p_minimum_amount" numeric DEFAULT NULL::numeric, "p_max_discount_amount" numeric DEFAULT NULL::numeric, "p_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_scope" character varying DEFAULT NULL::character varying, "p_is_active" boolean DEFAULT NULL::boolean) RETURNS TABLE("id" "uuid", "code" character varying, "description" "text", "type" character varying, "value" numeric, "max_uses" integer, "max_uses_per_user" integer, "used_count" integer, "minimum_amount" numeric, "max_discount_amount" numeric, "expires_at" timestamp with time zone, "is_active" boolean, "scope" character varying, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."admin_update_coupon"("p_coupon_id" "uuid", "p_description" "text", "p_type" character varying, "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" character varying, "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_payment_status"("p_admin_user_id" "uuid", "p_payment_id" "uuid", "p_status" "text", "p_admin_notes" "text" DEFAULT NULL::"text", "p_rejection_reason" "text" DEFAULT NULL::"text") RETURNS TABLE("success" boolean, "message" "text", "payment_id" "uuid", "new_status" "text", "user_id" "uuid")
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


ALTER FUNCTION "public"."admin_update_payment_status"("p_admin_user_id" "uuid", "p_payment_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_rejection_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_payment_status"("p_admin_user_id" "uuid", "p_payment_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_rejection_reason" "text") IS 'Update payment status and automatically manage user subscriptions on approval.';



CREATE OR REPLACE FUNCTION "public"."apply_coupon"("p_user_id" "uuid", "p_coupon_code" character varying, "p_plan_name" character varying, "p_billing_cycle" character varying, "p_base_amount" numeric) RETURNS TABLE("is_valid" boolean, "coupon_id" "uuid", "discount_amount" numeric, "coupon_type" character varying, "coupon_value" numeric, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, ''::VARCHAR, 0::DECIMAL, 'Invalid coupon code'::TEXT;
        RETURN;
    END IF;

    -- Check expiration
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= CURRENT_TIMESTAMP THEN
        RETURN QUERY SELECT false, v_coupon.id, 0::DECIMAL, v_coupon.type::VARCHAR, v_coupon.value, 'Coupon has expired'::TEXT;
        RETURN;
    END IF;

    -- Check minimum amount
    IF v_coupon.minimum_amount IS NOT NULL AND p_base_amount < v_coupon.minimum_amount THEN
        RETURN QUERY SELECT false, v_coupon.id, 0::DECIMAL, v_coupon.type::VARCHAR, v_coupon.value, 
            'Minimum purchase amount not met'::TEXT;
        RETURN;
    END IF;

    -- Check maximum usage
    IF v_coupon.max_uses IS NOT NULL THEN
        SELECT COUNT(*) INTO v_usage_count
        FROM subscription_payments
        WHERE coupon_id = v_coupon.id 
        AND status IN ('verified', 'approved');

        IF v_usage_count >= v_coupon.max_uses THEN
            RETURN QUERY SELECT false, v_coupon.id, 0::DECIMAL, v_coupon.type::VARCHAR, v_coupon.value, 
                'Coupon usage limit exceeded'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Check user-specific usage
    IF v_coupon.max_uses_per_user IS NOT NULL THEN
        SELECT COUNT(*) INTO v_usage_count
        FROM subscription_payments
        WHERE coupon_id = v_coupon.id 
        AND user_id = p_user_id
        AND status IN ('verified', 'approved');

        IF v_usage_count >= v_coupon.max_uses_per_user THEN
            RETURN QUERY SELECT false, v_coupon.id, 0::DECIMAL, v_coupon.type::VARCHAR, v_coupon.value, 
                'You have already used this coupon'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Check applicable plans
    IF v_coupon.applicable_plans IS NOT NULL AND 
       NOT (v_coupon.applicable_plans @> to_jsonb(p_plan_name)) THEN
        RETURN QUERY SELECT false, v_coupon.id, 0::DECIMAL, v_coupon.type::VARCHAR, v_coupon.value, 
            'Coupon not applicable to this plan'::TEXT;
        RETURN;
    END IF;

    -- Check billing cycle restriction
    IF v_coupon.billing_cycle_restriction IS NOT NULL AND 
       v_coupon.billing_cycle_restriction != p_billing_cycle THEN
        RETURN QUERY SELECT false, v_coupon.id, 0::DECIMAL, v_coupon.type::VARCHAR, v_coupon.value, 
            CONCAT('Coupon only valid for ', v_coupon.billing_cycle_restriction, ' billing')::TEXT;
        RETURN;
    END IF;

    -- Calculate discount
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
    v_discount = LEAST(v_discount, p_base_amount);

    RETURN QUERY SELECT true, v_coupon.id, v_discount, v_coupon.type::VARCHAR, v_coupon.value, 
        'Coupon applied successfully'::TEXT;
END;
$$;


ALTER FUNCTION "public"."apply_coupon"("p_user_id" "uuid", "p_coupon_code" character varying, "p_plan_name" character varying, "p_billing_cycle" character varying, "p_base_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_next_execution_date"("base_date" "date", "frequency" character varying, "interval_value" integer DEFAULT 1) RETURNS "date"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN CASE 
        WHEN frequency = 'weekly' THEN base_date + (interval_value * INTERVAL '7 days')
        WHEN frequency = 'biweekly' THEN base_date + (interval_value * INTERVAL '14 days')
        WHEN frequency = 'monthly' THEN base_date + (interval_value * INTERVAL '1 month')
        WHEN frequency = 'quarterly' THEN base_date + (interval_value * INTERVAL '3 months')
        WHEN frequency = 'yearly' THEN base_date + (interval_value * INTERVAL '1 year')
        ELSE base_date + INTERVAL '1 month'
    END;
END;
$$;


ALTER FUNCTION "public"."calculate_next_execution_date"("base_date" "date", "frequency" character varying, "interval_value" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_create_account"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    user_plan TEXT;
BEGIN
    -- Get user plan
    SELECT subscription_plan INTO user_plan
    FROM profiles 
    WHERE user_id = p_user_id;
    
    -- Get max allowed accounts
    max_allowed := get_account_limit(COALESCE(user_plan, 'free'));
    
    -- For Max plan (family), count family-wide accounts
    IF user_plan = 'max' THEN
        current_count := get_family_account_count(p_user_id);
    ELSE
        -- For Free/Pro plans, count only user's accounts
        SELECT COUNT(*) INTO current_count
        FROM accounts 
        WHERE user_id = p_user_id AND is_active = true;
    END IF;
    
    RETURN current_count < max_allowed;
END;
$$;


ALTER FUNCTION "public"."can_create_account"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_create_account_type"("p_user_id" "uuid", "p_account_type" "public"."account_type") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_plan TEXT;
    allowed_types TEXT[];
BEGIN
    -- Get user plan
    SELECT subscription_plan INTO user_plan
    FROM profiles 
    WHERE user_id = p_user_id;
    
    -- Get allowed account types
    allowed_types := get_allowed_account_types(COALESCE(user_plan, 'free'));
    
    RETURN p_account_type::TEXT = ANY(allowed_types);
END;
$$;


ALTER FUNCTION "public"."can_create_account_type"("p_user_id" "uuid", "p_account_type" "public"."account_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_auto_payment_health"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_failed_jobs INTEGER;
  v_overdue_loans INTEGER;
  v_last_run TIMESTAMP;
  v_health_status VARCHAR(20) := 'healthy';
  v_issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check for failed jobs in last 24 hours
  SELECT COUNT(*) INTO v_failed_jobs
  FROM cron_job_logs
  WHERE job_name = 'daily_auto_payments'
    AND status = 'failed'
    AND started_at > NOW() - INTERVAL '24 hours';
  
  -- Check for overdue loans (payments missed)
  SELECT COUNT(*) INTO v_overdue_loans
  FROM loans
  WHERE status = 'active'
    AND next_due_date < CURRENT_DATE - INTERVAL '1 day';
  
  -- Check last successful run
  SELECT MAX(started_at) INTO v_last_run
  FROM cron_job_logs
  WHERE job_name = 'daily_auto_payments'
    AND status IN ('completed', 'completed_with_errors');
  
  -- Evaluate health
  IF v_failed_jobs > 0 THEN
    v_health_status := 'critical';
    v_issues := array_append(v_issues, v_failed_jobs || ' failed job executions in last 24 hours');
  END IF;
  
  IF v_overdue_loans > 5 THEN
    v_health_status := 'warning';
    v_issues := array_append(v_issues, v_overdue_loans || ' loans are overdue');
  END IF;
  
  IF v_last_run IS NULL OR v_last_run < NOW() - INTERVAL '25 hours' THEN
    v_health_status := 'critical';
    v_issues := array_append(v_issues, 'No successful job execution in last 25 hours');
  END IF;
  
  -- Log health check
  INSERT INTO cron_job_logs (
    job_name,
    status,
    message,
    metadata,
    started_at,
    completed_at,
    duration_seconds
  ) VALUES (
    'health_check',
    v_health_status,
    CASE 
      WHEN v_health_status = 'healthy' THEN 'System is healthy'
      ELSE array_to_string(v_issues, '; ')
    END,
    json_build_object(
      'failed_jobs_24h', v_failed_jobs,
      'overdue_loans', v_overdue_loans,
      'last_successful_run', v_last_run,
      'issues', v_issues
    ),
    NOW(),
    NOW(),
    0
  );
  
  RETURN json_build_object(
    'status', v_health_status,
    'failed_jobs_24h', v_failed_jobs,
    'overdue_loans', v_overdue_loans,
    'last_successful_run', v_last_run,
    'issues', v_issues
  );
END;
$$;


ALTER FUNCTION "public"."check_auto_payment_health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_ai_insights"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_insights 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_ai_insights"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_cron_logs"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM cron_job_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  INSERT INTO cron_job_logs (
    job_name,
    status,
    message,
    started_at,
    completed_at,
    duration_seconds
  ) VALUES (
    'cleanup_old_logs',
    'completed',
    'Cleaned up ' || v_deleted_count || ' old log entries',
    NOW(),
    NOW(),
    0
  );
  
  RETURN v_deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_cron_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_better_default_accounts"("user_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Delete existing default accounts to replace with better ones
    DELETE FROM public.accounts 
    WHERE user_id = user_id_param 
    AND name = 'Main Account';
    
    -- Create better default accounts
    INSERT INTO public.accounts (user_id, name, type, balance, currency, description) VALUES
    (user_id_param, 'Salary Account', 'bank', 0.00, 'USD', 'Main salary receiving account'),
    (user_id_param, 'Savings Account', 'savings', 0.00, 'USD', 'Personal savings account'),
    (user_id_param, 'bKash', 'wallet', 0.00, 'BDT', 'Mobile financial service'),
    (user_id_param, 'Nagad', 'wallet', 0.00, 'BDT', 'Mobile financial service'),
    (user_id_param, 'Credit Card', 'credit_card', 0.00, 'USD', 'Credit card account'),
    (user_id_param, 'Cash', 'other', 0.00, 'USD', 'Physical cash')
    ON CONFLICT (user_id, name) DO NOTHING;
    
    RAISE NOTICE 'Created better default accounts for user: %', user_id_param;
END;
$$;


ALTER FUNCTION "public"."create_better_default_accounts"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_accounts"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_currency VARCHAR(3);
    user_plan TEXT;
BEGIN
    -- Get user's currency and plan
    SELECT currency, subscription_plan INTO user_currency, user_plan
    FROM profiles WHERE user_id = p_user_id;
    
    -- Set default currency if null
    IF user_currency IS NULL THEN
        user_currency := 'BDT';
    END IF;
    
    -- Set default plan if null
    IF user_plan IS NULL THEN
        user_plan := 'free';
    END IF;

    -- Create Cash Wallet (default account)
    INSERT INTO accounts (user_id, name, description, type, currency, balance, is_default, display_order, icon, color, is_active)
    VALUES (p_user_id, 'Cash Wallet', 'Primary cash wallet for daily expenses', 'cash', user_currency, 0, true, 1, 'wallet', '#10B981', true);
    
    -- Create Primary Bank Account
    INSERT INTO accounts (user_id, name, description, type, currency, balance, is_default, display_order, icon, color, is_active)
    VALUES (p_user_id, 'Primary Bank', 'Main bank account', 'bank', user_currency, 0, false, 2, 'building-2', '#3B82F6', true);
    
    -- Create Savings Account for Pro and Premium users
    IF user_plan IN ('pro', 'premium') THEN
        INSERT INTO accounts (user_id, name, description, type, currency, balance, is_default, display_order, icon, color, is_active)
        VALUES (p_user_id, 'Savings Account', 'Long-term savings account', 'savings', user_currency, 0, false, 3, 'piggy-bank', '#8B5CF6', true);
    END IF;
END;
$$;


ALTER FUNCTION "public"."create_default_accounts"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_emi_schedule_entries"("p_loan_id" "uuid", "p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    schedule_record RECORD;
    entries_created INTEGER := 0;
BEGIN
    -- Delete existing schedule entries for this loan
    DELETE FROM emi_schedules WHERE loan_id = p_loan_id AND user_id = p_user_id;
    
    -- Create new schedule entries
    FOR schedule_record IN 
        SELECT * FROM generate_emi_schedule(p_loan_id, p_user_id)
    LOOP
        INSERT INTO emi_schedules (
            user_id,
            loan_id,
            installment_number,
            due_date,
            emi_amount,
            principal_amount,
            interest_amount,
            outstanding_balance
        ) VALUES (
            p_user_id,
            p_loan_id,
            schedule_record.installment_number,
            schedule_record.due_date,
            schedule_record.emi_amount,
            schedule_record.principal_amount,
            schedule_record.interest_amount,
            schedule_record.outstanding_balance
        );
        
        entries_created := entries_created + 1;
    END LOOP;
    
    RETURN entries_created;
END;
$$;


ALTER FUNCTION "public"."create_emi_schedule_entries"("p_loan_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_family_group"("p_user_id" "uuid", "p_family_name" character varying DEFAULT 'My Family'::character varying) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    family_id UUID;
BEGIN
    -- Create family group
    INSERT INTO family_groups (created_by, name, max_members, current_members)
    VALUES (p_user_id, p_family_name, 4, 1)
    RETURNING id INTO family_id;
    
    -- Update user's profile to be primary in this family
    UPDATE profiles 
    SET family_group_id = family_id,
        family_role = 'primary',
        joined_family_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN family_id;
END;
$$;


ALTER FUNCTION "public"."create_family_group"("p_user_id" "uuid", "p_family_name" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_global_accounts"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if global accounts already exist
    IF EXISTS (SELECT 1 FROM public.accounts WHERE user_id IS NULL LIMIT 1) THEN
        RAISE NOTICE 'Global accounts already exist, skipping creation';
        RETURN;
    END IF;

    RAISE NOTICE 'Creating global default accounts...';

    -- Create global default accounts (user_id = NULL)
    INSERT INTO public.accounts (user_id, name, type, balance, currency, description, icon, color, include_in_total) VALUES
    (NULL, 'Cash', 'other', 0.00, 'BDT', 'Physical cash wallet', 'wallet', '#6B7280', true),
    (NULL, 'Bank Account', 'bank', 0.00, 'BDT', 'General bank account', 'landmark', '#3B82F6', true),
    (NULL, 'Savings Account', 'savings', 0.00, 'BDT', 'Savings account', 'piggy-bank', '#10B981', true),
    (NULL, 'Credit Card', 'credit_card', 0.00, 'BDT', 'Credit card account', 'credit-card', '#EF4444', true),
    (NULL, 'bKash', 'wallet', 0.00, 'BDT', 'Mobile financial service', 'smartphone', '#E11D48', true),
    (NULL, 'Nagad', 'wallet', 0.00, 'BDT', 'Mobile financial service', 'smartphone', '#F97316', true),
    (NULL, 'Rocket', 'wallet', 0.00, 'BDT', 'Mobile financial service', 'smartphone', '#8B5CF6', true),
    (NULL, 'Investment Account', 'investment', 0.00, 'BDT', 'Investment portfolio', 'trending-up', '#8B5CF6', false);

    RAISE NOTICE 'Global accounts created successfully!';
END;
$$;


ALTER FUNCTION "public"."create_global_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_global_categories"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    -- Main category variables - Income
    salary_id UUID;
    freelance_id UUID;
    investment_id UUID;
    gifts_id UUID;
    rental_income_id UUID;
    
    -- Main category variables - Expense
    accommodation_id UUID;
    utility_bills_id UUID;
    food_dining_id UUID;
    transportation_id UUID;
    shopping_id UUID;
    entertainment_id UUID;
    healthcare_id UUID;
    education_id UUID;
    travel_id UUID;
    personal_care_id UUID;
    financial_services_id UUID;
    household_maintenance_id UUID;
    family_childcare_id UUID;
    insurance_id UUID;
    taxes_fees_id UUID;
BEGIN
    -- Check if global categories already exist
    IF EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN
        RAISE NOTICE 'Global categories already exist, skipping creation';
        RETURN;
    END IF;

    RAISE NOTICE 'Creating global categories...';

    -- Insert main income categories (no user_id since global)
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Salary', 'briefcase', '#10B981', 'income', 1) RETURNING id INTO salary_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Freelance & Business', 'laptop', '#3B82F6', 'income', 2) RETURNING id INTO freelance_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Investment Returns', 'trending-up', '#8B5CF6', 'income', 3) RETURNING id INTO investment_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Rental Income', 'home', '#84CC16', 'income', 4) RETURNING id INTO rental_income_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Gifts & Others', 'gift', '#F59E0B', 'income', 5) RETURNING id INTO gifts_id;

    -- Insert main expense categories
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Accommodation', 'home', '#EF4444', 'expense', 1) RETURNING id INTO accommodation_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Utility Bills', 'zap', '#F97316', 'expense', 2) RETURNING id INTO utility_bills_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Food & Dining', 'utensils', '#10B981', 'expense', 3) RETURNING id INTO food_dining_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Transportation', 'car', '#3B82F6', 'expense', 4) RETURNING id INTO transportation_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Healthcare', 'heart', '#EC4899', 'expense', 5) RETURNING id INTO healthcare_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Education', 'book-open', '#06B6D4', 'expense', 6) RETURNING id INTO education_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Financial Services', 'banknote', '#8B5CF6', 'expense', 7) RETURNING id INTO financial_services_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Insurance', 'shield', '#84CC16', 'expense', 8) RETURNING id INTO insurance_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Family & Childcare', 'baby', '#F59E0B', 'expense', 9) RETURNING id INTO family_childcare_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Shopping', 'shopping-bag', '#A855F7', 'expense', 10) RETURNING id INTO shopping_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Entertainment', 'film', '#14B8A6', 'expense', 11) RETURNING id INTO entertainment_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Personal Care', 'user', '#F472B6', 'expense', 12) RETURNING id INTO personal_care_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Travel', 'map-pin', '#06D6A0', 'expense', 13) RETURNING id INTO travel_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Household Maintenance', 'wrench', '#8B5A3C', 'expense', 14) RETURNING id INTO household_maintenance_id;
    
    INSERT INTO public.categories (name, icon, color, type, sort_order) VALUES
    ('Taxes & Fees', 'receipt', '#6B7280', 'expense', 15) RETURNING id INTO taxes_fees_id;

    -- Insert subcategories for income categories
    INSERT INTO public.subcategories (category_id, name, icon, color, sort_order) VALUES
    -- Salary subcategories
    (salary_id, 'Monthly Salary', 'calendar', '#10B981', 1),
    (salary_id, 'Bonus', 'star', '#10B981', 2),
    (salary_id, 'Overtime', 'clock', '#10B981', 3),
    (salary_id, 'Festival Bonus', 'gift', '#10B981', 4),
    (salary_id, 'Commission', 'percent', '#10B981', 5),
    
    -- Freelance & Business subcategories
    (freelance_id, 'Client Projects', 'briefcase', '#3B82F6', 1),
    (freelance_id, 'Consulting', 'users', '#3B82F6', 2),
    (freelance_id, 'Online Sales', 'shopping-cart', '#3B82F6', 3),
    (freelance_id, 'Business Profit', 'trending-up', '#3B82F6', 4),
    (freelance_id, 'Partnership Income', 'handshake', '#3B82F6', 5),
    
    -- Investment Returns subcategories (including DPS, Shanchay Potro)
    (investment_id, 'Bank Interest', 'banknote', '#8B5CF6', 1),
    (investment_id, 'Stock Dividends', 'trending-up', '#8B5CF6', 2),
    (investment_id, 'Capital Gains', 'bar-chart', '#8B5CF6', 3),
    (investment_id, 'DPS (Deposit Pension Scheme)', 'piggy-bank', '#8B5CF6', 4),
    (investment_id, 'Shanchay Potro (Savings Certificate)', 'certificate', '#8B5CF6', 5),
    (investment_id, 'Mutual Fund Returns', 'pie-chart', '#8B5CF6', 6),
    (investment_id, 'Bond Interest', 'scroll', '#8B5CF6', 7),
    (investment_id, 'Fixed Deposit (FDR)', 'lock', '#8B5CF6', 8),
    
    -- Rental Income subcategories
    (rental_income_id, 'House Rent', 'home', '#84CC16', 1),
    (rental_income_id, 'Shop Rent', 'store', '#84CC16', 2),
    (rental_income_id, 'Land Rent', 'map', '#84CC16', 3),
    (rental_income_id, 'Vehicle Rent', 'car', '#84CC16', 4),
    
    -- Gifts & Others subcategories
    (gifts_id, 'Cash Gifts', 'gift', '#F59E0B', 1),
    (gifts_id, 'Refunds', 'rotate-ccw', '#F59E0B', 2),
    (gifts_id, 'Prize Money', 'award', '#F59E0B', 3),
    (gifts_id, 'Insurance Claims', 'shield-check', '#F59E0B', 4),
    (gifts_id, 'Tax Refund', 'receipt', '#F59E0B', 5);

    -- Insert subcategories for expense categories
    INSERT INTO public.subcategories (category_id, name, icon, color, sort_order) VALUES
    -- Accommodation subcategories (including maid, service charges, etc.)
    (accommodation_id, 'House Rent', 'home', '#EF4444', 1),
    (accommodation_id, 'Flat Rent', 'building', '#EF4444', 2),
    (accommodation_id, 'Mortgage Payment', 'key', '#EF4444', 3),
    (accommodation_id, 'Service Charge', 'settings', '#EF4444', 4),
    (accommodation_id, 'Security Guard', 'shield', '#EF4444', 5),
    (accommodation_id, 'Maid/Housekeeper', 'user', '#EF4444', 6),
    (accommodation_id, 'Cleaner', 'brush', '#EF4444', 7),
    (accommodation_id, 'Property Tax', 'receipt', '#EF4444', 8),
    (accommodation_id, 'Home Insurance', 'shield-check', '#EF4444', 9),
    (accommodation_id, 'Generator Bill', 'battery', '#EF4444', 10),
    
    -- Utility Bills subcategories
    (utility_bills_id, 'Electricity Bill', 'zap', '#F97316', 1),
    (utility_bills_id, 'Gas Bill', 'flame', '#F97316', 2),
    (utility_bills_id, 'Water Bill', 'droplets', '#F97316', 3),
    (utility_bills_id, 'Internet Bill', 'wifi', '#F97316', 4),
    (utility_bills_id, 'Phone Bill', 'phone', '#F97316', 5),
    (utility_bills_id, 'Cable/TV Bill', 'tv', '#F97316', 6),
    (utility_bills_id, 'Dish/Satellite TV', 'radio', '#F97316', 7),
    
    -- Food & Dining subcategories
    (food_dining_id, 'Groceries', 'shopping-cart', '#10B981', 1),
    (food_dining_id, 'Restaurant', 'utensils', '#10B981', 2),
    (food_dining_id, 'Fast Food', 'truck', '#10B981', 3),
    (food_dining_id, 'Coffee & Tea', 'coffee', '#10B981', 4),
    (food_dining_id, 'Food Delivery', 'bike', '#10B981', 5),
    (food_dining_id, 'Snacks & Beverages', 'cookie', '#10B981', 6),
    (food_dining_id, 'Meat & Fish', 'fish', '#10B981', 7),
    (food_dining_id, 'Fruits & Vegetables', 'apple', '#10B981', 8),
    
    -- Transportation subcategories
    (transportation_id, 'Fuel/Petrol/CNG', 'fuel', '#3B82F6', 1),
    (transportation_id, 'Public Transport', 'bus', '#3B82F6', 2),
    (transportation_id, 'Taxi/Uber/Pathao', 'car', '#3B82F6', 3),
    (transportation_id, 'Rickshaw/Auto', 'bike', '#3B82F6', 4),
    (transportation_id, 'Vehicle Maintenance', 'settings', '#3B82F6', 5),
    (transportation_id, 'Parking', 'square', '#3B82F6', 6),
    (transportation_id, 'Tolls', 'road', '#3B82F6', 7),
    (transportation_id, 'Vehicle Insurance', 'shield-check', '#3B82F6', 8),
    (transportation_id, 'Registration/License', 'id-card', '#3B82F6', 9),
    
    -- Shopping subcategories
    (shopping_id, 'Clothing & Fashion', 'shirt', '#A855F7', 1),
    (shopping_id, 'Electronics & Gadgets', 'smartphone', '#A855F7', 2),
    (shopping_id, 'Home & Garden', 'home', '#A855F7', 3),
    (shopping_id, 'Books & Stationery', 'book', '#A855F7', 4),
    (shopping_id, 'Gifts & Occasions', 'gift', '#A855F7', 5),
    (shopping_id, 'Online Shopping', 'shopping-bag', '#A855F7', 6),
    (shopping_id, 'Furniture', 'sofa', '#A855F7', 7),
    (shopping_id, 'Sports Equipment', 'dumbbell', '#A855F7', 8),
    
    -- Entertainment subcategories
    (entertainment_id, 'Movies & Cinema', 'film', '#14B8A6', 1),
    (entertainment_id, 'Games & Gaming', 'gamepad-2', '#14B8A6', 2),
    (entertainment_id, 'Sports Events', 'trophy', '#14B8A6', 3),
    (entertainment_id, 'Music & Streaming', 'music', '#14B8A6', 4),
    (entertainment_id, 'Concerts & Events', 'calendar', '#14B8A6', 5),
    (entertainment_id, 'Hobbies & Crafts', 'palette', '#14B8A6', 6),
    (entertainment_id, 'Books & Magazines', 'book-open', '#14B8A6', 7),
    (entertainment_id, 'Subscription Services', 'monitor', '#14B8A6', 8),
    
    -- Healthcare subcategories
    (healthcare_id, 'Doctor Visits', 'stethoscope', '#EC4899', 1),
    (healthcare_id, 'Pharmacy/Medicine', 'pill', '#EC4899', 2),
    (healthcare_id, 'Hospital Bills', 'building-2', '#EC4899', 3),
    (healthcare_id, 'Dental Care', 'smile', '#EC4899', 4),
    (healthcare_id, 'Eye Care', 'eye', '#EC4899', 5),
    (healthcare_id, 'Lab Tests & X-ray', 'test-tube', '#EC4899', 6),
    (healthcare_id, 'Vaccination', 'syringe', '#EC4899', 7),
    (healthcare_id, 'Mental Health', 'brain', '#EC4899', 8),
    (healthcare_id, 'Physiotherapy', 'activity', '#EC4899', 9),
    
    -- Education subcategories
    (education_id, 'Tuition Fees', 'graduation-cap', '#06B6D4', 1),
    (education_id, 'Books & Materials', 'book-open', '#06B6D4', 2),
    (education_id, 'School/College Fees', 'school', '#06B6D4', 3),
    (education_id, 'Private Tutoring', 'user-check', '#06B6D4', 4),
    (education_id, 'Online Courses', 'monitor', '#06B6D4', 5),
    (education_id, 'Training & Workshops', 'users', '#06B6D4', 6),
    (education_id, 'Certification & Exams', 'award', '#06B6D4', 7),
    (education_id, 'Educational Supplies', 'pen-tool', '#06B6D4', 8),
    
    -- Financial Services subcategories (including investment payments like DPS)
    (financial_services_id, 'Bank Charges & Fees', 'banknote', '#8B5CF6', 1),
    (financial_services_id, 'ATM Fees', 'credit-card', '#8B5CF6', 2),
    (financial_services_id, 'Investment in DPS', 'piggy-bank', '#8B5CF6', 3),
    (financial_services_id, 'Investment in Shanchay Potro', 'certificate', '#8B5CF6', 4),
    (financial_services_id, 'Stock Market Investment', 'trending-up', '#8B5CF6', 5),
    (financial_services_id, 'Mutual Fund Investment', 'pie-chart', '#8B5CF6', 6),
    (financial_services_id, 'Fixed Deposit (FDR)', 'lock', '#8B5CF6', 7),
    (financial_services_id, 'Loan Payments', 'credit-card', '#8B5CF6', 8),
    (financial_services_id, 'Credit Card Payments', 'card', '#8B5CF6', 9),
    (financial_services_id, 'Money Transfer Fees', 'send', '#8B5CF6', 10),
    (financial_services_id, 'Financial Advisor', 'user-check', '#8B5CF6', 11),
    
    -- Insurance subcategories
    (insurance_id, 'Health Insurance', 'heart', '#84CC16', 1),
    (insurance_id, 'Life Insurance', 'shield', '#84CC16', 2),
    (insurance_id, 'Vehicle Insurance', 'car', '#84CC16', 3),
    (insurance_id, 'Home Insurance', 'home', '#84CC16', 4),
    (insurance_id, 'Travel Insurance', 'plane', '#84CC16', 5),
    (insurance_id, 'Business Insurance', 'briefcase', '#84CC16', 6),
    
    -- Family & Childcare subcategories
    (family_childcare_id, 'Childcare/Daycare', 'baby', '#F59E0B', 1),
    (family_childcare_id, 'School Fees', 'graduation-cap', '#F59E0B', 2),
    (family_childcare_id, 'Baby Products', 'baby', '#F59E0B', 3),
    (family_childcare_id, 'Toys & Games', 'toy-brick', '#F59E0B', 4),
    (family_childcare_id, 'Family Events', 'calendar', '#F59E0B', 5),
    (family_childcare_id, 'Elderly Care', 'user', '#F59E0B', 6),
    (family_childcare_id, 'Medical Expenses', 'heart', '#F59E0B', 7),
    
    -- Personal Care subcategories
    (personal_care_id, 'Salon & Barber', 'scissors', '#F472B6', 1),
    (personal_care_id, 'Spa & Wellness', 'heart', '#F472B6', 2),
    (personal_care_id, 'Gym & Fitness', 'dumbbell', '#F472B6', 3),
    (personal_care_id, 'Cosmetics & Beauty', 'sparkles', '#F472B6', 4),
    (personal_care_id, 'Personal Hygiene', 'droplets', '#F472B6', 5),
    (personal_care_id, 'Clothing Care', 'shirt', '#F472B6', 6),
    
    -- Travel subcategories
    (travel_id, 'Flights & Airlines', 'plane', '#06D6A0', 1),
    (travel_id, 'Hotels & Accommodation', 'bed', '#06D6A0', 2),
    (travel_id, 'Transportation', 'car', '#06D6A0', 3),
    (travel_id, 'Food & Dining', 'utensils', '#06D6A0', 4),
    (travel_id, 'Tours & Activities', 'camera', '#06D6A0', 5),
    (travel_id, 'Travel Insurance', 'shield-check', '#06D6A0', 6),
    (travel_id, 'Visa & Documents', 'file-text', '#06D6A0', 7),
    (travel_id, 'Shopping & Souvenirs', 'shopping-bag', '#06D6A0', 8),
    
    -- Household Maintenance subcategories
    (household_maintenance_id, 'Home Repairs', 'wrench', '#8B5A3C', 1),
    (household_maintenance_id, 'Plumbing', 'droplets', '#8B5A3C', 2),
    (household_maintenance_id, 'Electrical Work', 'zap', '#8B5A3C', 3),
    (household_maintenance_id, 'Painting & Decoration', 'brush', '#8B5A3C', 4),
    (household_maintenance_id, 'Cleaning Supplies', 'spray-can', '#8B5A3C', 5),
    (household_maintenance_id, 'Gardening', 'flower', '#8B5A3C', 6),
    (household_maintenance_id, 'Pest Control', 'bug', '#8B5A3C', 7),
    (household_maintenance_id, 'Appliance Repair', 'settings', '#8B5A3C', 8),
    
    -- Taxes & Fees subcategories
    (taxes_fees_id, 'Income Tax', 'receipt', '#6B7280', 1),
    (taxes_fees_id, 'VAT/Sales Tax', 'percent', '#6B7280', 2),
    (taxes_fees_id, 'Property Tax', 'home', '#6B7280', 3),
    (taxes_fees_id, 'Vehicle Tax', 'car', '#6B7280', 4),
    (taxes_fees_id, 'Government Fees', 'landmark', '#6B7280', 5),
    (taxes_fees_id, 'Legal Fees', 'scale', '#6B7280', 6),
    (taxes_fees_id, 'Professional Fees', 'user-check', '#6B7280', 7),
    (taxes_fees_id, 'Penalties & Fines', 'alert-triangle', '#6B7280', 8);

    RAISE NOTICE 'Global categories and subcategories created successfully!';
END;
$$;


ALTER FUNCTION "public"."create_global_categories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_investment_main_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    transaction_type_val transaction_type;
    account_id_val UUID;
    description_val TEXT;
    amount_val DECIMAL(15,2);
    investment_name VARCHAR(100);
BEGIN
    -- Get investment details
    SELECT name INTO investment_name 
    FROM investments 
    WHERE id = NEW.investment_id;
    
    -- Determine transaction type and account
    CASE NEW.type
        WHEN 'buy', 'sell' THEN
            -- For buy/sell, determine if it's income or expense based on type
            IF NEW.type = 'buy' THEN
                transaction_type_val := 'investment_buy';
                amount_val := NEW.net_amount; -- Money going out (expense)
                description_val := 'Investment Purchase: ' || COALESCE(investment_name, 'Unknown');
            ELSE
                transaction_type_val := 'investment_sell';
                amount_val := NEW.net_amount; -- Money coming in (income)
                description_val := 'Investment Sale: ' || COALESCE(investment_name, 'Unknown');
            END IF;
            
        WHEN 'dividend' THEN
            transaction_type_val := 'investment_dividend';
            amount_val := NEW.net_amount; -- Money coming in (income)
            description_val := 'Dividend from: ' || COALESCE(investment_name, 'Unknown');
            
        ELSE
            transaction_type_val := 'investment_return';
            amount_val := NEW.net_amount;
            description_val := 'Investment Return: ' || COALESCE(investment_name, 'Unknown');
    END CASE;
    
    -- Find user's primary investment account or create default
    SELECT id INTO account_id_val 
    FROM accounts 
    WHERE user_id = NEW.user_id 
    AND type = 'investment' 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- If no investment account exists, find primary bank account
    IF account_id_val IS NULL THEN
        SELECT id INTO account_id_val 
        FROM accounts 
        WHERE user_id = NEW.user_id 
        AND type = 'bank' 
        ORDER BY created_at ASC 
        LIMIT 1;
    END IF;
    
    -- Create the main transaction record
    INSERT INTO transactions (
        user_id,
        type,
        amount,
        currency,
        description,
        account_id,
        date,
        investment_id,
        investment_transaction_id,
        is_investment_related,
        investment_action,
        created_at,
        updated_at
    ) VALUES (
        NEW.user_id,
        transaction_type_val,
        amount_val,
        'BDT', -- Default currency, can be customized
        description_val,
        account_id_val,
        NEW.transaction_date,
        NEW.investment_id,
        NEW.id,
        true,
        NEW.type,
        NOW(),
        NOW()
    ) RETURNING id INTO NEW.main_transaction_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_investment_main_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_lending_payment_transaction"("p_lending_id" "uuid", "p_user_id" "uuid", "p_payment_date" "date" DEFAULT CURRENT_DATE) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_lending RECORD;
  v_transaction_id UUID;
  v_effective_category_id UUID;
BEGIN
  -- Get lending details
  SELECT * INTO v_lending
  FROM lending
  WHERE id = p_lending_id AND user_id = p_user_id AND status IN ('pending', 'partial');
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Lending record not found or already paid');
  END IF;
  
  -- Get effective category ID
  v_effective_category_id := get_effective_category(v_lending.category_id, v_lending.subcategory_id);
  
  -- Create transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    description,
    notes,
    category_id,
    account_id,
    date,
    tags,
    is_recurring,
    metadata
  ) VALUES (
    p_user_id,
    CASE 
      WHEN v_lending.type = 'lent' THEN 'income'::transaction_type  -- Receiving payment back
      ELSE 'expense'::transaction_type  -- Making payment back
    END,
    LEAST(v_lending.pending_amount, v_lending.pending_amount), -- For now, assume full payment
    v_lending.currency,
    CASE 
      WHEN v_lending.type = 'lent' THEN 'Payment received from ' || v_lending.person_name
      ELSE 'Payment made to ' || v_lending.person_name
    END,
    'Auto-generated payment for personal lending',
    v_effective_category_id,
    v_lending.account_id,
    p_payment_date,
    ARRAY['lending', 'auto_debit', v_lending.type::text],
    false,
    json_build_object(
      'lending_id', v_lending.id,
      'lending_type', v_lending.type,
      'auto_generated', true,
      'original_amount', v_lending.amount
    )
  ) RETURNING id INTO v_transaction_id;
  
  -- Create lending payment record
  INSERT INTO lending_payments (
    user_id,
    lending_id,
    payment_date,
    amount,
    payment_method,
    transaction_id,
    notes
  ) VALUES (
    p_user_id,
    p_lending_id,
    p_payment_date,
    LEAST(v_lending.pending_amount, v_lending.pending_amount),
    'auto_debit',
    v_transaction_id,
    'Auto-generated payment'
  );
  
  -- Update lending status
  UPDATE lending SET
    pending_amount = GREATEST(0, pending_amount - LEAST(pending_amount, pending_amount)),
    status = CASE 
      WHEN pending_amount - LEAST(pending_amount, pending_amount) <= 0 THEN 'paid'::lending_status
      ELSE 'partial'::lending_status
    END,
    next_due_date = CASE 
      WHEN pending_amount - LEAST(pending_amount, pending_amount) <= 0 THEN NULL
      ELSE due_date -- Keep the original due date for remaining payments
    END,
    updated_at = NOW()
  WHERE id = p_lending_id;
  
  -- Update budget if category is set
  IF v_effective_category_id IS NOT NULL THEN
    PERFORM update_budget_for_expense(
      p_user_id,
      v_effective_category_id,
      LEAST(v_lending.pending_amount, v_lending.pending_amount),
      p_payment_date
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'transaction_id', v_transaction_id,
    'amount', LEAST(v_lending.pending_amount, v_lending.pending_amount)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."create_lending_payment_transaction"("p_lending_id" "uuid", "p_user_id" "uuid", "p_payment_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_lending_transaction"("p_lending_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_transaction_type" character varying, "p_payment_date" "date" DEFAULT CURRENT_DATE) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_lending lending%ROWTYPE;
  v_transaction_id UUID;
  v_transaction_type transaction_type;
  v_description TEXT;
  v_result JSON;
BEGIN
  -- Get lending details
  SELECT * INTO v_lending FROM lending WHERE id = p_lending_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Lending record not found');
  END IF;
  
  -- Determine transaction type and description
  CASE p_transaction_type
    WHEN 'lent' THEN
      v_transaction_type := 'expense';
      v_description := 'Money lent to ' || v_lending.person_name;
    WHEN 'borrowed' THEN
      v_transaction_type := 'income';
      v_description := 'Money borrowed from ' || v_lending.person_name;
    WHEN 'repayment_received' THEN
      v_transaction_type := 'income';
      v_description := 'Repayment received from ' || v_lending.person_name;
    WHEN 'repayment_made' THEN
      v_transaction_type := 'expense';
      v_description := 'Repayment made to ' || v_lending.person_name;
    ELSE
      RETURN json_build_object('success', false, 'error', 'Invalid transaction type');
  END CASE;
  
  -- Create transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    description,
    notes,
    category_id,
    account_id,
    date,
    tags,
    is_recurring,
    metadata
  ) VALUES (
    p_user_id,
    v_transaction_type,
    p_amount,
    v_lending.currency,
    v_description,
    'Auto-generated transaction for ' || REPLACE(p_transaction_type, '_', ' '),
    v_lending.category_id,
    v_lending.account_id,
    p_payment_date,
    ARRAY['lending', p_transaction_type, 'personal_finance'],
    false,
    json_build_object(
      'lending_id', v_lending.id,
      'lending_type', v_lending.type,
      'person_name', v_lending.person_name,
      'auto_generated', true,
      'action_type', p_transaction_type
    )
  ) RETURNING id INTO v_transaction_id;
  
  -- Update budget if applicable
  IF v_transaction_type = 'expense' THEN
    PERFORM update_budget_for_expense(v_lending.category_id, p_amount, p_payment_date, p_user_id);
  END IF;
  
  -- Update lending record for repayments
  IF p_transaction_type IN ('repayment_received', 'repayment_made') THEN
    UPDATE lending SET
      pending_amount = GREATEST(0, pending_amount - p_amount),
      status = CASE 
        WHEN pending_amount - p_amount <= 0 THEN 'paid'
        WHEN pending_amount - p_amount < amount THEN 'partial'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = p_lending_id;
    
    -- Create lending payment record
    INSERT INTO lending_payments (
      lending_id,
      user_id,
      amount,
      payment_date,
      payment_method,
      transaction_id
    ) VALUES (
      v_lending.id,
      p_user_id,
      p_amount,
      p_payment_date,
      'manual',
      v_transaction_id
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'transaction_id', v_transaction_id,
    'remaining_amount', CASE 
      WHEN p_transaction_type IN ('repayment_received', 'repayment_made') 
      THEN GREATEST(0, v_lending.pending_amount - p_amount)
      ELSE v_lending.pending_amount
    END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."create_lending_transaction"("p_lending_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_transaction_type" character varying, "p_payment_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_loan_payment_transaction"("p_loan_id" "uuid", "p_user_id" "uuid", "p_payment_date" "date" DEFAULT CURRENT_DATE) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_loan loans%ROWTYPE;
  v_transaction_id UUID;
  v_principal_portion DECIMAL(15,2);
  v_interest_portion DECIMAL(15,2);
  v_result JSON;
BEGIN
  -- Get loan details
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Loan not found');
  END IF;
  
  IF v_loan.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Loan is not active');
  END IF;
  
  -- Calculate principal and interest portions (simplified)
  -- In real EMI, principal portion increases over time
  v_interest_portion := (v_loan.outstanding_amount * v_loan.interest_rate / 100 / 12);
  v_principal_portion := v_loan.emi_amount - v_interest_portion;
  
  -- Ensure principal portion doesn't exceed outstanding amount
  IF v_principal_portion > v_loan.outstanding_amount THEN
    v_principal_portion := v_loan.outstanding_amount;
    v_interest_portion := v_loan.emi_amount - v_principal_portion;
  END IF;
  
  -- Create expense transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    description,
    notes,
    category_id,
    account_id,
    date,
    tags,
    is_recurring,
    metadata
  ) VALUES (
    p_user_id,
    'expense',
    v_loan.emi_amount,
    v_loan.currency,
    v_loan.lender || ' - ' || UPPER(regexp_replace(v_loan.type::text, '_', ' ', 'g')) || ' Loan EMI',
    'Auto-generated EMI payment. Principal: ' || v_principal_portion || ', Interest: ' || v_interest_portion,
    v_loan.category_id,
    v_loan.account_id,
    p_payment_date,
    ARRAY['loan', 'emi', 'auto_debit', v_loan.type::text],
    false,
    json_build_object(
      'loan_id', v_loan.id,
      'loan_type', v_loan.type,
      'auto_generated', true,
      'principal_portion', v_principal_portion,
      'interest_portion', v_interest_portion,
      'remaining_tenure', CEIL(v_loan.outstanding_amount / GREATEST(v_principal_portion, 1))
    )
  ) RETURNING id INTO v_transaction_id;
  
  -- Update loan details
  UPDATE loans SET
    outstanding_amount = GREATEST(0, outstanding_amount - v_principal_portion),
    last_payment_date = p_payment_date,
    next_due_date = CASE 
      WHEN outstanding_amount - v_principal_portion <= 0 THEN NULL
      ELSE (p_payment_date + INTERVAL '1 month')::DATE
    END,
    status = CASE 
      WHEN outstanding_amount - v_principal_portion <= 0 THEN 'closed'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_loan_id;
  
  -- Update budget if category exists
  PERFORM update_budget_for_expense(v_loan.category_id, v_loan.emi_amount, p_payment_date, p_user_id);
  
  -- Create EMI payment record
  INSERT INTO emi_payments (
    loan_id,
    user_id,
    amount,
    payment_date,
    principal_amount,
    interest_amount,
    outstanding_balance,
    is_paid,
    payment_method,
    transaction_id
  ) VALUES (
    v_loan.id,
    p_user_id,
    v_loan.emi_amount,
    p_payment_date,
    v_principal_portion,
    v_interest_portion,
    GREATEST(0, v_loan.outstanding_amount - v_principal_portion),
    true,
    'auto_debit',
    v_transaction_id
  );
  
  RETURN json_build_object(
    'success', true, 
    'transaction_id', v_transaction_id,
    'principal_paid', v_principal_portion,
    'interest_paid', v_interest_portion,
    'remaining_balance', GREATEST(0, v_loan.outstanding_amount - v_principal_portion)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."create_loan_payment_transaction"("p_loan_id" "uuid", "p_user_id" "uuid", "p_payment_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_payment_reminders"("p_user_id" "uuid", "p_check_date" "date" DEFAULT CURRENT_DATE) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_loan_record RECORD;
  v_lending_record RECORD;
  v_created INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_reminder_date DATE;
BEGIN
  -- Create reminders for loans
  FOR v_loan_record IN 
    SELECT * FROM loans 
    WHERE user_id = p_user_id 
      AND status = 'active' 
      AND reminder_days > 0
      AND next_due_date IS NOT NULL
  LOOP
    v_reminder_date := v_loan_record.next_due_date - INTERVAL '1 day' * v_loan_record.reminder_days;
    
    IF v_reminder_date::DATE = p_check_date THEN
      -- Check if reminder already exists
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = p_user_id 
          AND category = 'loan'
          AND (metadata->>'loan_id')::UUID = v_loan_record.id
          AND created_at::DATE = p_check_date
      ) THEN
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          priority,
          category,
          metadata,
          read,
          action_url
        ) VALUES (
          p_user_id,
          'payment_reminder',
          'EMI Payment Due - ' || v_loan_record.lender,
          'Your EMI payment of ' || v_loan_record.currency || ' ' || v_loan_record.emi_amount || 
          ' for ' || v_loan_record.lender || ' is due on ' || v_loan_record.next_due_date,
          'medium',
          'loan',
          json_build_object(
            'loan_id', v_loan_record.id,
            'due_date', v_loan_record.next_due_date,
            'amount', v_loan_record.emi_amount,
            'lender', v_loan_record.lender
          ),
          false,
          '/dashboard/credit/loans'
        );
        
        v_created := v_created + 1;
      END IF;
    END IF;
  END LOOP;
  
  -- Create reminders for lending
  FOR v_lending_record IN 
    SELECT * FROM lending 
    WHERE user_id = p_user_id 
      AND status IN ('pending', 'partial')
      AND reminder_days > 0
      AND expected_return_date IS NOT NULL
  LOOP
    v_reminder_date := v_lending_record.expected_return_date - INTERVAL '1 day' * v_lending_record.reminder_days;
    
    IF v_reminder_date::DATE = p_check_date THEN
      -- Check if reminder already exists
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = p_user_id 
          AND category = 'lending'
          AND (metadata->>'lending_id')::UUID = v_lending_record.id
          AND created_at::DATE = p_check_date
      ) THEN
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          priority,
          category,
          metadata,
          read,
          action_url
        ) VALUES (
          p_user_id,
          'payment_reminder',
          CASE 
            WHEN v_lending_record.type = 'lent' THEN 'Money Return Due - ' || v_lending_record.person_name
            ELSE 'Repayment Due - ' || v_lending_record.person_name
          END,
          CASE 
            WHEN v_lending_record.type = 'lent' THEN 'Money return of ' || v_lending_record.currency || ' ' || v_lending_record.pending_amount || 
                 ' from ' || v_lending_record.person_name || ' is due on ' || v_lending_record.expected_return_date
            ELSE 'Repayment of ' || v_lending_record.currency || ' ' || v_lending_record.pending_amount || 
                 ' to ' || v_lending_record.person_name || ' is due on ' || v_lending_record.expected_return_date
          END,
          'medium',
          'lending',
          json_build_object(
            'lending_id', v_lending_record.id,
            'due_date', v_lending_record.expected_return_date,
            'amount', v_lending_record.pending_amount,
            'person_name', v_lending_record.person_name,
            'type', v_lending_record.type
          ),
          false,
          '/dashboard/credit/personal-lending'
        );
        
        v_created := v_created + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'created', v_created,
    'errors', v_errors,
    'date', p_check_date
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."create_payment_reminders"("p_user_id" "uuid", "p_check_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_purchase_emi"("p_user_id" "uuid", "p_item_name" "text", "p_vendor_name" "text", "p_purchase_category" "text", "p_principal_amount" numeric, "p_interest_rate" numeric, "p_tenure_months" integer, "p_purchase_date" "date", "p_down_payment" numeric DEFAULT 0, "p_item_condition" "text" DEFAULT 'new'::"text", "p_warranty_period" integer DEFAULT NULL::integer, "p_payment_day" integer DEFAULT 1, "p_account_id" "uuid" DEFAULT NULL::"uuid", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_notes" "text" DEFAULT NULL::"text", "p_currency" "text" DEFAULT 'BDT'::"text") RETURNS TABLE("loan_id" "uuid", "emi_amount" numeric, "success" boolean, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_loan_id UUID;
    v_emi_amount DECIMAL(15,2);
    v_loan_amount DECIMAL(15,2);
    v_monthly_rate DECIMAL(10,8);
    v_next_due_date DATE;
BEGIN
    -- Validate inputs
    IF p_principal_amount <= 0 THEN
        RETURN QUERY SELECT NULL::UUID, 0::DECIMAL(15,2), FALSE, 'Principal amount must be greater than 0';
        RETURN;
    END IF;
    
    IF p_down_payment < 0 OR p_down_payment >= p_principal_amount THEN
        RETURN QUERY SELECT NULL::UUID, 0::DECIMAL(15,2), FALSE, 'Down payment must be between 0 and principal amount';
        RETURN;
    END IF;
    
    IF p_tenure_months <= 0 OR p_tenure_months > 120 THEN
        RETURN QUERY SELECT NULL::UUID, 0::DECIMAL(15,2), FALSE, 'Tenure must be between 1 and 120 months';
        RETURN;
    END IF;
    
    -- Calculate loan amount after down payment
    v_loan_amount := p_principal_amount - COALESCE(p_down_payment, 0);
    
    -- Calculate EMI amount
    IF p_interest_rate = 0 THEN
        v_emi_amount := v_loan_amount / p_tenure_months;
    ELSE
        v_monthly_rate := p_interest_rate / 12.0 / 100.0;
        v_emi_amount := (v_loan_amount * v_monthly_rate * POWER(1 + v_monthly_rate, p_tenure_months)) / 
                       (POWER(1 + v_monthly_rate, p_tenure_months) - 1);
    END IF;
    
    -- Round EMI to 2 decimal places
    v_emi_amount := ROUND(v_emi_amount, 2);
    
    -- Calculate next due date
    v_next_due_date := DATE_TRUNC('month', p_purchase_date) + INTERVAL '1 month' + (p_payment_day - 1) * INTERVAL '1 day';
    
    -- Insert loan record
    INSERT INTO loans (
        user_id,
        lender,
        principal_amount,
        outstanding_amount,
        interest_rate,
        emi_amount,
        tenure_months,
        start_date,
        next_due_date,
        currency,
        type,
        status,
        account_id,
        category_id,
        payment_day,
        notes,
        metadata
    ) VALUES (
        p_user_id,
        p_vendor_name,
        p_principal_amount,
        v_loan_amount, -- Outstanding is loan amount after down payment
        p_interest_rate,
        v_emi_amount,
        p_tenure_months,
        p_purchase_date,
        v_next_due_date,
        p_currency,
        'purchase_emi'::loan_type, -- Now safe to use the enum value
        'active'::loan_status,
        p_account_id,
        p_category_id,
        p_payment_day,
        p_notes,
        jsonb_build_object(
            'item_name', p_item_name,
            'vendor_name', p_vendor_name,
            'purchase_category', p_purchase_category,
            'purchase_date', p_purchase_date,
            'item_condition', p_item_condition,
            'warranty_period', p_warranty_period,
            'down_payment', p_down_payment
        )
    ) RETURNING id INTO v_loan_id;
    
    -- Return success result
    RETURN QUERY SELECT v_loan_id, v_emi_amount, TRUE, 'Purchase EMI created successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT NULL::UUID, 0::DECIMAL(15,2), FALSE, 'Error creating purchase EMI: ' || SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_purchase_emi"("p_user_id" "uuid", "p_item_name" "text", "p_vendor_name" "text", "p_purchase_category" "text", "p_principal_amount" numeric, "p_interest_rate" numeric, "p_tenure_months" integer, "p_purchase_date" "date", "p_down_payment" numeric, "p_item_condition" "text", "p_warranty_period" integer, "p_payment_day" integer, "p_account_id" "uuid", "p_category_id" "uuid", "p_notes" "text", "p_currency" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_purchase_emi"("p_user_id" "uuid", "p_item_name" "text", "p_vendor_name" "text", "p_purchase_category" "text", "p_principal_amount" numeric, "p_interest_rate" numeric, "p_tenure_months" integer, "p_purchase_date" "date", "p_down_payment" numeric, "p_item_condition" "text", "p_warranty_period" integer, "p_payment_day" integer, "p_account_id" "uuid", "p_category_id" "uuid", "p_notes" "text", "p_currency" "text") IS 'Creates a new purchase EMI loan with proper validation and EMI calculation';



CREATE OR REPLACE FUNCTION "public"."decrement_coupon_usage"("coupon_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE coupons
  SET
    used_count = GREATEST(used_count - 1, 0),
    updated_at = NOW()
  WHERE id = coupon_id;
END;
$$;


ALTER FUNCTION "public"."decrement_coupon_usage"("coupon_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_investment_main_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Delete the associated main transaction
    IF OLD.main_transaction_id IS NOT NULL THEN
        DELETE FROM transactions 
        WHERE id = OLD.main_transaction_id;
    END IF;
    
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_investment_main_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."exec_sql"("query" "text") RETURNS TABLE("result" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rec RECORD;
    result_array JSONB DEFAULT '[]'::JSONB;
BEGIN
    -- Execute the query and collect results
    FOR rec IN EXECUTE query LOOP
        result_array := result_array || to_jsonb(rec);
    END LOOP;
    
    -- Return the results
    RETURN QUERY SELECT result_array;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        RETURN QUERY SELECT jsonb_build_object(
            'error', SQLERRM,
            'code', SQLSTATE,
            'query', query
        );
END;
$$;


ALTER FUNCTION "public"."exec_sql"("query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_pending_investment_templates"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    template RECORD;
    new_transaction_id UUID;
    executed_count INTEGER := 0;
BEGIN
    -- Find all active investment templates that need execution
    FOR template IN 
        SELECT it.* 
        FROM investment_templates it
        WHERE it.is_active = true 
        AND it.auto_execute = true
        AND it.next_execution <= CURRENT_DATE
        AND (it.end_date IS NULL OR it.next_execution <= it.end_date)
        AND (it.target_amount IS NULL OR it.total_invested < it.target_amount)
    LOOP
        -- Create investment transaction from template
        INSERT INTO investment_transactions (
            user_id,
            investment_id,
            portfolio_id,
            type,
            units,
            price_per_unit,
            total_amount,
            net_amount,
            transaction_date,
            platform,
            account_number,
            currency,
            recurring_investment_id,
            is_recurring,
            notes,
            created_at,
            updated_at
        ) VALUES (
            template.user_id,
            -- Find or create investment record for this template
            (SELECT id FROM investments WHERE user_id = template.user_id AND symbol = template.symbol AND type = template.investment_type LIMIT 1),
            template.portfolio_id,
            'buy',
            1, -- Placeholder - will be calculated based on amount and current price
            template.amount_per_investment, -- Placeholder - for SIP this will be amount, for unit-based this will be price
            template.amount_per_investment,
            template.amount_per_investment,
            CURRENT_DATE,
            template.platform,
            template.account_number,
            template.currency,
            template.id,
            true,
            'Automated investment from template: ' || template.name,
            NOW(),
            NOW()
        ) RETURNING id INTO new_transaction_id;
        
        -- Update investment template
        UPDATE investment_templates 
        SET 
            last_executed = CURRENT_DATE,
            next_execution = CASE 
                WHEN frequency = 'daily' THEN CURRENT_DATE + INTERVAL '1 day' * interval_value
                WHEN frequency = 'weekly' THEN CURRENT_DATE + INTERVAL '1 week' * interval_value
                WHEN frequency = 'biweekly' THEN CURRENT_DATE + INTERVAL '2 weeks' * interval_value
                WHEN frequency = 'monthly' THEN CURRENT_DATE + INTERVAL '1 month' * interval_value
                WHEN frequency = 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months' * interval_value
                WHEN frequency = 'yearly' THEN CURRENT_DATE + INTERVAL '1 year' * interval_value
                ELSE CURRENT_DATE + INTERVAL '1 month' -- default fallback
            END,
            total_executed = total_executed + 1,
            total_invested = total_invested + template.amount_per_investment,
            updated_at = NOW()
        WHERE id = template.id;
        
        executed_count := executed_count + 1;
    END LOOP;
    
    RETURN executed_count;
END;
$$;


ALTER FUNCTION "public"."execute_pending_investment_templates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_pending_recurring_transactions"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rec RECORD;
    transaction_data JSONB;
    executed_count INTEGER := 0;
BEGIN
    -- Find all recurring transactions that need to be executed
    FOR rec IN 
        SELECT rt.* 
        FROM recurring_transactions rt
        WHERE rt.is_active = true 
        AND rt.next_execution <= CURRENT_DATE
        AND (rt.end_date IS NULL OR rt.next_execution <= rt.end_date)
    LOOP
        -- Get the transaction template
        transaction_data := rec.transaction_template;
        
        -- Create new transaction from template
        INSERT INTO transactions (
            user_id,
            type,
            amount,
            currency,
            description,
            notes,
            category_id,
            subcategory_id,
            account_id,
            date,
            tags,
            location,
            vendor,
            is_recurring,
            recurring_template_id
        ) VALUES (
            rec.user_id,
            COALESCE((transaction_data->>'type')::transaction_type, 'expense'),
            COALESCE((transaction_data->>'amount')::NUMERIC, 0),
            COALESCE(transaction_data->>'currency', 'BDT'),
            COALESCE(transaction_data->>'description', 'Recurring Transaction'),
            transaction_data->>'notes',
            CASE WHEN transaction_data ? 'category_id' THEN CAST(transaction_data->>'category_id' AS UUID) ELSE NULL END,
            CASE WHEN transaction_data ? 'subcategory_id' THEN CAST(transaction_data->>'subcategory_id' AS UUID) ELSE NULL END,
            CASE WHEN transaction_data ? 'account_id' THEN CAST(transaction_data->>'account_id' AS UUID) ELSE NULL END,
            CURRENT_DATE,
            COALESCE((transaction_data->'tags')::JSONB, '[]'::JSONB),
            transaction_data->>'location',
            transaction_data->>'vendor',
            true,
            rec.id
        );
        
        -- Calculate next execution date
        UPDATE recurring_transactions 
        SET 
            last_executed = CURRENT_DATE,
            next_execution = CASE 
                WHEN frequency = 'weekly' THEN CURRENT_DATE + INTERVAL '7 days'
                WHEN frequency = 'biweekly' THEN CURRENT_DATE + INTERVAL '14 days'  
                WHEN frequency = 'monthly' THEN CURRENT_DATE + INTERVAL '1 month'
                WHEN frequency = 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months'
                WHEN frequency = 'yearly' THEN CURRENT_DATE + INTERVAL '1 year'
                ELSE CURRENT_DATE + INTERVAL '1 month'
            END,
            updated_at = NOW()
        WHERE id = rec.id;
        
        executed_count := executed_count + 1;
    END LOOP;
    
    RETURN executed_count;
END;
$$;


ALTER FUNCTION "public"."execute_pending_recurring_transactions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_emi_schedule"("p_loan_id" "uuid", "p_user_id" "uuid") RETURNS TABLE("installment_number" integer, "due_date" "date", "emi_amount" numeric, "principal_amount" numeric, "interest_amount" numeric, "outstanding_balance" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    loan_record RECORD;
    monthly_rate DECIMAL;
    remaining_balance DECIMAL;
    due_date DATE;
    i INTEGER;
    interest_for_month DECIMAL;
    principal_for_month DECIMAL;
BEGIN
    -- Get loan details
    SELECT * INTO loan_record 
    FROM loans 
    WHERE id = p_loan_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan not found or access denied';
    END IF;
    
    monthly_rate := loan_record.interest_rate / 12 / 100;
    remaining_balance := loan_record.principal_amount;
    due_date := loan_record.start_date;
    
    -- Generate schedule for each month
    FOR i IN 1..loan_record.tenure_months LOOP
        -- Calculate interest and principal for this month
        interest_for_month := remaining_balance * monthly_rate;
        principal_for_month := loan_record.emi_amount - interest_for_month;
        remaining_balance := remaining_balance - principal_for_month;
        
        -- Ensure remaining balance doesn't go negative
        IF remaining_balance < 0 THEN
            principal_for_month := principal_for_month + remaining_balance;
            remaining_balance := 0;
        END IF;
        
        -- Set due date (use payment_day if set, otherwise use start_date day)
        due_date := (due_date + INTERVAL '1 month')::DATE;
        IF loan_record.payment_day IS NOT NULL THEN
            due_date := DATE_TRUNC('month', due_date) + (loan_record.payment_day - 1) * INTERVAL '1 day';
        END IF;
        
        RETURN QUERY SELECT 
            i,
            due_date,
            loan_record.emi_amount,
            principal_for_month,
            interest_for_month,
            remaining_balance;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_emi_schedule"("p_loan_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_account_display_balance"("account_id_param" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    account_record RECORD;
    result JSONB;
BEGIN
    -- Get account details
    SELECT balance, credit_limit, balance_type, currency INTO account_record
    FROM accounts 
    WHERE id = account_id_param;
    
    -- Return null if account not found
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Build result based on account type
    IF account_record.balance_type = 'credit' THEN
        result = jsonb_build_object(
            'balance', account_record.balance,
            'credit_limit', account_record.credit_limit,
            'available_credit', account_record.credit_limit + account_record.balance,
            'utilization_percentage', 
                CASE 
                    WHEN account_record.credit_limit > 0 THEN
                        ROUND(((account_record.credit_limit + account_record.balance) / account_record.credit_limit * 100)::numeric, 2)
                    ELSE 0 
                END,
            'balance_type', account_record.balance_type,
            'currency', account_record.currency,
            'is_overlimit', (account_record.balance * -1) > account_record.credit_limit
        );
    ELSE
        result = jsonb_build_object(
            'balance', account_record.balance,
            'balance_type', account_record.balance_type,
            'currency', account_record.currency
        );
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_account_display_balance"("account_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_account_display_balance"("account_id_param" "uuid") IS 'Get formatted balance information for display, considering credit vs debit account types';



CREATE OR REPLACE FUNCTION "public"."get_account_limit"("plan_type" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN CASE plan_type
        WHEN 'free' THEN 3
        WHEN 'pro' THEN 15
        WHEN 'max' THEN 50  -- Family shared limit
        ELSE 3
    END;
END;
$$;


ALTER FUNCTION "public"."get_account_limit"("plan_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_allowed_account_types"("plan_type" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN CASE plan_type
        WHEN 'free' THEN ARRAY['cash', 'bank']
        WHEN 'pro' THEN ARRAY['cash', 'bank', 'credit_card', 'savings', 'investment']
        WHEN 'max' THEN ARRAY['cash', 'bank', 'credit_card', 'savings', 'investment', 'wallet', 'other']
        ELSE ARRAY['cash', 'bank']
    END;
END;
$$;


ALTER FUNCTION "public"."get_allowed_account_types"("plan_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_asset_allocation_data"("p_user_id" "uuid", "p_currency" character varying DEFAULT 'BDT'::character varying) RETURNS TABLE("name" "text", "investment_type" "text", "value" numeric, "percentage" numeric, "color" "text", "investment_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH portfolio_totals AS (
        SELECT SUM(i.current_value) as total_portfolio_value
        FROM investments i
        WHERE i.user_id = p_user_id
        AND i.status = 'active'
    ),
    type_colors AS (
        SELECT 
            'stock'::TEXT as inv_type, '#3B82F6'::TEXT as type_color
        UNION ALL SELECT 'mutual_fund', '#10B981'
        UNION ALL SELECT 'crypto', '#F59E0B'
        UNION ALL SELECT 'bond', '#8B5CF6'
        UNION ALL SELECT 'fd', '#06B6D4'
        UNION ALL SELECT 'sip', '#84CC16'
        UNION ALL SELECT 'dps', '#F97316'
        UNION ALL SELECT 'gold', '#EAB308'
        UNION ALL SELECT 'real_estate', '#EF4444'
        UNION ALL SELECT 'other', '#6B7280'
    )
    SELECT 
        CASE i.type::TEXT
            WHEN 'stock' THEN 'Stocks'
            WHEN 'mutual_fund' THEN 'Mutual Funds'
            WHEN 'crypto' THEN 'Cryptocurrency'
            WHEN 'bond' THEN 'Bonds'
            WHEN 'fd' THEN 'Fixed Deposits'
            WHEN 'sip' THEN 'SIP Investments'
            WHEN 'dps' THEN 'DPS'
            WHEN 'gold' THEN 'Gold'
            WHEN 'real_estate' THEN 'Real Estate'
            ELSE 'Others'
        END as name,
        i.type::TEXT as investment_type,
        SUM(i.current_value)::DECIMAL as value,
        CASE 
            WHEN pt.total_portfolio_value > 0 
            THEN (SUM(i.current_value) / pt.total_portfolio_value * 100)::DECIMAL
            ELSE 0::DECIMAL
        END as percentage,
        COALESCE(tc.type_color, '#6B7280')::TEXT as color,
        COUNT(*)::INTEGER as investment_count
    FROM investments i
    CROSS JOIN portfolio_totals pt
    LEFT JOIN type_colors tc ON i.type::TEXT = tc.inv_type
    WHERE i.user_id = p_user_id
    AND i.status = 'active'
    AND i.current_value > 0
    GROUP BY i.type, pt.total_portfolio_value, tc.type_color
    ORDER BY SUM(i.current_value) DESC;
END;
$$;


ALTER FUNCTION "public"."get_asset_allocation_data"("p_user_id" "uuid", "p_currency" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_asset_allocation_data"("p_user_id" "uuid", "p_currency" character varying) IS 'Returns asset allocation breakdown for pie charts with investment type distribution';



CREATE OR REPLACE FUNCTION "public"."get_available_credit"("account_id_param" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    account_record RECORD;
    available_credit DECIMAL(15,2);
BEGIN
    -- Get account details
    SELECT credit_limit, balance, balance_type INTO account_record
    FROM accounts 
    WHERE id = account_id_param;
    
    -- Return null if account not found
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- For credit accounts, available credit = credit_limit + balance (balance is negative for credit accounts)
    IF account_record.balance_type = 'credit' THEN
        available_credit = account_record.credit_limit + account_record.balance;
        -- Ensure non-negative result
        IF available_credit < 0 THEN
            available_credit = 0;
        END IF;
        RETURN available_credit;
    ELSE
        -- For debit accounts, return the balance
        RETURN account_record.balance;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_available_credit"("account_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_available_credit"("account_id_param" "uuid") IS 'Calculate available credit for a credit account';



CREATE OR REPLACE FUNCTION "public"."get_complete_schema_info"() RETURNS TABLE("schema_name" "text", "object_type" "text", "object_name" "text", "definition" "text", "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Return tables with column information
    RETURN QUERY
    SELECT 
        t.table_schema::TEXT,
        'table'::TEXT,
        t.table_name::TEXT,
        ''::TEXT,
        jsonb_build_object(
            'table_type', t.table_type,
            'columns', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'column_name', c.column_name,
                        'data_type', c.data_type,
                        'is_nullable', c.is_nullable,
                        'column_default', c.column_default,
                        'ordinal_position', c.ordinal_position,
                        'character_maximum_length', c.character_maximum_length,
                        'numeric_precision', c.numeric_precision,
                        'numeric_scale', c.numeric_scale
                    )
                )
                FROM information_schema.columns c
                WHERE c.table_schema = t.table_schema 
                  AND c.table_name = t.table_name
                ORDER BY c.ordinal_position
            )
        )
    FROM information_schema.tables t
    WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime')
      AND t.table_type = 'BASE TABLE';

    -- Return views
    RETURN QUERY
    SELECT 
        v.table_schema::TEXT,
        'view'::TEXT,
        v.table_name::TEXT,
        v.view_definition::TEXT,
        jsonb_build_object(
            'is_updatable', v.is_updatable,
            'check_option', v.check_option
        )
    FROM information_schema.views v
    WHERE v.table_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime');

    -- Return functions with definitions
    RETURN QUERY
    SELECT 
        r.routine_schema::TEXT,
        'function'::TEXT,
        r.routine_name::TEXT,
        COALESCE(pg_get_functiondef(p.oid), r.routine_definition)::TEXT,
        jsonb_build_object(
            'routine_type', r.routine_type,
            'data_type', r.data_type,
            'external_language', r.external_language,
            'is_deterministic', r.is_deterministic,
            'security_type', r.security_type,
            'function_arguments', pg_get_function_arguments(p.oid),
            'return_type', pg_get_function_result(p.oid)
        )
    FROM information_schema.routines r
    LEFT JOIN pg_proc p ON p.proname = r.routine_name
    LEFT JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = r.routine_schema
    WHERE r.routine_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime')
      AND r.routine_type = 'FUNCTION';

END;
$$;


ALTER FUNCTION "public"."get_complete_schema_info"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_constraints"() RETURNS TABLE("schema_name" "text", "table_name" "text", "constraint_name" "text", "constraint_definition" "text", "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.table_schema::TEXT,
        tc.table_name::TEXT,
        tc.constraint_name::TEXT,
        pg_get_constraintdef(c.oid)::TEXT,
        jsonb_build_object(
            'constraint_type', tc.constraint_type,
            'is_deferrable', tc.is_deferrable,
            'initially_deferred', tc.initially_deferred,
            'column_names', (
                SELECT array_agg(kcu.column_name ORDER BY kcu.ordinal_position)
                FROM information_schema.key_column_usage kcu
                WHERE kcu.constraint_name = tc.constraint_name
                  AND kcu.table_schema = tc.table_schema
                  AND kcu.table_name = tc.table_name
            )
        )
    FROM information_schema.table_constraints tc
    LEFT JOIN pg_constraint c ON c.conname = tc.constraint_name
    WHERE tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime');
END;
$$;


ALTER FUNCTION "public"."get_constraints"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cron_job_status"() RETURNS TABLE("jobname" "text", "schedule" "text", "active" boolean, "last_run" timestamp without time zone, "next_run" timestamp without time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Simple approach: just return basic cron job info if table exists
  -- If cron.job table doesn't exist, return empty result
  BEGIN
    RETURN QUERY
    SELECT 
      COALESCE(j.jobname, '')::TEXT,
      COALESCE(j.schedule, '')::TEXT,
      COALESCE(j.active, false)::BOOLEAN,
      l.started_at::TIMESTAMP as last_run,
      NULL::TIMESTAMP as next_run
    FROM cron.job j
    LEFT JOIN (
      SELECT DISTINCT ON (job_name) job_name, started_at
      FROM cron_job_logs
      ORDER BY job_name, started_at DESC
    ) l ON j.jobname = l.job_name
    ORDER BY j.jobname;
  EXCEPTION 
    WHEN undefined_table THEN
      -- If cron.job doesn't exist, return empty result
      RETURN;
  END;
END;
$$;


ALTER FUNCTION "public"."get_cron_job_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_database_stats"() RETURNS TABLE("stat_name" "text", "stat_value" "text", "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Table statistics
    RETURN QUERY
    SELECT 
        'table_count'::TEXT,
        count(*)::TEXT,
        jsonb_build_object('type', 'table_statistics')
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime')
      AND table_type = 'BASE TABLE';

    -- Database size
    RETURN QUERY
    SELECT 
        'database_size'::TEXT,
        pg_size_pretty(pg_database_size(current_database()))::TEXT,
        jsonb_build_object('type', 'size_statistics');

    -- Version info
    RETURN QUERY
    SELECT 
        'postgresql_version'::TEXT,
        version()::TEXT,
        jsonb_build_object('type', 'version_info');

END;
$$;


ALTER FUNCTION "public"."get_database_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_effective_category"("p_category_id" "uuid", "p_subcategory_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF p_subcategory_id IS NOT NULL THEN
        -- Return the parent category of the subcategory
        RETURN (SELECT category_id FROM subcategories WHERE id = p_subcategory_id);
    ELSE
        -- Return the category directly
        RETURN p_category_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_effective_category"("p_category_id" "uuid", "p_subcategory_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_effective_category"("p_category_id" "uuid", "p_subcategory_id" "uuid") IS 'Returns the effective category ID - either the direct category or the parent of a subcategory';



CREATE OR REPLACE FUNCTION "public"."get_emi_overview"("p_user_id" "uuid") RETURNS TABLE("total_active_loans" integer, "total_outstanding_amount" numeric, "total_monthly_emi" numeric, "overdue_payments" integer, "overdue_amount" numeric, "next_payment_date" "date", "next_payment_amount" numeric, "total_paid_this_month" numeric, "total_pending_this_month" numeric, "purchase_emi_count" integer, "purchase_emi_outstanding" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_date DATE := CURRENT_DATE;
    v_month_start DATE := DATE_TRUNC('month', v_current_date);
    v_month_end DATE := (DATE_TRUNC('month', v_current_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
    RETURN QUERY
    WITH loan_stats AS (
        SELECT 
            COUNT(CASE WHEN status = 'active' THEN 1 END)::INTEGER as active_loans,
            COALESCE(SUM(CASE WHEN status = 'active' THEN outstanding_amount ELSE 0 END), 0) as total_outstanding,
            COALESCE(SUM(CASE WHEN status = 'active' THEN emi_amount ELSE 0 END), 0) as monthly_emi,
            COUNT(CASE WHEN status = 'active' AND type = 'purchase_emi' THEN 1 END)::INTEGER as purchase_count,
            COALESCE(SUM(CASE WHEN status = 'active' AND type = 'purchase_emi' THEN outstanding_amount ELSE 0 END), 0) as purchase_outstanding
        FROM loans
        WHERE user_id = p_user_id
    ),
    overdue_stats AS (
        SELECT 
            COUNT(*)::INTEGER as overdue_count,
            COALESCE(SUM(emi_amount), 0) as overdue_amt
        FROM emi_schedules
        WHERE user_id = p_user_id
        AND is_paid = FALSE
        AND due_date < v_current_date
    ),
    next_payment AS (
        SELECT 
            due_date,
            emi_amount
        FROM emi_schedules
        WHERE user_id = p_user_id
        AND is_paid = FALSE
        AND due_date >= v_current_date
        ORDER BY due_date ASC
        LIMIT 1
    ),
    monthly_payments AS (
        SELECT 
            COALESCE(SUM(CASE WHEN is_paid = TRUE THEN emi_amount ELSE 0 END), 0) as paid_amount,
            COALESCE(SUM(CASE WHEN is_paid = FALSE THEN emi_amount ELSE 0 END), 0) as pending_amount
        FROM emi_schedules
        WHERE user_id = p_user_id
        AND due_date >= v_month_start
        AND due_date <= v_month_end
    )
    SELECT 
        COALESCE(ls.active_loans, 0),
        COALESCE(ls.total_outstanding, 0),
        COALESCE(ls.monthly_emi, 0),
        COALESCE(os.overdue_count, 0),
        COALESCE(os.overdue_amt, 0),
        np.due_date,
        COALESCE(np.emi_amount, 0),
        COALESCE(mp.paid_amount, 0),
        COALESCE(mp.pending_amount, 0),
        COALESCE(ls.purchase_count, 0),
        COALESCE(ls.purchase_outstanding, 0)
    FROM loan_stats ls
    LEFT JOIN overdue_stats os ON TRUE
    LEFT JOIN next_payment np ON TRUE
    LEFT JOIN monthly_payments mp ON TRUE;
END;
$$;


ALTER FUNCTION "public"."get_emi_overview"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_emi_overview"("p_user_id" "uuid", "p_currency" character varying DEFAULT 'BDT'::character varying) RETURNS TABLE("total_active_loans" integer, "total_outstanding_amount" numeric, "total_monthly_emi" numeric, "overdue_payments" integer, "overdue_amount" numeric, "next_payment_date" "date", "next_payment_amount" numeric, "total_paid_this_month" numeric, "total_pending_this_month" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Loan summary
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM loans 
            WHERE user_id = p_user_id 
            AND status = 'active' 
            AND currency = p_currency
        ), 0) as total_active_loans,
        
        COALESCE((
            SELECT SUM(outstanding_amount)
            FROM loans 
            WHERE user_id = p_user_id 
            AND status = 'active' 
            AND currency = p_currency
        ), 0) as total_outstanding_amount,
        
        COALESCE((
            SELECT SUM(emi_amount)
            FROM loans 
            WHERE user_id = p_user_id 
            AND status = 'active' 
            AND currency = p_currency
        ), 0) as total_monthly_emi,
        
        -- Overdue summary (check if emi_schedules table exists)
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = false 
            AND es.due_date < CURRENT_DATE
            AND l.currency = p_currency
            AND l.status = 'active'
        ), 0) as overdue_payments,
        
        COALESCE((
            SELECT SUM(es.emi_amount)
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = false 
            AND es.due_date < CURRENT_DATE
            AND l.currency = p_currency
            AND l.status = 'active'
        ), 0) as overdue_amount,
        
        -- Next payment (using loans table if emi_schedules is empty)
        COALESCE((
            SELECT es.due_date
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = false 
            AND l.currency = p_currency
            AND l.status = 'active'
            ORDER BY es.due_date ASC
            LIMIT 1
        ), (
            SELECT next_due_date
            FROM loans
            WHERE user_id = p_user_id 
            AND status = 'active'
            AND currency = p_currency
            AND next_due_date IS NOT NULL
            ORDER BY next_due_date ASC
            LIMIT 1
        )) as next_payment_date,
        
        COALESCE((
            SELECT es.emi_amount
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = false 
            AND l.currency = p_currency
            AND l.status = 'active'
            ORDER BY es.due_date ASC
            LIMIT 1
        ), (
            SELECT emi_amount
            FROM loans
            WHERE user_id = p_user_id 
            AND status = 'active'
            AND currency = p_currency
            AND next_due_date IS NOT NULL
            ORDER BY next_due_date ASC
            LIMIT 1
        )) as next_payment_amount,
        
        -- Monthly summary
        COALESCE((
            SELECT SUM(es.emi_amount)
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = true
            AND EXTRACT(MONTH FROM es.due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM es.due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND l.currency = p_currency
            AND l.status = 'active'
        ), 0) as total_paid_this_month,
        
        COALESCE((
            SELECT SUM(es.emi_amount)
            FROM emi_schedules es
            JOIN loans l ON es.loan_id = l.id
            WHERE es.user_id = p_user_id 
            AND es.is_paid = false
            AND EXTRACT(MONTH FROM es.due_date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM es.due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND l.currency = p_currency
            AND l.status = 'active'
        ), 0) as total_pending_this_month;
END;
$$;


ALTER FUNCTION "public"."get_emi_overview"("p_user_id" "uuid", "p_currency" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_family_account_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    family_id UUID;
    account_count INTEGER;
BEGIN
    -- Get user's family group ID
    SELECT family_group_id INTO family_id
    FROM profiles 
    WHERE user_id = p_user_id;
    
    -- If not in a family, count only user's accounts
    IF family_id IS NULL THEN
        SELECT COUNT(*) INTO account_count
        FROM accounts 
        WHERE user_id = p_user_id AND is_active = true;
    ELSE
        -- Count all family members' accounts
        SELECT COUNT(*) INTO account_count
        FROM accounts a
        INNER JOIN profiles p ON a.user_id = p.user_id
        WHERE p.family_group_id = family_id AND a.is_active = true;
    END IF;
    
    RETURN COALESCE(account_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_family_account_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_family_members"("p_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "full_name" "text", "email" "text", "family_role" "public"."family_role_type", "joined_at" timestamp with time zone, "account_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    family_id UUID;
BEGIN
    -- Get user's family group
    SELECT family_group_id INTO family_id
    FROM profiles 
    WHERE user_id = p_user_id;
    
    IF family_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        p.user_id,
        p.full_name,
        p.email,
        p.family_role,
        p.joined_family_at,
        COUNT(a.id)::INTEGER as account_count
    FROM profiles p
    LEFT JOIN accounts a ON p.user_id = a.user_id AND a.is_active = true
    WHERE p.family_group_id = family_id
    GROUP BY p.user_id, p.full_name, p.email, p.family_role, p.joined_family_at
    ORDER BY p.family_role, p.joined_family_at;
END;
$$;


ALTER FUNCTION "public"."get_family_members"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_financial_summary"("p_user_id" "uuid", "p_currency" character varying DEFAULT 'USD'::character varying) RETURNS TABLE("total_balance" numeric, "monthly_income" numeric, "monthly_expenses" numeric, "monthly_savings" numeric, "total_investments" numeric, "total_loans" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
        FROM transactions 
        WHERE user_id = p_user_id 
        AND currency = p_currency
        AND date >= DATE_TRUNC('month', CURRENT_DATE)
    )
    SELECT 
        COALESCE((SELECT SUM(balance) FROM accounts WHERE (user_id = p_user_id OR user_id IS NULL) AND currency = p_currency AND include_in_total = true), 0),
        md.income,
        md.expenses,
        md.income - md.expenses,
        COALESCE((SELECT SUM(units * current_price) FROM investments WHERE user_id = p_user_id AND currency = p_currency), 0),
        COALESCE((SELECT SUM(outstanding_amount) FROM loans WHERE user_id = p_user_id AND currency = p_currency AND status = 'active'), 0)
    FROM monthly_data md;
END;
$$;


ALTER FUNCTION "public"."get_financial_summary"("p_user_id" "uuid", "p_currency" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_indexes"() RETURNS TABLE("schema_name" "text", "table_name" "text", "index_name" "text", "index_definition" "text", "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.schemaname::TEXT,
        pi.tablename::TEXT,
        pi.indexname::TEXT,
        pi.indexdef::TEXT,
        jsonb_build_object(
            'is_unique', idx.indisunique,
            'is_primary', idx.indisprimary,
            'columns', array_to_string(idx.indkey::int[], ',')
        )
    FROM pg_indexes pi
    LEFT JOIN pg_index idx ON idx.indexrelid = (
        SELECT oid FROM pg_class WHERE relname = pi.indexname
    )
    WHERE pi.schemaname NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime')
      AND NOT pi.indexname LIKE 'pg_%';
END;
$$;


ALTER FUNCTION "public"."get_indexes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_investment_analytics_summary"("p_user_id" "uuid") RETURNS TABLE("total_portfolios" integer, "total_investments" integer, "total_invested" numeric, "current_value" numeric, "total_gain_loss" numeric, "total_return_percentage" numeric, "best_performing_investment" "jsonb", "worst_performing_investment" "jsonb", "active_sips" integer, "monthly_sip_amount" numeric, "recent_transactions" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    portfolio_count INTEGER;
    investment_count INTEGER;
    invested_total DECIMAL;
    current_total DECIMAL;
    gain_loss_total DECIMAL;
    return_pct DECIMAL;
    best_investment JSONB;
    worst_investment JSONB;
    sip_count INTEGER;
    sip_monthly DECIMAL;
    recent_trans JSONB;
BEGIN
    -- Get basic portfolio and investment counts
    SELECT COUNT(*) INTO portfolio_count
    FROM investment_portfolios 
    WHERE user_id = p_user_id AND is_active = true;
    
    SELECT COUNT(*) INTO investment_count
    FROM investments 
    WHERE user_id = p_user_id AND status = 'active';
    
    -- Get financial totals
    SELECT 
        COALESCE(SUM(total_invested), 0),
        COALESCE(SUM(current_value), 0)
    INTO invested_total, current_total
    FROM investments 
    WHERE user_id = p_user_id AND status = 'active';
    
    gain_loss_total := current_total - invested_total;
    return_pct := CASE 
        WHEN invested_total > 0 
        THEN (gain_loss_total / invested_total * 100)
        ELSE 0 
    END;
    
    -- Get best performing investment
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'type', type,
        'gain_loss_percentage', gain_loss_percentage,
        'current_value', current_value
    ) INTO best_investment
    FROM investments 
    WHERE user_id = p_user_id 
    AND status = 'active'
    AND gain_loss_percentage IS NOT NULL
    ORDER BY gain_loss_percentage DESC
    LIMIT 1;
    
    -- Get worst performing investment
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'type', type,
        'gain_loss_percentage', gain_loss_percentage,
        'current_value', current_value
    ) INTO worst_investment
    FROM investments 
    WHERE user_id = p_user_id 
    AND status = 'active'
    AND gain_loss_percentage IS NOT NULL
    ORDER BY gain_loss_percentage ASC
    LIMIT 1;
    
    -- Get SIP data
    SELECT COUNT(*) INTO sip_count
    FROM investment_templates 
    WHERE user_id = p_user_id AND is_active = true;
    
    SELECT COALESCE(SUM(
        CASE frequency
            WHEN 'daily' THEN amount_per_investment * 30
            WHEN 'weekly' THEN amount_per_investment * 4.33
            WHEN 'biweekly' THEN amount_per_investment * 2.17
            WHEN 'monthly' THEN amount_per_investment
            WHEN 'quarterly' THEN amount_per_investment / 3
            WHEN 'yearly' THEN amount_per_investment / 12
            ELSE 0
        END
    ), 0) INTO sip_monthly
    FROM investment_templates 
    WHERE user_id = p_user_id AND is_active = true;
    
    -- Get recent transactions
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'investment_name', COALESCE(i.name, 'Unknown'),
            'transaction_type', t.type,
            'amount', t.total_amount,
            'transaction_date', t.transaction_date,
            'currency', t.currency
        )
        ORDER BY t.transaction_date DESC
    ) INTO recent_trans
    FROM investment_transactions t
    LEFT JOIN investments i ON t.investment_id = i.id
    WHERE t.user_id = p_user_id
    LIMIT 10;
    
    RETURN QUERY SELECT 
        portfolio_count,
        investment_count,
        invested_total,
        current_total,
        gain_loss_total,
        return_pct,
        best_investment,
        worst_investment,
        sip_count,
        sip_monthly,
        recent_trans;
END;
$$;


ALTER FUNCTION "public"."get_investment_analytics_summary"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_investment_analytics_summary"("p_user_id" "uuid") IS 'Returns comprehensive analytics summary for investment dashboard with key metrics';



CREATE OR REPLACE FUNCTION "public"."get_lending_overview"("p_user_id" "uuid", "p_currency" character varying DEFAULT 'BDT'::character varying) RETURNS TABLE("total_lent_amount" numeric, "total_borrowed_amount" numeric, "total_lent_pending" numeric, "total_borrowed_pending" numeric, "overdue_lent_count" integer, "overdue_borrowed_count" integer, "overdue_lent_amount" numeric, "overdue_borrowed_amount" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((
            SELECT SUM(amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'lent' 
            AND currency = p_currency
        ), 0) as total_lent_amount,
        
        COALESCE((
            SELECT SUM(amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'borrowed' 
            AND currency = p_currency
        ), 0) as total_borrowed_amount,
        
        COALESCE((
            SELECT SUM(pending_amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'lent' 
            AND status IN ('pending', 'partial') 
            AND currency = p_currency
        ), 0) as total_lent_pending,
        
        COALESCE((
            SELECT SUM(pending_amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'borrowed' 
            AND status IN ('pending', 'partial') 
            AND currency = p_currency
        ), 0) as total_borrowed_pending,
        
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'lent' 
            AND status = 'overdue' 
            AND currency = p_currency
        ), 0) as overdue_lent_count,
        
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'borrowed' 
            AND status = 'overdue' 
            AND currency = p_currency
        ), 0) as overdue_borrowed_count,
        
        COALESCE((
            SELECT SUM(pending_amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'lent' 
            AND status = 'overdue' 
            AND currency = p_currency
        ), 0) as overdue_lent_amount,
        
        COALESCE((
            SELECT SUM(pending_amount) 
            FROM lending 
            WHERE user_id = p_user_id 
            AND type = 'borrowed' 
            AND status = 'overdue' 
            AND currency = p_currency
        ), 0) as overdue_borrowed_amount;
END;
$$;


ALTER FUNCTION "public"."get_lending_overview"("p_user_id" "uuid", "p_currency" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monthly_trend_data"("p_user_id" "uuid", "p_currency" character varying DEFAULT 'BDT'::character varying, "p_months_back" integer DEFAULT 12) RETURNS TABLE("month" "text", "month_name" "text", "invested" numeric, "current_value" numeric, "gain_loss" numeric, "return_percentage" numeric, "transaction_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            DATE_TRUNC('month', t.transaction_date) as month_date,
            SUM(CASE 
                WHEN t.type = 'buy' THEN t.total_amount 
                ELSE 0 
            END) as monthly_invested,
            COUNT(*) as monthly_transactions
        FROM investment_transactions t
        WHERE t.user_id = p_user_id
        AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * p_months_back)
        GROUP BY DATE_TRUNC('month', t.transaction_date)
    ),
    current_values AS (
        SELECT 
            md.month_date,
            md.monthly_invested,
            md.monthly_transactions,
            COALESCE(
                SUM(
                    CASE 
                        WHEN i.current_value > 0 
                        THEN (t.total_amount / t.price_per_unit * i.current_price)
                        ELSE t.total_amount 
                    END
                ), 0
            ) as estimated_current_value
        FROM monthly_data md
        LEFT JOIN investment_transactions t ON DATE_TRUNC('month', t.transaction_date) = md.month_date
        LEFT JOIN investments i ON t.investment_id = i.id
        WHERE t.user_id = p_user_id AND t.type = 'buy'
        GROUP BY md.month_date, md.monthly_invested, md.monthly_transactions
    )
    SELECT 
        TO_CHAR(cv.month_date, 'YYYY-MM')::TEXT as month,
        TO_CHAR(cv.month_date, 'Mon')::TEXT as month_name,
        COALESCE(cv.monthly_invested, 0)::DECIMAL as invested,
        COALESCE(cv.estimated_current_value, 0)::DECIMAL as current_value,
        COALESCE(cv.estimated_current_value - cv.monthly_invested, 0)::DECIMAL as gain_loss,
        CASE 
            WHEN cv.monthly_invested > 0 
            THEN ((cv.estimated_current_value - cv.monthly_invested) / cv.monthly_invested * 100)::DECIMAL
            ELSE 0::DECIMAL
        END as return_percentage,
        COALESCE(cv.monthly_transactions, 0)::INTEGER as transaction_count
    FROM current_values cv
    ORDER BY cv.month_date;
END;
$$;


ALTER FUNCTION "public"."get_monthly_trend_data"("p_user_id" "uuid", "p_currency" character varying, "p_months_back" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_monthly_trend_data"("p_user_id" "uuid", "p_currency" character varying, "p_months_back" integer) IS 'Returns monthly investment trend data for bar/line charts showing growth over time';



CREATE OR REPLACE FUNCTION "public"."get_portfolio_performance_data"("p_user_id" "uuid", "p_period" character varying DEFAULT '6m'::character varying) RETURNS TABLE("date" "text", "total_invested" numeric, "current_value" numeric, "gain_loss" numeric, "return_percentage" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    days_back INTEGER;
    date_format TEXT;
BEGIN
    -- Determine period parameters
    CASE p_period
        WHEN '1m' THEN 
            days_back := 30;
            date_format := 'YYYY-MM-DD';
        WHEN '3m' THEN 
            days_back := 90;
            date_format := 'YYYY-MM-DD';
        WHEN '6m' THEN 
            days_back := 180;
            date_format := 'YYYY-MM';
        WHEN '1y' THEN 
            days_back := 365;
            date_format := 'YYYY-MM';
        ELSE 
            days_back := 1095; -- 3 years for 'all'
            date_format := 'YYYY-MM';
    END CASE;

    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '1 day' * days_back,
            CURRENT_DATE,
            INTERVAL '1 month'
        )::DATE as period_date
    ),
    portfolio_snapshots AS (
        SELECT 
            DATE_TRUNC('month', t.transaction_date)::DATE as snapshot_date,
            SUM(CASE 
                WHEN t.type = 'buy' THEN t.total_amount 
                ELSE 0 
            END) as invested_amount,
            SUM(CASE 
                WHEN t.type = 'buy' THEN t.total_amount * (i.current_price / t.price_per_unit)
                ELSE 0 
            END) as current_portfolio_value
        FROM investment_transactions t
        INNER JOIN investments i ON t.investment_id = i.id
        WHERE t.user_id = p_user_id
        AND t.transaction_date >= CURRENT_DATE - INTERVAL '1 day' * days_back
        GROUP BY DATE_TRUNC('month', t.transaction_date)::DATE
    ),
    cumulative_data AS (
        SELECT 
            ds.period_date,
            COALESCE(
                SUM(ps.invested_amount) OVER (
                    ORDER BY ds.period_date 
                    ROWS UNBOUNDED PRECEDING
                ), 0
            ) as cumulative_invested,
            COALESCE(
                SUM(ps.current_portfolio_value) OVER (
                    ORDER BY ds.period_date 
                    ROWS UNBOUNDED PRECEDING
                ), 0
            ) as cumulative_value
        FROM date_series ds
        LEFT JOIN portfolio_snapshots ps ON ds.period_date = ps.snapshot_date
    )
    SELECT 
        TO_CHAR(cd.period_date, date_format) as date,
        cd.cumulative_invested::DECIMAL as total_invested,
        cd.cumulative_value::DECIMAL as current_value,
        (cd.cumulative_value - cd.cumulative_invested)::DECIMAL as gain_loss,
        CASE 
            WHEN cd.cumulative_invested > 0 
            THEN ((cd.cumulative_value - cd.cumulative_invested) / cd.cumulative_invested * 100)::DECIMAL
            ELSE 0::DECIMAL
        END as return_percentage
    FROM cumulative_data cd
    WHERE cd.cumulative_invested > 0
    ORDER BY cd.period_date;
END;
$$;


ALTER FUNCTION "public"."get_portfolio_performance_data"("p_user_id" "uuid", "p_period" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_portfolio_performance_data"("p_user_id" "uuid", "p_period" character varying) IS 'Returns time series data for portfolio performance charts with configurable periods';



CREATE OR REPLACE FUNCTION "public"."get_purchase_emi_overview"("p_user_id" "uuid") RETURNS TABLE("total_purchase_emis" integer, "total_outstanding_amount" numeric, "total_monthly_emi" numeric, "active_purchases" integer, "by_category" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH purchase_stats AS (
        SELECT 
            COUNT(*)::INTEGER as total_count,
            COALESCE(SUM(outstanding_amount), 0) as total_outstanding,
            COALESCE(SUM(emi_amount), 0) as total_emi,
            COUNT(CASE WHEN status = 'active' THEN 1 END)::INTEGER as active_count
        FROM loans
        WHERE user_id = p_user_id AND type = 'purchase_emi'
    ),
    category_stats AS (
        SELECT COALESCE(
            jsonb_object_agg(
                COALESCE(metadata->>'purchase_category', 'other'),
                jsonb_build_object(
                    'count', cat_count,
                    'total_amount', cat_total,
                    'outstanding', cat_outstanding
                )
            ),
            '{}'::jsonb
        ) as categories
        FROM (
            SELECT 
                COALESCE(metadata->>'purchase_category', 'other') as category,
                COUNT(*) as cat_count,
                COALESCE(SUM(principal_amount), 0) as cat_total,
                COALESCE(SUM(outstanding_amount), 0) as cat_outstanding
            FROM loans
            WHERE user_id = p_user_id AND type = 'purchase_emi'
            GROUP BY COALESCE(metadata->>'purchase_category', 'other')
        ) cat_data
    )
    SELECT 
        ps.total_count,
        ps.total_outstanding,
        ps.total_emi,
        ps.active_count,
        cs.categories
    FROM purchase_stats ps
    CROSS JOIN category_stats cs;
END;
$$;


ALTER FUNCTION "public"."get_purchase_emi_overview"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_purchase_emi_overview"("p_user_id" "uuid") IS 'Returns statistics and overview of user purchase EMI loans';



CREATE OR REPLACE FUNCTION "public"."get_rls_policies"() RETURNS TABLE("schema_name" "text", "table_name" "text", "policy_name" "text", "policy_definition" "text", "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.schemaname::TEXT,
        p.tablename::TEXT,
        p.policyname::TEXT,
        pg_get_policydef(pol.oid)::TEXT,
        jsonb_build_object(
            'permissive', p.permissive,
            'roles', p.roles,
            'cmd', p.cmd,
            'qual', p.qual,
            'with_check', p.with_check
        )
    FROM pg_policies p
    LEFT JOIN pg_policy pol ON pol.polname = p.policyname
    WHERE p.schemaname NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime');
END;
$$;


ALTER FUNCTION "public"."get_rls_policies"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sequences"() RETURNS TABLE("schema_name" "text", "sequence_name" "text", "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.sequence_schema::TEXT,
        s.sequence_name::TEXT,
        jsonb_build_object(
            'data_type', s.data_type,
            'start_value', s.start_value,
            'minimum_value', s.minimum_value,
            'maximum_value', s.maximum_value,
            'increment', s.increment,
            'cycle_option', s.cycle_option
        )
    FROM information_schema.sequences s
    WHERE s.sequence_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime');
END;
$$;


ALTER FUNCTION "public"."get_sequences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_subscription_status"("p_user_id" "uuid") RETURNS TABLE("current_plan" character varying, "status" character varying, "expires_at" timestamp with time zone, "days_remaining" integer, "can_upgrade" boolean, "pending_payment_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(us.plan_name, 'free') as current_plan,
        COALESCE(us.status::VARCHAR, 'inactive') as status,
        us.current_period_end as expires_at,
        CASE 
            WHEN us.current_period_end IS NULL THEN NULL
            WHEN us.current_period_end <= CURRENT_TIMESTAMP THEN 0
            ELSE EXTRACT(days FROM (us.current_period_end - CURRENT_TIMESTAMP))::INTEGER
        END as days_remaining,
        CASE
            WHEN us.plan_name IS NULL OR us.plan_name = 'free' THEN true
            WHEN us.current_period_end <= CURRENT_TIMESTAMP THEN true
            ELSE false
        END as can_upgrade,
        sp.id as pending_payment_id
    FROM profiles p
    LEFT JOIN user_subscriptions us ON p.user_id = us.user_id
    LEFT JOIN subscription_payments sp ON p.user_id = sp.user_id 
        AND sp.status IN ('submitted', 'verified')
        AND sp.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
    WHERE p.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_subscription_status"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_triggers"() RETURNS TABLE("schema_name" "text", "table_name" "text", "trigger_name" "text", "trigger_definition" "text", "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.trigger_schema::TEXT,
        t.event_object_table::TEXT,
        t.trigger_name::TEXT,
        pg_get_triggerdef(tr.oid)::TEXT,
        jsonb_build_object(
            'event_manipulation', t.event_manipulation,
            'action_timing', t.action_timing,
            'action_orientation', t.action_orientation,
            'action_statement', t.action_statement,
            'action_condition', t.action_condition
        )
    FROM information_schema.triggers t
    LEFT JOIN pg_trigger tr ON tr.tgname = t.trigger_name
    WHERE t.trigger_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime');
END;
$$;


ALTER FUNCTION "public"."get_triggers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_account_summary"("p_user_id" "uuid") RETURNS TABLE("account_count" integer, "total_balance" numeric, "default_account_id" "uuid", "default_currency" character varying, "subscription_plan" "text", "max_accounts" integer, "can_create_more" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(a.id)::INTEGER,
        SUM(CASE WHEN a.type != 'credit_card' THEN a.balance ELSE -a.balance END),
        (SELECT id FROM accounts WHERE user_id = p_user_id AND is_default = true LIMIT 1),
        p.currency,
        p.subscription_plan,
        p.max_accounts,
        can_create_account(p_user_id)
    FROM accounts a
    CROSS JOIN profiles p
    WHERE a.user_id = p_user_id 
    AND p.user_id = p_user_id
    AND a.is_active = true
    GROUP BY p.currency, p.subscription_plan, p.max_accounts;
END;
$$;


ALTER FUNCTION "public"."get_user_account_summary"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_permissions"("p_user_id" "uuid") RETURNS TABLE("permission_name" "text", "resource" "text", "action" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH role_perms AS (
        SELECT DISTINCT
            p.name::TEXT as permission_name,
            p.resource::TEXT,
            p.action::TEXT
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN profiles pr ON rp.role_id = pr.role_id
        WHERE pr.user_id = p_user_id
    ),
    user_specific_perms AS (
        SELECT DISTINCT
            p.name::TEXT as permission_name,
            p.resource::TEXT,
            p.action::TEXT
        FROM permissions p
        JOIN user_permissions up ON p.id = up.permission_id
        WHERE up.user_id = p_user_id 
        AND up.granted = true
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    )
    SELECT * FROM role_perms
    UNION
    SELECT * FROM user_specific_perms;
END;
$$;


ALTER FUNCTION "public"."get_user_permissions"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_profile"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "email" "text", "full_name" "text", "avatar_url" "text", "currency" character varying, "timezone" "text", "theme" "text", "notifications_enabled" boolean, "ai_insights_enabled" boolean, "monthly_budget_limit" numeric, "email_verified" boolean, "phone_number" "text", "phone_verified" boolean, "two_factor_enabled" boolean, "last_login" timestamp with time zone, "is_active" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "role_name" "text", "role_display_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.currency,
        p.timezone,
        p.theme::TEXT,
        p.notifications_enabled,
        p.ai_insights_enabled,
        p.monthly_budget_limit,
        p.email_verified,
        p.phone_number,
        p.phone_verified,
        p.two_factor_enabled,
        p.last_login,
        p.is_active,
        p.created_at,
        p.updated_at,
        r.name::TEXT as role_name,
        r.display_name::TEXT as role_display_name
    FROM profiles p
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE p.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tables"("p_user_id" "uuid") RETURNS TABLE("table_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
    BEGIN
        RETURN QUERY
        SELECT unnest(ARRAY[
            'profiles', 'categories', 'subcategories', 'accounts', 'transactions', 'budgets', 'budget_templates',
            'investment_portfolios', 'investments', 'investment_transactions', 'investment_templates', 
            'investment_price_history', 'investment_performance_snapshots',
            'loans', 'lending', 'emi_payments', 'emi_schedules', 'lending_payments', 'emi_templates',
            'recurring_transactions', 'notifications', 'ai_insights', 'user_sessions', 'admin_audit_logs'
        ])::TEXT;
    END;
    $$;


ALTER FUNCTION "public"."get_user_tables"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    default_role_id UUID;
    user_full_name TEXT;
BEGIN
    -- Get the default user role ID
    SELECT id INTO default_role_id FROM public.roles WHERE name = 'user';
    
    -- Determine full name: use raw_user_meta_data if available, otherwise extract from email
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        SPLIT_PART(NEW.email, '@', 1)
    );

    -- Insert into profiles table
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name, 
        avatar_url, 
        role_id,
        currency,
        timezone,
        theme,
        notifications_enabled,
        ai_insights_enabled,
        email_verified
    )
    VALUES (
        NEW.id, 
        NEW.email,
        user_full_name, 
        NEW.raw_user_meta_data->>'avatar_url',
        default_role_id,
        'BDT',
        'Asia/Dhaka', 
        'system',
        true,
        true,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    );

    -- NOTE: No longer creating user-specific accounts - they will use global accounts
    
    RAISE NOTICE 'Successfully created profile for user: % with email: %', NEW.id, NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile for user %: % - %', NEW.id, SQLERRM, SQLSTATE;
        -- Still return NEW so user creation doesn't fail
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_resource" "text", "p_action" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.get_user_permissions(p_user_id)
        WHERE resource = p_resource 
        AND action = p_action
    );
END;
$$;


ALTER FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_resource" "text", "p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_coupon_usage"("coupon_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE coupons
  SET
    used_count = used_count + 1,
    updated_at = NOW()
  WHERE id = coupon_id;
END;
$$;


ALTER FUNCTION "public"."increment_coupon_usage"("coupon_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_template_usage"("template_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE budget_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$;


ALTER FUNCTION "public"."increment_template_usage"("template_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_family_member"("p_inviter_id" "uuid", "p_email" "text", "p_role" "public"."family_role_type" DEFAULT 'member'::"public"."family_role_type") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    family_id UUID;
    invitation_code TEXT;
BEGIN
    -- Get inviter's family group
    SELECT family_group_id INTO family_id
    FROM profiles 
    WHERE user_id = p_inviter_id AND family_role = 'primary';
    
    IF family_id IS NULL THEN
        RAISE EXCEPTION 'User is not a family primary or not in a family group';
    END IF;
    
    -- Generate unique invitation code
    invitation_code := UPPER(substr(md5(random()::text), 1, 8));
    
    -- Create invitation
    INSERT INTO family_invitations (
        family_group_id, 
        invited_by, 
        email, 
        role, 
        invitation_code
    ) VALUES (
        family_id, 
        p_inviter_id, 
        p_email, 
        p_role, 
        invitation_code
    );
    
    RETURN invitation_code;
END;
$$;


ALTER FUNCTION "public"."invite_family_member"("p_inviter_id" "uuid", "p_email" "text", "p_role" "public"."family_role_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_family_primary"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_role family_role_type;
BEGIN
    SELECT family_role INTO user_role
    FROM profiles 
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(user_role, 'primary') = 'primary';
END;
$$;


ALTER FUNCTION "public"."is_family_primary"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_emi_payment_paid"("p_schedule_id" "uuid", "p_user_id" "uuid", "p_payment_amount" numeric, "p_payment_date" "date" DEFAULT CURRENT_DATE, "p_payment_method" character varying DEFAULT NULL::character varying, "p_late_fee" numeric DEFAULT 0, "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_schedule_record RECORD;
    v_payment_id UUID;
    v_loan_record RECORD;
BEGIN
    -- Get schedule record
    SELECT * INTO v_schedule_record 
    FROM emi_schedules 
    WHERE id = p_schedule_id AND user_id = p_user_id AND is_paid = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'EMI schedule not found or already paid';
    END IF;
    
    -- Get loan record
    SELECT * INTO v_loan_record 
    FROM loans 
    WHERE id = v_schedule_record.loan_id AND user_id = p_user_id;
    
    -- Create EMI payment record
    INSERT INTO emi_payments (
        user_id,
        loan_id,
        payment_date,
        amount,
        principal_amount,
        interest_amount,
        outstanding_balance,
        is_paid,
        payment_method,
        late_fee,
        notes
    ) VALUES (
        p_user_id,
        v_schedule_record.loan_id,
        p_payment_date,
        p_payment_amount,
        v_schedule_record.principal_amount,
        v_schedule_record.interest_amount,
        v_schedule_record.outstanding_balance,
        true,
        p_payment_method,
        p_late_fee,
        p_notes
    ) RETURNING id INTO v_payment_id;
    
    -- Update schedule as paid
    UPDATE emi_schedules 
    SET 
        is_paid = true,
        payment_date = p_payment_date,
        actual_payment_amount = p_payment_amount,
        late_fee = p_late_fee,
        payment_id = v_payment_id,
        updated_at = NOW()
    WHERE id = p_schedule_id;
    
    -- Update loan outstanding amount and last payment date
    UPDATE loans 
    SET 
        outstanding_amount = outstanding_amount - v_schedule_record.principal_amount,
        last_payment_date = p_payment_date,
        next_due_date = CASE 
            WHEN outstanding_amount - v_schedule_record.principal_amount <= 0 THEN NULL
            ELSE (
                SELECT MIN(due_date) 
                FROM emi_schedules 
                WHERE loan_id = v_loan_record.id AND is_paid = false AND id != p_schedule_id
            )
        END,
        status = CASE 
            WHEN outstanding_amount - v_schedule_record.principal_amount <= 0 THEN 'closed'::loan_status
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = v_schedule_record.loan_id;
    
    RETURN v_payment_id;
END;
$$;


ALTER FUNCTION "public"."mark_emi_payment_paid"("p_schedule_id" "uuid", "p_user_id" "uuid", "p_payment_amount" numeric, "p_payment_date" "date", "p_payment_method" character varying, "p_late_fee" numeric, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_auto_debit_payments"("p_user_id" "uuid", "p_process_date" "date" DEFAULT CURRENT_DATE) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_loan_record RECORD;
  v_processed INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_result JSON;
BEGIN
  -- Process all loans with auto_debit enabled that are due today
  FOR v_loan_record IN 
    SELECT * FROM loans 
    WHERE user_id = p_user_id 
      AND status = 'active' 
      AND auto_debit = true 
      AND next_due_date = p_process_date
  LOOP
    -- Process payment for this loan
    SELECT create_loan_payment_transaction(v_loan_record.id, p_user_id, p_process_date) INTO v_result;
    
    IF (v_result->>'success')::BOOLEAN THEN
      v_processed := v_processed + 1;
    ELSE
      v_errors := array_append(v_errors, v_loan_record.lender || ': ' || (v_result->>'error'));
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'processed', v_processed,
    'errors', v_errors,
    'date', p_process_date
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."process_auto_debit_payments"("p_user_id" "uuid", "p_process_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_daily_auto_payments"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_record RECORD;
  v_total_users INTEGER := 0;
  v_total_loan_payments INTEGER := 0;
  v_total_lending_payments INTEGER := 0;
  v_total_reminders INTEGER := 0;
  v_today DATE := CURRENT_DATE;
  v_start_time TIMESTAMP := NOW();
  v_payment_result JSON;
  v_lending_result JSON;
  v_reminder_result JSON;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Log start of processing
  INSERT INTO cron_job_logs (
    job_name,
    status,
    message,
    started_at
  ) VALUES (
    'daily_auto_payments',
    'running',
    'Starting daily auto payment processing for ' || v_today,
    v_start_time
  );
  
  -- Process all users with auto debit loans or lending due today
  FOR v_user_record IN 
    SELECT DISTINCT u.user_id, u.email
    FROM (
      -- Users with auto debit loans due today
      SELECT l.user_id, p.email
      FROM loans l
      JOIN auth.users p ON l.user_id = p.id
      WHERE l.status = 'active' 
        AND l.auto_debit = true 
        AND l.next_due_date = v_today
      
      UNION
      
      -- Users with auto debit lending due today
      SELECT l.user_id, p.email
      FROM lending l
      JOIN auth.users p ON l.user_id = p.id
      WHERE l.status IN ('pending', 'partial')
        AND l.auto_debit = true 
        AND l.due_date = v_today
      
      UNION
      
      -- Users with loans needing reminders today
      SELECT l.user_id, p.email
      FROM loans l
      JOIN auth.users p ON l.user_id = p.id
      WHERE l.status = 'active' 
        AND l.next_due_date = v_today + INTERVAL '1 day' * COALESCE(l.reminder_days, 3)
        
      UNION
      
      -- Users with lending needing reminders today
      SELECT l.user_id, p.email
      FROM lending l
      JOIN auth.users p ON l.user_id = p.id
      WHERE l.status IN ('pending', 'partial')
        AND l.due_date = v_today + INTERVAL '1 day' * COALESCE(l.reminder_days, 7)
    ) u
  LOOP
    v_total_users := v_total_users + 1;
    
    BEGIN
      -- Process auto debit loan payments
      SELECT process_auto_debit_payments(v_user_record.user_id, v_today) INTO v_payment_result;
      v_total_loan_payments := v_total_loan_payments + COALESCE((v_payment_result->>'payments_processed')::INTEGER, 0);
      
      -- Process auto debit lending payments
      SELECT process_lending_auto_debit_payments(v_user_record.user_id, v_today) INTO v_lending_result;
      v_total_lending_payments := v_total_lending_payments + COALESCE((v_lending_result->>'payments_processed')::INTEGER, 0);
      
      -- Create payment reminders (for both loans and lending)
      SELECT create_payment_reminders(v_user_record.user_id, v_today) INTO v_reminder_result;
      v_total_reminders := v_total_reminders + COALESCE((v_reminder_result->>'reminders_created')::INTEGER, 0);
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := array_append(v_errors, 'Error processing user ' || v_user_record.email || ': ' || SQLERRM);
    END;
  END LOOP;

  -- Log completion
  UPDATE cron_job_logs SET
    status = CASE WHEN array_length(v_errors, 1) > 0 THEN 'completed_with_errors' ELSE 'completed' END,
    message = 'Processed ' || v_total_users || ' users, ' || v_total_loan_payments || ' loan payments, ' || v_total_lending_payments || ' lending payments, ' || v_total_reminders || ' reminders',
    completed_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER,
    payments_processed = v_total_loan_payments + v_total_lending_payments,
    reminders_created = v_total_reminders,
    errors_count = COALESCE(array_length(v_errors, 1), 0),
    metadata = json_build_object('errors', v_errors)
  WHERE job_name = 'daily_auto_payments' 
    AND started_at = v_start_time;

  RETURN json_build_object(
    'success', true,
    'users_processed', v_total_users,
    'loan_payments_processed', v_total_loan_payments,
    'lending_payments_processed', v_total_lending_payments,
    'total_payments_processed', v_total_loan_payments + v_total_lending_payments,
    'reminders_created', v_total_reminders,
    'errors_count', COALESCE(array_length(v_errors, 1), 0),
    'errors', v_errors
  );
END;
$$;


ALTER FUNCTION "public"."process_daily_auto_payments"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_lending_auto_debit_payments"("p_user_id" "uuid", "p_date" "date" DEFAULT CURRENT_DATE) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_lending_record RECORD;
  v_payment_result JSON;
  v_payments_processed INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Process auto debit lending for the user
  FOR v_lending_record IN 
    SELECT id, person_name, pending_amount, type
    FROM lending 
    WHERE user_id = p_user_id 
      AND status IN ('pending', 'partial')
      AND auto_debit = true 
      AND due_date = p_date
  LOOP
    BEGIN
      -- Process payment for this lending
      SELECT create_lending_payment_transaction(v_lending_record.id, p_user_id, p_date) INTO v_payment_result;
      
      IF (v_payment_result->>'success')::BOOLEAN THEN
        v_payments_processed := v_payments_processed + 1;
      ELSE
        v_errors := array_append(v_errors, 
          'Failed to process payment for ' || v_lending_record.person_name || ': ' || (v_payment_result->>'error'));
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := array_append(v_errors, 
          'Error processing payment for ' || v_lending_record.person_name || ': ' || SQLERRM);
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'payments_processed', v_payments_processed,
    'errors_count', array_length(v_errors, 1),
    'errors', v_errors
  );
END;
$$;


ALTER FUNCTION "public"."process_lending_auto_debit_payments"("p_user_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reverse_account_balance"("p_account_id" "uuid", "p_amount" numeric, "p_transaction_type" "public"."transaction_type") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Reverse account balance based on transaction type
    IF p_transaction_type = 'income' THEN
        UPDATE accounts 
        SET balance = balance - p_amount,
            updated_at = NOW()
        WHERE id = p_account_id;
    ELSIF p_transaction_type = 'expense' THEN
        UPDATE accounts 
        SET balance = balance + p_amount,
            updated_at = NOW()
        WHERE id = p_account_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."reverse_account_balance"("p_account_id" "uuid", "p_amount" numeric, "p_transaction_type" "public"."transaction_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revert_coupon_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."revert_coupon_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_coupon_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."track_coupon_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_auto_payments_now"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN process_daily_auto_payments();
END;
$$;


ALTER FUNCTION "public"."trigger_auto_payments_now"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_account_balance_on_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Reverse account balance when transaction is deleted
    IF OLD.account_id IS NOT NULL THEN
        PERFORM reverse_account_balance(OLD.account_id, OLD.amount, OLD.type);
    END IF;
    
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."trigger_update_account_balance_on_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_account_balance_on_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update account balance when transaction is created
    IF NEW.account_id IS NOT NULL THEN
        PERFORM update_account_balance(NEW.account_id, NEW.amount, NEW.type);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_update_account_balance_on_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_account_balance_on_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Reverse old balance if account or amount changed
    IF OLD.account_id IS NOT NULL AND (
        OLD.account_id != NEW.account_id OR 
        OLD.amount != NEW.amount OR 
        OLD.type != NEW.type
    ) THEN
        PERFORM reverse_account_balance(OLD.account_id, OLD.amount, OLD.type);
    END IF;
    
    -- Apply new balance
    IF NEW.account_id IS NOT NULL THEN
        PERFORM update_account_balance(NEW.account_id, NEW.amount, NEW.type);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_update_account_balance_on_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_account_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + CASE 
                WHEN NEW.type = 'income' THEN NEW.amount 
                WHEN NEW.type = 'expense' THEN -NEW.amount
                WHEN NEW.type = 'transfer' THEN -NEW.amount
                ELSE 0
            END
            WHERE id = NEW.account_id;
        END IF;
        
        -- Handle transfer to account
        IF NEW.type = 'transfer' AND NEW.transfer_to_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + NEW.amount
            WHERE id = NEW.transfer_to_account_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Revert old transaction effect
        IF OLD.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - CASE 
                WHEN OLD.type = 'income' THEN OLD.amount 
                WHEN OLD.type = 'expense' THEN -OLD.amount
                WHEN OLD.type = 'transfer' THEN -OLD.amount
                ELSE 0
            END
            WHERE id = OLD.account_id;
        END IF;
        
        IF OLD.type = 'transfer' AND OLD.transfer_to_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - OLD.amount
            WHERE id = OLD.transfer_to_account_id;
        END IF;
        
        -- Apply new transaction effect
        IF NEW.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + CASE 
                WHEN NEW.type = 'income' THEN NEW.amount 
                WHEN NEW.type = 'expense' THEN -NEW.amount
                WHEN NEW.type = 'transfer' THEN -NEW.amount
                ELSE 0
            END
            WHERE id = NEW.account_id;
        END IF;
        
        IF NEW.type = 'transfer' AND NEW.transfer_to_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance + NEW.amount
            WHERE id = NEW.transfer_to_account_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - CASE 
                WHEN OLD.type = 'income' THEN OLD.amount 
                WHEN OLD.type = 'expense' THEN -OLD.amount
                WHEN OLD.type = 'transfer' THEN -OLD.amount
                ELSE 0
            END
            WHERE id = OLD.account_id;
        END IF;
        
        IF OLD.type = 'transfer' AND OLD.transfer_to_account_id IS NOT NULL THEN
            UPDATE accounts 
            SET balance = balance - OLD.amount
            WHERE id = OLD.transfer_to_account_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_account_balance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_account_balance"("p_account_id" "uuid", "p_amount" numeric, "p_transaction_type" "public"."transaction_type") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Update account balance based on transaction type
    IF p_transaction_type = 'income' THEN
        UPDATE accounts 
        SET balance = balance + p_amount,
            updated_at = NOW()
        WHERE id = p_account_id;
    ELSIF p_transaction_type = 'expense' THEN
        UPDATE accounts 
        SET balance = balance - p_amount,
            updated_at = NOW()
        WHERE id = p_account_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_account_balance"("p_account_id" "uuid", "p_amount" numeric, "p_transaction_type" "public"."transaction_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_budget_for_expense"("p_category_id" "uuid", "p_amount" numeric, "p_date" "date", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_budget budgets%ROWTYPE;
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  IF p_category_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  v_year := EXTRACT(YEAR FROM p_date);
  v_month := EXTRACT(MONTH FROM p_date);
  
  -- Get budget for this category and period
  SELECT * INTO v_budget 
  FROM budgets 
  WHERE user_id = p_user_id 
    AND category_id = p_category_id 
    AND year = v_year 
    AND month = v_month;
  
  IF FOUND THEN
    -- Update existing budget
    UPDATE budgets SET
      spent_amount = spent_amount + p_amount,
      remaining_amount = budgeted_amount - (spent_amount + p_amount),
      updated_at = NOW()
    WHERE id = v_budget.id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."update_budget_for_expense"("p_category_id" "uuid", "p_amount" numeric, "p_date" "date", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_budget_spent"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    budget_record RECORD;
BEGIN
    -- Only process expense transactions
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.type = 'expense' THEN
        -- Find all budgets that include this transaction's category
        FOR budget_record IN 
            SELECT id, start_date, end_date, category_ids FROM budgets 
            WHERE user_id = NEW.user_id 
            AND is_active = true
            AND NEW.date BETWEEN start_date AND end_date
            AND (category_ids IS NULL OR NEW.category_id = ANY(category_ids))
        LOOP
            -- Recalculate spent amount for this budget
            UPDATE budgets SET spent = (
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions t
                WHERE t.user_id = NEW.user_id
                AND t.type = 'expense'
                AND t.date BETWEEN budget_record.start_date AND budget_record.end_date
                AND (budget_record.category_ids IS NULL OR t.category_id = ANY(budget_record.category_ids))
            )
            WHERE id = budget_record.id;
        END LOOP;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' AND OLD.type = 'expense' THEN
        -- Find all budgets that included this transaction's category
        FOR budget_record IN 
            SELECT id, start_date, end_date, category_ids FROM budgets 
            WHERE user_id = OLD.user_id 
            AND is_active = true
            AND OLD.date BETWEEN start_date AND end_date
            AND (category_ids IS NULL OR OLD.category_id = ANY(category_ids))
        LOOP
            -- Recalculate spent amount for this budget
            UPDATE budgets SET spent = (
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions t
                WHERE t.user_id = OLD.user_id
                AND t.type = 'expense'
                AND t.date BETWEEN budget_record.start_date AND budget_record.end_date
                AND (budget_record.category_ids IS NULL OR t.category_id = ANY(budget_record.category_ids))
            )
            WHERE id = budget_record.id;
        END LOOP;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_budget_spent"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_investment_calculated_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Calculate current value
    NEW.current_value = NEW.total_units * NEW.current_price;
    
    -- Calculate gain/loss
    NEW.gain_loss = NEW.current_value - NEW.total_invested;
    
    -- Calculate gain/loss percentage
    IF NEW.total_invested > 0 THEN
        NEW.gain_loss_percentage = (NEW.gain_loss / NEW.total_invested) * 100;
    ELSE
        NEW.gain_loss_percentage = 0;
    END IF;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_investment_calculated_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_investment_from_transactions"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    investment_record RECORD;
    total_buy_units DECIMAL(15,4) := 0;
    total_buy_amount DECIMAL(15,2) := 0;
    total_sell_units DECIMAL(15,4) := 0;
    avg_cost DECIMAL(15,2) := 0;
    total_dividend DECIMAL(15,2) := 0;
BEGIN
    -- Get investment record
    SELECT * INTO investment_record FROM investments WHERE id = COALESCE(NEW.investment_id, OLD.investment_id);
    
    IF NOT FOUND THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Recalculate totals from all transactions
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'buy' THEN units ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'buy' THEN net_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'sell' THEN units ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'dividend' THEN net_amount ELSE 0 END), 0)
    INTO total_buy_units, total_buy_amount, total_sell_units, total_dividend
    FROM investment_transactions 
    WHERE investment_id = investment_record.id;
    
    -- Calculate average cost
    IF total_buy_units > 0 THEN
        avg_cost = total_buy_amount / total_buy_units;
    END IF;
    
    -- Update investment record
    UPDATE investments SET
        total_units = total_buy_units - total_sell_units,
        total_invested = total_buy_amount,
        average_cost = COALESCE(avg_cost, average_cost), -- Keep existing if no buy transactions
        dividend_earned = total_dividend,
        updated_at = NOW()
    WHERE id = investment_record.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_investment_from_transactions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_investment_main_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    investment_name VARCHAR(100);
    description_val TEXT;
BEGIN
    -- Only update if main_transaction_id exists
    IF NEW.main_transaction_id IS NOT NULL THEN
        -- Get investment details
        SELECT name INTO investment_name 
        FROM investments 
        WHERE id = NEW.investment_id;
        
        -- Update description based on type
        CASE NEW.type
            WHEN 'buy' THEN
                description_val := 'Investment Purchase: ' || COALESCE(investment_name, 'Unknown');
            WHEN 'sell' THEN
                description_val := 'Investment Sale: ' || COALESCE(investment_name, 'Unknown');
            WHEN 'dividend' THEN
                description_val := 'Dividend from: ' || COALESCE(investment_name, 'Unknown');
            ELSE
                description_val := 'Investment Return: ' || COALESCE(investment_name, 'Unknown');
        END CASE;
        
        -- Update the main transaction
        UPDATE transactions 
        SET 
            amount = NEW.net_amount,
            description = description_val,
            date = NEW.transaction_date,
            updated_at = NOW()
        WHERE id = NEW.main_transaction_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_investment_main_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upgrade_user_subscription"("p_user_id" "uuid", "p_payment_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_payment RECORD;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Get payment details
    SELECT * INTO v_payment FROM subscription_payments 
    WHERE id = p_payment_id AND user_id = p_user_id AND status = 'approved';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Calculate expiration based on billing cycle
    IF v_payment.billing_cycle = 'yearly' THEN
        v_expires_at := NOW() + INTERVAL '1 year';
    ELSE
        v_expires_at := NOW() + INTERVAL '1 month';
    END IF;

    -- Update or insert user subscription
    INSERT INTO profiles (user_id, subscription_plan, subscription_expires_at, subscription_status)
    VALUES (p_user_id, (SELECT plan_name FROM subscription_plans WHERE id = v_payment.plan_id), v_expires_at, 'active')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        subscription_plan = (SELECT plan_name FROM subscription_plans WHERE id = v_payment.plan_id),
        subscription_expires_at = v_expires_at,
        subscription_status = 'active',
        updated_at = NOW();

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."upgrade_user_subscription"("p_user_id" "uuid", "p_payment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_coupon_usage"("p_user_id" "uuid", "p_coupon_code" character varying, "p_base_amount" numeric DEFAULT 0) RETURNS TABLE("is_valid" boolean, "coupon_id" "uuid", "discount_type" character varying, "discount_value" numeric, "discount_amount" numeric, "message" "text", "description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_coupon RECORD;
    v_discount DECIMAL(10,2);
    v_usage_count INTEGER;
BEGIN
    -- Get coupon details with scope validation
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = UPPER(p_coupon_code)
    AND is_active = true
    AND (
        scope = 'public' OR
        (scope = 'user_specific' AND p_user_id = ANY(allowed_users)) OR
        scope = 'private'
    );

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


ALTER FUNCTION "public"."validate_coupon_usage"("p_user_id" "uuid", "p_coupon_code" character varying, "p_base_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_credit_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    account_record RECORD;
    new_balance DECIMAL(15,2);
    available_credit DECIMAL(15,2);
BEGIN
    -- Get account details
    SELECT balance, credit_limit, balance_type INTO account_record
    FROM accounts 
    WHERE id = NEW.account_id;
    
    -- Skip validation if account not found or not a credit account
    IF NOT FOUND OR account_record.balance_type != 'credit' THEN
        RETURN NEW;
    END IF;
    
    -- Calculate new balance after transaction
    IF NEW.type = 'expense' THEN
        new_balance = account_record.balance - NEW.amount;
    ELSIF NEW.type = 'income' THEN
        new_balance = account_record.balance + NEW.amount;
    ELSE
        -- For other transaction types, allow them
        RETURN NEW;
    END IF;
    
    -- Check if new balance would exceed credit limit (for expenses)
    IF NEW.type = 'expense' THEN
        available_credit = account_record.credit_limit + account_record.balance;
        IF NEW.amount > available_credit THEN
            RAISE EXCEPTION 'Transaction amount exceeds available credit. Available: %, Requested: %', 
                available_credit, NEW.amount;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_credit_transaction"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" character varying(100) NOT NULL,
    "description" "text",
    "type" "public"."account_type" DEFAULT 'bank'::"public"."account_type" NOT NULL,
    "bank_name" character varying(100),
    "account_number" "text",
    "balance" numeric(15,2) DEFAULT 0 NOT NULL,
    "currency" character varying(3) DEFAULT 'BDT'::character varying NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "include_in_total" boolean DEFAULT true NOT NULL,
    "color" character varying(7) DEFAULT '#3B82F6'::character varying NOT NULL,
    "icon" character varying(50) DEFAULT 'credit-card'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "credit_limit" numeric(15,2) DEFAULT 0,
    "balance_type" "public"."balance_type" DEFAULT 'debit'::"public"."balance_type" NOT NULL,
    "interest_rate" numeric(5,4) DEFAULT 0,
    "minimum_payment" numeric(15,2) DEFAULT 0,
    "payment_due_day" integer DEFAULT 1,
    "statement_closing_day" integer DEFAULT 28
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."accounts"."is_default" IS 'Whether this is the default account for the user';



COMMENT ON COLUMN "public"."accounts"."display_order" IS 'Order for displaying accounts in UI';



COMMENT ON COLUMN "public"."accounts"."credit_limit" IS 'Credit limit for credit accounts (credit cards, lines of credit, etc.)';



COMMENT ON COLUMN "public"."accounts"."balance_type" IS 'Indicates whether this is a debit account (asset) or credit account (liability)';



COMMENT ON COLUMN "public"."accounts"."interest_rate" IS 'Annual interest rate for credit accounts (as decimal, e.g., 0.1899 for 18.99%)';



COMMENT ON COLUMN "public"."accounts"."minimum_payment" IS 'Minimum payment required for credit accounts';



COMMENT ON COLUMN "public"."accounts"."payment_due_day" IS 'Day of the month when payment is due (1-31)';



COMMENT ON COLUMN "public"."accounts"."statement_closing_day" IS 'Day of the month when statement closes (1-31)';



CREATE TABLE IF NOT EXISTS "public"."admin_audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "admin_user_id" "uuid",
    "action" "public"."audit_action" NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "resource_id" "uuid",
    "target_user_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "success" boolean DEFAULT true NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_insights" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "title" character varying(200) NOT NULL,
    "content" "text" NOT NULL,
    "confidence_score" numeric(3,2),
    "is_dismissed" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" character varying(100) NOT NULL,
    "description" "text",
    "amount" numeric(15,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'BDT'::character varying NOT NULL,
    "period" "public"."budget_period" DEFAULT 'monthly'::"public"."budget_period" NOT NULL,
    "category_ids" "uuid"[],
    "alert_percentage" numeric(5,2) DEFAULT 80.00,
    "alert_enabled" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_global" boolean DEFAULT false NOT NULL,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "budget_templates_alert_percentage_valid" CHECK ((("alert_percentage" > (0)::numeric) AND ("alert_percentage" <= (100)::numeric))),
    CONSTRAINT "budget_templates_amount_positive" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."budget_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."budget_templates" IS 'Budget templates for recurring budget creation. Supports both user templates and global templates for all users.';



COMMENT ON COLUMN "public"."budget_templates"."is_global" IS 'When true, template is available to all users. Only admins can create global templates.';



COMMENT ON COLUMN "public"."budget_templates"."usage_count" IS 'Track how many times this template has been used to create budgets.';



CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "amount" numeric(15,2) NOT NULL,
    "spent" numeric(15,2) DEFAULT 0 NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    "period" "public"."budget_period" DEFAULT 'monthly'::"public"."budget_period" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "category_ids" "uuid"[],
    "is_active" boolean DEFAULT true NOT NULL,
    "alert_threshold" numeric(5,2) DEFAULT 80.00,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "alert_percentage" numeric(5,2) DEFAULT 80.00,
    "alert_enabled" boolean DEFAULT true NOT NULL,
    CONSTRAINT "budgets_alert_percentage_valid" CHECK ((("alert_percentage" > (0)::numeric) AND ("alert_percentage" <= (100)::numeric))),
    CONSTRAINT "budgets_alert_threshold_valid" CHECK ((("alert_threshold" > (0)::numeric) AND ("alert_threshold" <= (100)::numeric))),
    CONSTRAINT "budgets_amount_positive" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "budgets_dates_valid" CHECK (("end_date" > "start_date")),
    CONSTRAINT "budgets_spent_non_negative" CHECK (("spent" >= (0)::numeric))
);


ALTER TABLE "public"."budgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "icon" character varying(50) DEFAULT 'folder'::character varying NOT NULL,
    "color" character varying(7) DEFAULT '#6B7280'::character varying NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "is_default" boolean DEFAULT false NOT NULL,
    "parent_id" "uuid"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupon_usage" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "coupon_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_id" "uuid",
    "used_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "discount_amount" numeric(10,2) NOT NULL
);


ALTER TABLE "public"."coupon_usage" OWNER TO "postgres";


COMMENT ON TABLE "public"."coupon_usage" IS 'Track coupon usage per user';



CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "value" numeric(10,2) NOT NULL,
    "minimum_amount" numeric(10,2) DEFAULT 0,
    "max_discount_amount" numeric(10,2),
    "max_uses" integer,
    "max_uses_per_user" integer DEFAULT 1,
    "used_count" integer DEFAULT 0 NOT NULL,
    "expires_at" timestamp with time zone,
    "applicable_plans" "jsonb",
    "billing_cycle_restriction" character varying(10),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "scope" character varying(20) DEFAULT 'public'::character varying,
    "allowed_users" "uuid"[],
    "type" character varying(20) DEFAULT 'percentage'::character varying NOT NULL,
    CONSTRAINT "coupons_scope_check" CHECK ((("scope")::"text" = ANY ((ARRAY['public'::character varying, 'private'::character varying, 'user_specific'::character varying])::"text"[]))),
    CONSTRAINT "coupons_type_check" CHECK ((("type")::"text" = ANY (ARRAY[('percentage'::character varying)::"text", ('fixed'::character varying)::"text"])))
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cron_job_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "job_name" character varying(100) NOT NULL,
    "status" character varying(50) NOT NULL,
    "message" "text",
    "metadata" "jsonb",
    "started_at" timestamp with time zone NOT NULL,
    "completed_at" timestamp with time zone,
    "duration_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cron_job_logs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."cron_job_stats" AS
 SELECT "job_name",
    "count"(*) AS "total_runs",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'completed'::"text") THEN 1
            ELSE 0
        END) AS "successful_runs",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'failed'::"text") THEN 1
            ELSE 0
        END) AS "failed_runs",
    "avg"("duration_seconds") AS "avg_duration_seconds",
    "max"("started_at") AS "last_run",
    "sum"(
        CASE
            WHEN ("metadata" ? 'payments_processed'::"text") THEN (("metadata" ->> 'payments_processed'::"text"))::integer
            ELSE 0
        END) AS "total_payments_processed",
    "sum"(
        CASE
            WHEN ("metadata" ? 'reminders_created'::"text") THEN (("metadata" ->> 'reminders_created'::"text"))::integer
            ELSE 0
        END) AS "total_reminders_created"
   FROM "public"."cron_job_logs"
  WHERE ("started_at" >= ("now"() - '30 days'::interval))
  GROUP BY "job_name"
  ORDER BY "job_name";


ALTER VIEW "public"."cron_job_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emi_payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "payment_date" "date" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "principal_amount" numeric(15,2) NOT NULL,
    "interest_amount" numeric(15,2) NOT NULL,
    "outstanding_balance" numeric(15,2) NOT NULL,
    "is_paid" boolean DEFAULT false NOT NULL,
    "paid_date" timestamp with time zone,
    "payment_method" character varying(50),
    "transaction_reference" character varying(100),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transaction_id" "uuid",
    "late_fee" numeric(15,2) DEFAULT 0,
    "is_prepayment" boolean DEFAULT false,
    CONSTRAINT "emi_payments_amount_positive" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "emi_payments_interest_non_negative" CHECK (("interest_amount" >= (0)::numeric)),
    CONSTRAINT "emi_payments_outstanding_non_negative" CHECK (("outstanding_balance" >= (0)::numeric)),
    CONSTRAINT "emi_payments_principal_positive" CHECK (("principal_amount" > (0)::numeric))
);


ALTER TABLE "public"."emi_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emi_schedules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "loan_id" "uuid" NOT NULL,
    "installment_number" integer NOT NULL,
    "due_date" "date" NOT NULL,
    "emi_amount" numeric(15,2) NOT NULL,
    "principal_amount" numeric(15,2) NOT NULL,
    "interest_amount" numeric(15,2) NOT NULL,
    "outstanding_balance" numeric(15,2) NOT NULL,
    "is_paid" boolean DEFAULT false,
    "payment_date" "date",
    "actual_payment_amount" numeric(15,2),
    "late_fee" numeric(15,2) DEFAULT 0,
    "payment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "emi_schedules_emi_positive" CHECK (("emi_amount" > (0)::numeric)),
    CONSTRAINT "emi_schedules_installment_positive" CHECK (("installment_number" > 0)),
    CONSTRAINT "emi_schedules_interest_non_negative" CHECK (("interest_amount" >= (0)::numeric)),
    CONSTRAINT "emi_schedules_outstanding_non_negative" CHECK (("outstanding_balance" >= (0)::numeric)),
    CONSTRAINT "emi_schedules_principal_positive" CHECK (("principal_amount" > (0)::numeric))
);


ALTER TABLE "public"."emi_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emi_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "loan_type" "public"."loan_type" NOT NULL,
    "default_interest_rate" numeric(5,2),
    "default_tenure_months" integer,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."emi_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "name" character varying(100) DEFAULT 'My Family'::character varying NOT NULL,
    "description" "text",
    "max_members" integer DEFAULT 4 NOT NULL,
    "current_members" integer DEFAULT 1 NOT NULL,
    "subscription_plan" character varying(20) DEFAULT 'max'::character varying NOT NULL,
    "subscription_expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."family_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_invitations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "family_group_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."family_role_type" DEFAULT 'member'::"public"."family_role_type" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "invitation_code" character varying(20) NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone
);


ALTER TABLE "public"."family_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investment_performance_snapshots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "portfolio_id" "uuid",
    "investment_id" "uuid",
    "snapshot_date" "date" NOT NULL,
    "snapshot_type" character varying(20) NOT NULL,
    "total_invested" numeric(15,2) NOT NULL,
    "current_value" numeric(15,2) NOT NULL,
    "unrealized_gain_loss" numeric(15,2) NOT NULL,
    "realized_gain_loss" numeric(15,2) DEFAULT 0 NOT NULL,
    "dividend_income" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_return_percentage" numeric(8,4) NOT NULL,
    "annualized_return" numeric(8,4),
    "currency" character varying(3) DEFAULT 'BDT'::character varying NOT NULL,
    "total_units" numeric(15,4),
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "investment_performance_current_value_non_negative" CHECK (("current_value" >= (0)::numeric)),
    CONSTRAINT "investment_performance_snapshot_type_valid" CHECK ((("snapshot_type")::"text" = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'quarterly'::character varying, 'yearly'::character varying])::"text"[]))),
    CONSTRAINT "investment_performance_total_invested_positive" CHECK (("total_invested" >= (0)::numeric))
);


ALTER TABLE "public"."investment_performance_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investment_portfolios" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "target_amount" numeric(15,2),
    "target_date" "date",
    "risk_level" character varying(20) DEFAULT 'moderate'::character varying,
    "currency" character varying(3) DEFAULT 'BDT'::character varying NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "color" character varying(7) DEFAULT '#8B5CF6'::character varying NOT NULL,
    "icon" character varying(50) DEFAULT 'trending-up'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "investment_portfolios_target_amount_positive" CHECK (("target_amount" > (0)::numeric))
);


ALTER TABLE "public"."investment_portfolios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investment_price_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "investment_id" "uuid" NOT NULL,
    "symbol" character varying(20) NOT NULL,
    "date" "date" NOT NULL,
    "open_price" numeric(15,2),
    "high_price" numeric(15,2),
    "low_price" numeric(15,2),
    "close_price" numeric(15,2) NOT NULL,
    "volume" bigint DEFAULT 0,
    "currency" character varying(3) DEFAULT 'BDT'::character varying NOT NULL,
    "source" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "investment_price_history_prices_positive" CHECK ((("close_price" > (0)::numeric) AND (("open_price" IS NULL) OR ("open_price" > (0)::numeric)) AND (("high_price" IS NULL) OR ("high_price" > (0)::numeric)) AND (("low_price" IS NULL) OR ("low_price" > (0)::numeric)))),
    CONSTRAINT "investment_price_history_volume_non_negative" CHECK (("volume" >= 0))
);


ALTER TABLE "public"."investment_price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investment_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "portfolio_id" "uuid",
    "name" character varying(100) NOT NULL,
    "description" "text",
    "investment_type" "public"."investment_type" NOT NULL,
    "symbol" character varying(20),
    "amount_per_investment" numeric(15,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'BDT'::character varying NOT NULL,
    "platform" character varying(100),
    "account_number" character varying(100),
    "frequency" "public"."investment_frequency" DEFAULT 'monthly'::"public"."investment_frequency" NOT NULL,
    "interval_value" integer DEFAULT 1 NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "target_amount" numeric(15,2),
    "auto_execute" boolean DEFAULT true NOT NULL,
    "market_order" boolean DEFAULT true NOT NULL,
    "limit_price" numeric(15,2),
    "is_active" boolean DEFAULT true NOT NULL,
    "last_executed" "date",
    "next_execution" "date" NOT NULL,
    "total_executed" integer DEFAULT 0 NOT NULL,
    "total_invested" numeric(15,2) DEFAULT 0 NOT NULL,
    "tags" "text"[],
    "notes" "text",
    "metadata" "jsonb",
    "template_type" character varying(50) DEFAULT 'sip'::character varying,
    "is_global" boolean DEFAULT false NOT NULL,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "investment_templates_amount_positive" CHECK (("amount_per_investment" > (0)::numeric)),
    CONSTRAINT "investment_templates_interval_positive" CHECK (("interval_value" > 0)),
    CONSTRAINT "investment_templates_limit_price_positive" CHECK ((("limit_price" IS NULL) OR ("limit_price" > (0)::numeric))),
    CONSTRAINT "investment_templates_target_amount_positive" CHECK ((("target_amount" IS NULL) OR ("target_amount" > (0)::numeric))),
    CONSTRAINT "investment_templates_total_invested_non_negative" CHECK (("total_invested" >= (0)::numeric))
);


ALTER TABLE "public"."investment_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investment_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "investment_id" "uuid" NOT NULL,
    "portfolio_id" "uuid",
    "type" character varying(20) NOT NULL,
    "units" numeric(15,4) NOT NULL,
    "price_per_unit" numeric(15,2) NOT NULL,
    "total_amount" numeric(15,2) NOT NULL,
    "brokerage_fee" numeric(10,2) DEFAULT 0,
    "tax_amount" numeric(10,2) DEFAULT 0,
    "other_charges" numeric(10,2) DEFAULT 0,
    "net_amount" numeric(15,2) NOT NULL,
    "transaction_date" "date" NOT NULL,
    "settlement_date" "date",
    "transaction_reference" character varying(100),
    "exchange_reference" character varying(100),
    "platform" character varying(100),
    "account_number" character varying(100),
    "currency" character varying(3) DEFAULT 'BDT'::character varying NOT NULL,
    "notes" "text",
    "metadata" "jsonb",
    "recurring_investment_id" "uuid",
    "is_recurring" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "main_transaction_id" "uuid",
    CONSTRAINT "investment_transactions_charges_non_negative" CHECK ((("brokerage_fee" >= (0)::numeric) AND ("tax_amount" >= (0)::numeric) AND ("other_charges" >= (0)::numeric))),
    CONSTRAINT "investment_transactions_net_positive" CHECK (("net_amount" > (0)::numeric)),
    CONSTRAINT "investment_transactions_price_positive" CHECK (("price_per_unit" > (0)::numeric)),
    CONSTRAINT "investment_transactions_total_positive" CHECK (("total_amount" > (0)::numeric)),
    CONSTRAINT "investment_transactions_type_valid" CHECK ((("type")::"text" = ANY ((ARRAY['buy'::character varying, 'sell'::character varying, 'dividend'::character varying, 'bonus'::character varying, 'split'::character varying, 'merge'::character varying, 'rights'::character varying, 'redemption'::character varying])::"text"[]))),
    CONSTRAINT "investment_transactions_units_positive" CHECK (("units" > (0)::numeric))
);


ALTER TABLE "public"."investment_transactions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."investment_transactions"."main_transaction_id" IS 'Links back to the main transaction record for cash flow tracking';



CREATE TABLE IF NOT EXISTS "public"."investments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "portfolio_id" "uuid",
    "name" character varying(100) NOT NULL,
    "symbol" character varying(20),
    "type" "public"."investment_type" DEFAULT 'stock'::"public"."investment_type" NOT NULL,
    "status" "public"."investment_status" DEFAULT 'active'::"public"."investment_status" NOT NULL,
    "total_units" numeric(15,4) DEFAULT 0 NOT NULL,
    "average_cost" numeric(15,2) NOT NULL,
    "current_price" numeric(15,2) NOT NULL,
    "total_invested" numeric(15,2) DEFAULT 0 NOT NULL,
    "current_value" numeric(15,2) DEFAULT 0 NOT NULL,
    "platform" character varying(100),
    "account_number" character varying(100),
    "folio_number" character varying(100),
    "maturity_date" "date",
    "interest_rate" numeric(5,2),
    "currency" character varying(3) DEFAULT 'BDT'::character varying NOT NULL,
    "exchange" character varying(50),
    "tags" "text"[],
    "notes" "text",
    "documents" "jsonb",
    "metadata" "jsonb",
    "gain_loss" numeric(15,2) DEFAULT 0,
    "gain_loss_percentage" numeric(8,4) DEFAULT 0,
    "dividend_earned" numeric(15,2) DEFAULT 0,
    "purchase_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "investments_average_cost_positive" CHECK (("average_cost" > (0)::numeric)),
    CONSTRAINT "investments_current_price_positive" CHECK (("current_price" > (0)::numeric)),
    CONSTRAINT "investments_current_value_non_negative" CHECK (("current_value" >= (0)::numeric)),
    CONSTRAINT "investments_interest_rate_valid" CHECK ((("interest_rate" IS NULL) OR (("interest_rate" >= (0)::numeric) AND ("interest_rate" <= (100)::numeric)))),
    CONSTRAINT "investments_total_invested_non_negative" CHECK (("total_invested" >= (0)::numeric)),
    CONSTRAINT "investments_total_units_non_negative" CHECK (("total_units" >= (0)::numeric))
);


ALTER TABLE "public"."investments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investments_backup" (
    "id" "uuid",
    "user_id" "uuid",
    "name" character varying(100),
    "type" "public"."investment_type",
    "symbol" character varying(20),
    "units" numeric(15,4),
    "purchase_price" numeric(15,2),
    "current_price" numeric(15,2),
    "currency" character varying(3),
    "purchase_date" "date",
    "platform" character varying(100),
    "notes" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."investments_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lending" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "person_name" character varying(100) NOT NULL,
    "person_contact" character varying(100),
    "amount" numeric(15,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    "type" "public"."lending_type" NOT NULL,
    "date" "date" NOT NULL,
    "due_date" "date",
    "interest_rate" numeric(5,2) DEFAULT 0,
    "status" "public"."lending_status" DEFAULT 'pending'::"public"."lending_status" NOT NULL,
    "description" "text",
    "paid_amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "account_id" "uuid",
    "category_id" "uuid",
    "reminder_days" integer DEFAULT 7,
    "contact_info" "jsonb",
    "payment_history" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "pending_amount" numeric(15,2),
    "subcategory_id" "uuid",
    "auto_debit" boolean DEFAULT false,
    "next_due_date" "date",
    CONSTRAINT "lending_amount_positive" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "lending_category_xor_subcategory" CHECK (((("category_id" IS NOT NULL) AND ("subcategory_id" IS NULL)) OR (("category_id" IS NULL) AND ("subcategory_id" IS NOT NULL)) OR (("category_id" IS NULL) AND ("subcategory_id" IS NULL)))),
    CONSTRAINT "lending_interest_rate_valid" CHECK ((("interest_rate" >= (0)::numeric) AND ("interest_rate" <= (100)::numeric))),
    CONSTRAINT "lending_paid_amount_non_negative" CHECK (("paid_amount" >= (0)::numeric)),
    CONSTRAINT "lending_paid_amount_not_exceeds" CHECK (("paid_amount" <= "amount")),
    CONSTRAINT "lending_pending_amount_non_negative" CHECK (("pending_amount" >= (0)::numeric)),
    CONSTRAINT "lending_pending_amount_not_exceeds" CHECK (("pending_amount" <= "amount"))
);


ALTER TABLE "public"."lending" OWNER TO "postgres";


COMMENT ON CONSTRAINT "lending_category_xor_subcategory" ON "public"."lending" IS 'Ensures only one of category_id or subcategory_id is set, allowing flexible category referencing';



CREATE TABLE IF NOT EXISTS "public"."lending_payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lending_id" "uuid" NOT NULL,
    "payment_date" "date" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "payment_method" character varying(50),
    "transaction_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lending_payments_amount_positive" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."lending_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subcategories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "icon" character varying(50) DEFAULT 'folder'::character varying NOT NULL,
    "color" character varying(7) DEFAULT '#6B7280'::character varying NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subcategories" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."lending_with_categories" AS
 SELECT "l"."id",
    "l"."user_id",
    "l"."person_name",
    "l"."person_contact",
    "l"."amount",
    "l"."currency",
    "l"."type",
    "l"."date",
    "l"."due_date",
    "l"."interest_rate",
    "l"."status",
    "l"."description",
    "l"."paid_amount",
    "l"."created_at",
    "l"."updated_at",
    "l"."account_id",
    "l"."category_id",
    "l"."reminder_days",
    "l"."contact_info",
    "l"."payment_history",
    "l"."notes",
    "l"."pending_amount",
    "l"."subcategory_id",
        CASE
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "s"."name"
            WHEN ("l"."category_id" IS NOT NULL) THEN "c"."name"
            ELSE NULL::character varying
        END AS "category_name",
        CASE
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "s"."icon"
            WHEN ("l"."category_id" IS NOT NULL) THEN "c"."icon"
            ELSE NULL::character varying
        END AS "category_icon",
        CASE
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "s"."color"
            WHEN ("l"."category_id" IS NOT NULL) THEN "c"."color"
            ELSE NULL::character varying
        END AS "category_color",
        CASE
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "pc"."name"
            ELSE NULL::character varying
        END AS "parent_category_name",
    "public"."get_effective_category"("l"."category_id", "l"."subcategory_id") AS "effective_category_id"
   FROM ((("public"."lending" "l"
     LEFT JOIN "public"."categories" "c" ON (("l"."category_id" = "c"."id")))
     LEFT JOIN "public"."subcategories" "s" ON (("l"."subcategory_id" = "s"."id")))
     LEFT JOIN "public"."categories" "pc" ON (("s"."category_id" = "pc"."id")));


ALTER VIEW "public"."lending_with_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lender" character varying(100) NOT NULL,
    "principal_amount" numeric(15,2) NOT NULL,
    "outstanding_amount" numeric(15,2) NOT NULL,
    "interest_rate" numeric(5,2) NOT NULL,
    "emi_amount" numeric(15,2) NOT NULL,
    "tenure_months" integer NOT NULL,
    "start_date" "date" NOT NULL,
    "next_due_date" "date" NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    "type" "public"."loan_type" DEFAULT 'personal'::"public"."loan_type" NOT NULL,
    "status" "public"."loan_status" DEFAULT 'active'::"public"."loan_status" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "account_id" "uuid",
    "category_id" "uuid",
    "auto_debit" boolean DEFAULT false,
    "reminder_days" integer DEFAULT 3,
    "prepayment_amount" numeric(15,2) DEFAULT 0,
    "last_payment_date" "date",
    "payment_day" integer DEFAULT 1,
    "notes" "text",
    "subcategory_id" "uuid",
    CONSTRAINT "loans_category_xor_subcategory" CHECK (((("category_id" IS NOT NULL) AND ("subcategory_id" IS NULL)) OR (("category_id" IS NULL) AND ("subcategory_id" IS NOT NULL)) OR (("category_id" IS NULL) AND ("subcategory_id" IS NULL)))),
    CONSTRAINT "loans_emi_positive" CHECK (("emi_amount" > (0)::numeric)),
    CONSTRAINT "loans_interest_rate_valid" CHECK ((("interest_rate" >= (0)::numeric) AND ("interest_rate" <= (100)::numeric))),
    CONSTRAINT "loans_outstanding_non_negative" CHECK (("outstanding_amount" >= (0)::numeric)),
    CONSTRAINT "loans_principal_positive" CHECK (("principal_amount" > (0)::numeric)),
    CONSTRAINT "loans_tenure_positive" CHECK (("tenure_months" > 0))
);


ALTER TABLE "public"."loans" OWNER TO "postgres";


COMMENT ON CONSTRAINT "loans_category_xor_subcategory" ON "public"."loans" IS 'Ensures only one of category_id or subcategory_id is set, allowing flexible category referencing';



CREATE OR REPLACE VIEW "public"."loans_with_categories" AS
 SELECT "l"."id",
    "l"."user_id",
    "l"."lender",
    "l"."principal_amount",
    "l"."outstanding_amount",
    "l"."interest_rate",
    "l"."emi_amount",
    "l"."tenure_months",
    "l"."start_date",
    "l"."next_due_date",
    "l"."currency",
    "l"."type",
    "l"."status",
    "l"."metadata",
    "l"."created_at",
    "l"."updated_at",
    "l"."account_id",
    "l"."category_id",
    "l"."auto_debit",
    "l"."reminder_days",
    "l"."prepayment_amount",
    "l"."last_payment_date",
    "l"."payment_day",
    "l"."notes",
    "l"."subcategory_id",
        CASE
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "s"."name"
            WHEN ("l"."category_id" IS NOT NULL) THEN "c"."name"
            ELSE NULL::character varying
        END AS "category_name",
        CASE
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "s"."icon"
            WHEN ("l"."category_id" IS NOT NULL) THEN "c"."icon"
            ELSE NULL::character varying
        END AS "category_icon",
        CASE
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "s"."color"
            WHEN ("l"."category_id" IS NOT NULL) THEN "c"."color"
            ELSE NULL::character varying
        END AS "category_color",
        CASE
            WHEN ("l"."subcategory_id" IS NOT NULL) THEN "pc"."name"
            ELSE NULL::character varying
        END AS "parent_category_name",
    "public"."get_effective_category"("l"."category_id", "l"."subcategory_id") AS "effective_category_id"
   FROM ((("public"."loans" "l"
     LEFT JOIN "public"."categories" "c" ON (("l"."category_id" = "c"."id")))
     LEFT JOIN "public"."subcategories" "s" ON (("l"."subcategory_id" = "s"."id")))
     LEFT JOIN "public"."categories" "pc" ON (("s"."category_id" = "pc"."id")));


ALTER VIEW "public"."loans_with_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" character varying(200) NOT NULL,
    "message" "text" NOT NULL,
    "type" "public"."notification_type" DEFAULT 'info'::"public"."notification_type" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "action_url" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "method_name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "account_info" "jsonb" NOT NULL,
    "instructions" "text",
    "logo_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "resource" character varying(50) NOT NULL,
    "action" "public"."permission_action" NOT NULL,
    "is_system" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role_id" "uuid",
    "currency" character varying(3) DEFAULT 'BDT'::character varying NOT NULL,
    "timezone" "text" DEFAULT 'UTC'::"text" NOT NULL,
    "theme" "public"."theme_type" DEFAULT 'system'::"public"."theme_type" NOT NULL,
    "notifications_enabled" boolean DEFAULT true NOT NULL,
    "ai_insights_enabled" boolean DEFAULT true NOT NULL,
    "monthly_budget_limit" numeric(15,2),
    "email_verified" boolean DEFAULT false NOT NULL,
    "phone_number" "text",
    "phone_verified" boolean DEFAULT false NOT NULL,
    "two_factor_enabled" boolean DEFAULT false NOT NULL,
    "last_login" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subscription_plan" character varying(20) DEFAULT 'free'::character varying NOT NULL,
    "subscription_status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "subscription_expires_at" timestamp with time zone,
    "subscription_started_at" timestamp with time zone DEFAULT "now"(),
    "max_accounts" integer DEFAULT 3 NOT NULL,
    "family_group_id" "uuid",
    "family_role" "public"."family_role_type" DEFAULT 'primary'::"public"."family_role_type",
    "invited_by" "uuid",
    "joined_family_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles with subscription and account management features';



COMMENT ON COLUMN "public"."profiles"."subscription_plan" IS 'User subscription plan: free, pro, premium';



COMMENT ON COLUMN "public"."profiles"."max_accounts" IS 'Maximum number of accounts allowed for this user';



CREATE OR REPLACE VIEW "public"."purchase_emis" AS
 SELECT "id",
    "user_id",
    "lender",
    "principal_amount",
    "outstanding_amount",
    "interest_rate",
    "emi_amount",
    "tenure_months",
    "start_date",
    "next_due_date",
    "currency",
    "type",
    "status",
    "metadata",
    "created_at",
    "updated_at",
    "account_id",
    "category_id",
    "auto_debit",
    "reminder_days",
    "prepayment_amount",
    "last_payment_date",
    "payment_day",
    "notes",
    ("metadata" ->> 'item_name'::"text") AS "item_name",
    ("metadata" ->> 'vendor_name'::"text") AS "vendor_name",
    ("metadata" ->> 'purchase_category'::"text") AS "purchase_category_text",
    (("metadata" ->> 'purchase_date'::"text"))::"date" AS "purchase_date",
    ("metadata" ->> 'item_condition'::"text") AS "item_condition_text",
    (("metadata" ->> 'warranty_period'::"text"))::integer AS "warranty_period_months",
    (("metadata" ->> 'down_payment'::"text"))::numeric(15,2) AS "down_payment"
   FROM "public"."loans" "l"
  WHERE ("type" = 'purchase_emi'::"public"."loan_type");


ALTER VIEW "public"."purchase_emis" OWNER TO "postgres";


COMMENT ON VIEW "public"."purchase_emis" IS 'Simplified view of purchase EMI loans with extracted metadata fields';



CREATE OR REPLACE VIEW "public"."recent_cron_jobs" AS
 SELECT "job_name",
    "status",
    "message",
    "started_at",
    "completed_at",
    "duration_seconds",
        CASE
            WHEN ("metadata" ? 'payments_processed'::"text") THEN (("metadata" ->> 'payments_processed'::"text"))::integer
            ELSE 0
        END AS "payments_processed",
        CASE
            WHEN ("metadata" ? 'reminders_created'::"text") THEN (("metadata" ->> 'reminders_created'::"text"))::integer
            ELSE 0
        END AS "reminders_created",
        CASE
            WHEN ("metadata" ? 'errors_count'::"text") THEN (("metadata" ->> 'errors_count'::"text"))::integer
            ELSE 0
        END AS "errors_count"
   FROM "public"."cron_job_logs"
  WHERE ("started_at" >= ("now"() - '7 days'::interval))
  ORDER BY "started_at" DESC;


ALTER VIEW "public"."recent_cron_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recurring_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_template" "jsonb" NOT NULL,
    "frequency" character varying(20) NOT NULL,
    "interval_value" integer DEFAULT 1 NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "last_executed" "date",
    "next_execution" "date" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "recurring_interval_positive" CHECK (("interval_value" > 0))
);


ALTER TABLE "public"."recurring_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "granted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "is_system" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "plan_name" character varying(50) NOT NULL,
    "action_type" character varying(20) NOT NULL,
    "amount_paid" numeric(10,2),
    "payment_id" "uuid",
    "effective_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscription_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "billing_cycle" "public"."billing_cycle_type",
    "transaction_id" character varying(100) NOT NULL,
    "sender_number" character varying(20) NOT NULL,
    "base_amount" numeric(10,2) NOT NULL,
    "discount_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "final_amount" numeric(10,2) NOT NULL,
    "coupon_id" "uuid",
    "status" "public"."payment_status_type" DEFAULT 'pending'::"public"."payment_status_type" NOT NULL,
    "admin_notes" "text",
    "rejection_reason" "text",
    "submitted_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "verified_by" "uuid",
    "currency" character varying(3) DEFAULT 'BDT'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_method_id" "uuid"
);


ALTER TABLE "public"."subscription_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "plan_name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "price_monthly" numeric(10,2) DEFAULT 0 NOT NULL,
    "price_yearly" numeric(10,2) DEFAULT 0 NOT NULL,
    "features" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "max_accounts" integer DEFAULT 3 NOT NULL,
    "max_family_members" integer DEFAULT 1 NOT NULL,
    "allowed_account_types" "text"[] DEFAULT ARRAY['cash'::"text", 'bank'::"text"] NOT NULL,
    "is_popular" boolean DEFAULT false,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."subscription_payments_with_users" AS
 SELECT "sp"."id",
    "sp"."user_id",
    "sp"."plan_id",
    "sp"."billing_cycle",
    "sp"."transaction_id",
    "sp"."sender_number",
    "sp"."base_amount",
    "sp"."discount_amount",
    "sp"."final_amount",
    "sp"."coupon_id",
    "sp"."status",
    "sp"."admin_notes",
    "sp"."rejection_reason",
    "sp"."submitted_at",
    "sp"."verified_at",
    "sp"."approved_at",
    "sp"."rejected_at",
    "sp"."verified_by",
    "sp"."currency",
    "sp"."created_at",
    "sp"."updated_at",
    "sp"."payment_method_id",
    "p"."full_name" AS "user_full_name",
    "p"."email" AS "user_email",
    "p"."phone_number" AS "user_phone",
    "spl"."plan_name",
    "spl"."display_name" AS "plan_display_name",
    "spl"."price_monthly" AS "plan_price_monthly",
    "spl"."price_yearly" AS "plan_price_yearly",
    "pm"."method_name" AS "payment_method_name",
    "pm"."display_name" AS "payment_method_display_name",
    "c"."code" AS "coupon_code",
    "c"."type" AS "coupon_type",
    "c"."value" AS "coupon_value"
   FROM (((("public"."subscription_payments" "sp"
     LEFT JOIN "public"."profiles" "p" ON (("sp"."user_id" = "p"."user_id")))
     LEFT JOIN "public"."subscription_plans" "spl" ON (("sp"."plan_id" = "spl"."id")))
     LEFT JOIN "public"."payment_methods" "pm" ON (("sp"."payment_method_id" = "pm"."id")))
     LEFT JOIN "public"."coupons" "c" ON (("sp"."coupon_id" = "c"."id")));


ALTER VIEW "public"."subscription_payments_with_users" OWNER TO "postgres";


COMMENT ON VIEW "public"."subscription_payments_with_users" IS 'View combining subscription payments with user and related data for easier querying';



CREATE OR REPLACE VIEW "public"."subscription_seed_data_summary" AS
 SELECT 'Subscription Plans'::"text" AS "table_name",
    ("count"(*))::"text" AS "record_count",
    "array_agg"("subscription_plans"."plan_name" ORDER BY "subscription_plans"."sort_order") AS "sample_data"
   FROM "public"."subscription_plans"
  WHERE ("subscription_plans"."is_active" = true)
UNION ALL
 SELECT 'Payment Methods'::"text" AS "table_name",
    ("count"(*))::"text" AS "record_count",
    "array_agg"("payment_methods"."method_name" ORDER BY "payment_methods"."sort_order") AS "sample_data"
   FROM "public"."payment_methods"
  WHERE ("payment_methods"."is_active" = true)
UNION ALL
 SELECT 'Active Coupons'::"text" AS "table_name",
    ("count"(*))::"text" AS "record_count",
    "array_agg"("coupons"."code" ORDER BY "coupons"."created_at") AS "sample_data"
   FROM "public"."coupons"
  WHERE (("coupons"."is_active" = true) AND (("coupons"."expires_at" IS NULL) OR ("coupons"."expires_at" > "now"())));


ALTER VIEW "public"."subscription_seed_data_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    "description" "text" NOT NULL,
    "notes" "text",
    "category_id" "uuid",
    "subcategory_id" "uuid",
    "account_id" "uuid",
    "transfer_to_account_id" "uuid",
    "date" "date" NOT NULL,
    "tags" "text"[],
    "receipt_url" "text",
    "location" "text",
    "vendor" "text",
    "is_recurring" boolean DEFAULT false NOT NULL,
    "recurring_pattern" "jsonb",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recurring_template_id" "uuid",
    "investment_id" "uuid",
    "investment_transaction_id" "uuid",
    "is_investment_related" boolean DEFAULT false NOT NULL,
    "investment_action" character varying(50),
    CONSTRAINT "transactions_amount_positive" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "transactions_transfer_accounts_different" CHECK ((("account_id" IS NULL) OR ("transfer_to_account_id" IS NULL) OR ("account_id" <> "transfer_to_account_id")))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."transactions"."investment_id" IS 'Links transaction to an investment record';



COMMENT ON COLUMN "public"."transactions"."investment_transaction_id" IS 'Links to detailed investment transaction record';



COMMENT ON COLUMN "public"."transactions"."is_investment_related" IS 'Flag to easily identify investment-related transactions';



COMMENT ON COLUMN "public"."transactions"."investment_action" IS 'Type of investment action: buy, sell, dividend, return, etc.';



CREATE OR REPLACE VIEW "public"."unified_transactions" AS
 SELECT "t"."id",
    "t"."user_id",
    "t"."type",
    "t"."amount",
    "t"."currency",
    "t"."description",
    "t"."notes",
    "t"."category_id",
    "t"."subcategory_id",
    "t"."account_id",
    "t"."date",
    "t"."tags",
    "t"."receipt_url",
    "t"."location",
    "t"."vendor",
    "t"."is_investment_related",
    "t"."investment_action",
    "t"."investment_id",
    "t"."investment_transaction_id",
    "i"."name" AS "investment_name",
    "i"."symbol" AS "investment_symbol",
    "i"."type" AS "investment_type",
    "it"."units" AS "investment_units",
    "it"."price_per_unit",
    "it"."brokerage_fee",
    "it"."tax_amount",
    "it"."other_charges",
    "a"."name" AS "account_name",
    "a"."type" AS "account_type",
    "c"."name" AS "category_name",
    "c"."icon" AS "category_icon",
    "t"."created_at",
    "t"."updated_at"
   FROM (((("public"."transactions" "t"
     LEFT JOIN "public"."investments" "i" ON (("t"."investment_id" = "i"."id")))
     LEFT JOIN "public"."investment_transactions" "it" ON (("t"."investment_transaction_id" = "it"."id")))
     LEFT JOIN "public"."accounts" "a" ON (("t"."account_id" = "a"."id")))
     LEFT JOIN "public"."categories" "c" ON (("t"."category_id" = "c"."id")))
  ORDER BY "t"."date" DESC, "t"."created_at" DESC;


ALTER VIEW "public"."unified_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "granted" boolean DEFAULT true NOT NULL,
    "granted_by" "uuid",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "device_info" "jsonb",
    "location" "jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_accessed" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "billing_cycle" "public"."billing_cycle_type",
    "payment_id" "uuid",
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_subscriptions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'suspended'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_subscriptions_with_details" AS
 SELECT "us"."id",
    "us"."user_id",
    "us"."plan_id",
    "us"."billing_cycle",
    "us"."payment_id",
    "us"."status",
    "us"."end_date",
    "us"."created_at",
    "us"."updated_at",
    "p"."full_name" AS "user_full_name",
    "p"."email" AS "user_email",
    "p"."phone_number" AS "user_phone",
    "spl"."plan_name",
    "spl"."display_name" AS "plan_display_name",
    "spl"."price_monthly" AS "plan_price_monthly",
    "spl"."price_yearly" AS "plan_price_yearly",
    "spl"."features" AS "plan_features",
    "sp"."transaction_id" AS "payment_transaction_id",
    "sp"."final_amount" AS "payment_amount",
    "sp"."status" AS "payment_status"
   FROM ((("public"."user_subscriptions" "us"
     LEFT JOIN "public"."profiles" "p" ON (("us"."user_id" = "p"."user_id")))
     LEFT JOIN "public"."subscription_plans" "spl" ON (("us"."plan_id" = "spl"."id")))
     LEFT JOIN "public"."subscription_payments" "sp" ON (("us"."payment_id" = "sp"."id")));


ALTER VIEW "public"."user_subscriptions_with_details" OWNER TO "postgres";


COMMENT ON VIEW "public"."user_subscriptions_with_details" IS 'View combining user subscriptions with user, plan, and payment data for easier querying';



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_templates"
    ADD CONSTRAINT "budget_templates_name_user_unique" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."budget_templates"
    ADD CONSTRAINT "budget_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_type_unique" UNIQUE ("name", "type");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupon_usage"
    ADD CONSTRAINT "coupon_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cron_job_logs"
    ADD CONSTRAINT "cron_job_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emi_payments"
    ADD CONSTRAINT "emi_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emi_schedules"
    ADD CONSTRAINT "emi_schedules_loan_id_installment_number_key" UNIQUE ("loan_id", "installment_number");



ALTER TABLE ONLY "public"."emi_schedules"
    ADD CONSTRAINT "emi_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emi_templates"
    ADD CONSTRAINT "emi_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_groups"
    ADD CONSTRAINT "family_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_invitations"
    ADD CONSTRAINT "family_invitations_invitation_code_key" UNIQUE ("invitation_code");



ALTER TABLE ONLY "public"."family_invitations"
    ADD CONSTRAINT "family_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investment_performance_snapshots"
    ADD CONSTRAINT "investment_performance_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investment_performance_snapshots"
    ADD CONSTRAINT "investment_performance_unique_snapshot" UNIQUE ("user_id", "portfolio_id", "investment_id", "snapshot_date", "snapshot_type");



ALTER TABLE ONLY "public"."investment_portfolios"
    ADD CONSTRAINT "investment_portfolios_name_user_unique" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."investment_portfolios"
    ADD CONSTRAINT "investment_portfolios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investment_price_history"
    ADD CONSTRAINT "investment_price_history_date_symbol_unique" UNIQUE ("investment_id", "date");



ALTER TABLE ONLY "public"."investment_price_history"
    ADD CONSTRAINT "investment_price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investment_templates"
    ADD CONSTRAINT "investment_templates_name_user_unique" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."investment_templates"
    ADD CONSTRAINT "investment_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investment_transactions"
    ADD CONSTRAINT "investment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lending_payments"
    ADD CONSTRAINT "lending_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lending"
    ADD CONSTRAINT "lending_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_method_name_key" UNIQUE ("method_name");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_resource_action_unique" UNIQUE ("resource", "action");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."recurring_transactions"
    ADD CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_unique" UNIQUE ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_name_category_unique" UNIQUE ("name", "category_id");



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_payments"
    ADD CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_payments"
    ADD CONSTRAINT "subscription_payments_transaction_id_sender_number_key" UNIQUE ("transaction_id", "sender_number");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_plan_name_key" UNIQUE ("plan_name");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_unique" UNIQUE ("user_id", "permission_id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_accounts_active" ON "public"."accounts" USING "btree" ("is_active");



CREATE INDEX "idx_accounts_balance_type" ON "public"."accounts" USING "btree" ("balance_type");



CREATE INDEX "idx_accounts_credit_limit" ON "public"."accounts" USING "btree" ("credit_limit") WHERE ("credit_limit" > (0)::numeric);



CREATE INDEX "idx_accounts_global" ON "public"."accounts" USING "btree" ("user_id") WHERE ("user_id" IS NULL);



CREATE INDEX "idx_accounts_payment_due_day" ON "public"."accounts" USING "btree" ("payment_due_day") WHERE ("balance_type" = 'credit'::"public"."balance_type");



CREATE INDEX "idx_accounts_type" ON "public"."accounts" USING "btree" ("type");



CREATE INDEX "idx_accounts_user_id" ON "public"."accounts" USING "btree" ("user_id");



CREATE INDEX "idx_ai_insights_dismissed" ON "public"."ai_insights" USING "btree" ("is_dismissed");



CREATE INDEX "idx_ai_insights_expires_at" ON "public"."ai_insights" USING "btree" ("expires_at");



CREATE INDEX "idx_ai_insights_type" ON "public"."ai_insights" USING "btree" ("type");



CREATE INDEX "idx_ai_insights_user_id" ON "public"."ai_insights" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_action" ON "public"."admin_audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_admin_user" ON "public"."admin_audit_logs" USING "btree" ("admin_user_id");



CREATE INDEX "idx_audit_logs_created" ON "public"."admin_audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_target_user" ON "public"."admin_audit_logs" USING "btree" ("target_user_id");



CREATE INDEX "idx_budget_templates_active" ON "public"."budget_templates" USING "btree" ("is_active");



CREATE INDEX "idx_budget_templates_created_at" ON "public"."budget_templates" USING "btree" ("created_at");



CREATE INDEX "idx_budget_templates_global" ON "public"."budget_templates" USING "btree" ("is_global");



CREATE INDEX "idx_budget_templates_usage_count" ON "public"."budget_templates" USING "btree" ("usage_count");



CREATE INDEX "idx_budget_templates_user_id" ON "public"."budget_templates" USING "btree" ("user_id");



CREATE INDEX "idx_budgets_active" ON "public"."budgets" USING "btree" ("is_active");



CREATE INDEX "idx_budgets_dates" ON "public"."budgets" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_budgets_period" ON "public"."budgets" USING "btree" ("period");



CREATE INDEX "idx_budgets_user_id" ON "public"."budgets" USING "btree" ("user_id");



CREATE INDEX "idx_categories_active" ON "public"."categories" USING "btree" ("is_active");



CREATE INDEX "idx_categories_is_default" ON "public"."categories" USING "btree" ("is_default");



CREATE INDEX "idx_categories_sort_order" ON "public"."categories" USING "btree" ("sort_order");



CREATE INDEX "idx_categories_type" ON "public"."categories" USING "btree" ("type");



CREATE INDEX "idx_categories_type_active" ON "public"."categories" USING "btree" ("type", "is_active");



CREATE INDEX "idx_categories_user_id" ON "public"."categories" USING "btree" ("user_id");



CREATE INDEX "idx_coupon_usage_user_coupon" ON "public"."coupon_usage" USING "btree" ("user_id", "coupon_id");



CREATE INDEX "idx_coupons_code_active" ON "public"."coupons" USING "btree" ("code", "is_active");



CREATE INDEX "idx_cron_job_logs_name_date" ON "public"."cron_job_logs" USING "btree" ("job_name", "started_at" DESC);



CREATE INDEX "idx_cron_job_logs_status" ON "public"."cron_job_logs" USING "btree" ("status", "started_at" DESC);



CREATE INDEX "idx_emi_payments_is_paid" ON "public"."emi_payments" USING "btree" ("is_paid");



CREATE INDEX "idx_emi_payments_loan_id" ON "public"."emi_payments" USING "btree" ("loan_id");



CREATE INDEX "idx_emi_payments_payment_date" ON "public"."emi_payments" USING "btree" ("payment_date");



CREATE INDEX "idx_emi_payments_user_id" ON "public"."emi_payments" USING "btree" ("user_id");



CREATE INDEX "idx_emi_schedules_due_date" ON "public"."emi_schedules" USING "btree" ("due_date");



CREATE INDEX "idx_emi_schedules_is_paid" ON "public"."emi_schedules" USING "btree" ("is_paid");



CREATE INDEX "idx_emi_schedules_loan_id" ON "public"."emi_schedules" USING "btree" ("loan_id");



CREATE INDEX "idx_emi_schedules_user_id" ON "public"."emi_schedules" USING "btree" ("user_id");



CREATE INDEX "idx_emi_templates_is_active" ON "public"."emi_templates" USING "btree" ("is_active");



CREATE INDEX "idx_emi_templates_user_id" ON "public"."emi_templates" USING "btree" ("user_id");



CREATE INDEX "idx_investment_performance_date" ON "public"."investment_performance_snapshots" USING "btree" ("snapshot_date");



CREATE INDEX "idx_investment_performance_investment_id" ON "public"."investment_performance_snapshots" USING "btree" ("investment_id");



CREATE INDEX "idx_investment_performance_portfolio_id" ON "public"."investment_performance_snapshots" USING "btree" ("portfolio_id");



CREATE INDEX "idx_investment_performance_type" ON "public"."investment_performance_snapshots" USING "btree" ("snapshot_type");



CREATE INDEX "idx_investment_performance_user_id" ON "public"."investment_performance_snapshots" USING "btree" ("user_id");



CREATE INDEX "idx_investment_portfolios_active" ON "public"."investment_portfolios" USING "btree" ("is_active");



CREATE INDEX "idx_investment_portfolios_user_active" ON "public"."investment_portfolios" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_investment_portfolios_user_id" ON "public"."investment_portfolios" USING "btree" ("user_id");



CREATE INDEX "idx_investment_price_history_date" ON "public"."investment_price_history" USING "btree" ("date");



CREATE INDEX "idx_investment_price_history_investment_id" ON "public"."investment_price_history" USING "btree" ("investment_id");



CREATE INDEX "idx_investment_price_history_symbol" ON "public"."investment_price_history" USING "btree" ("symbol");



CREATE INDEX "idx_investment_price_history_symbol_date" ON "public"."investment_price_history" USING "btree" ("symbol", "date");



CREATE INDEX "idx_investment_templates_active" ON "public"."investment_templates" USING "btree" ("is_active");



CREATE INDEX "idx_investment_templates_auto_execute" ON "public"."investment_templates" USING "btree" ("auto_execute", "is_active");



CREATE INDEX "idx_investment_templates_global" ON "public"."investment_templates" USING "btree" ("is_global");



CREATE INDEX "idx_investment_templates_next_execution" ON "public"."investment_templates" USING "btree" ("next_execution");



CREATE INDEX "idx_investment_templates_portfolio_id" ON "public"."investment_templates" USING "btree" ("portfolio_id");



CREATE INDEX "idx_investment_templates_user_active" ON "public"."investment_templates" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_investment_templates_user_id" ON "public"."investment_templates" USING "btree" ("user_id");



CREATE INDEX "idx_investment_transactions_date" ON "public"."investment_transactions" USING "btree" ("transaction_date");



CREATE INDEX "idx_investment_transactions_investment_id" ON "public"."investment_transactions" USING "btree" ("investment_id");



CREATE INDEX "idx_investment_transactions_main_transaction_id" ON "public"."investment_transactions" USING "btree" ("main_transaction_id");



CREATE INDEX "idx_investment_transactions_portfolio_id" ON "public"."investment_transactions" USING "btree" ("portfolio_id");



CREATE INDEX "idx_investment_transactions_recurring" ON "public"."investment_transactions" USING "btree" ("recurring_investment_id");



CREATE INDEX "idx_investment_transactions_type" ON "public"."investment_transactions" USING "btree" ("type");



CREATE INDEX "idx_investment_transactions_type_date" ON "public"."investment_transactions" USING "btree" ("type", "transaction_date");



CREATE INDEX "idx_investment_transactions_user_date" ON "public"."investment_transactions" USING "btree" ("user_id", "transaction_date");



CREATE INDEX "idx_investment_transactions_user_id" ON "public"."investment_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_investments_portfolio_id" ON "public"."investments" USING "btree" ("portfolio_id");



CREATE INDEX "idx_investments_status" ON "public"."investments" USING "btree" ("status");



CREATE INDEX "idx_investments_symbol" ON "public"."investments" USING "btree" ("symbol");



CREATE INDEX "idx_investments_type" ON "public"."investments" USING "btree" ("type");



CREATE INDEX "idx_investments_user_id" ON "public"."investments" USING "btree" ("user_id");



CREATE INDEX "idx_investments_user_status" ON "public"."investments" USING "btree" ("user_id", "status");



CREATE INDEX "idx_investments_user_status_type" ON "public"."investments" USING "btree" ("user_id", "status", "type");



CREATE INDEX "idx_investments_user_type" ON "public"."investments" USING "btree" ("user_id", "type");



CREATE INDEX "idx_lending_account_id" ON "public"."lending" USING "btree" ("account_id");



CREATE INDEX "idx_lending_category_id" ON "public"."lending" USING "btree" ("category_id");



CREATE INDEX "idx_lending_due_date" ON "public"."lending" USING "btree" ("due_date");



CREATE INDEX "idx_lending_payments_lending_id" ON "public"."lending_payments" USING "btree" ("lending_id");



CREATE INDEX "idx_lending_payments_payment_date" ON "public"."lending_payments" USING "btree" ("payment_date");



CREATE INDEX "idx_lending_payments_user_id" ON "public"."lending_payments" USING "btree" ("user_id");



CREATE INDEX "idx_lending_status" ON "public"."lending" USING "btree" ("status");



CREATE INDEX "idx_lending_type" ON "public"."lending" USING "btree" ("type");



CREATE INDEX "idx_lending_user_id" ON "public"."lending" USING "btree" ("user_id");



CREATE INDEX "idx_loans_account_id" ON "public"."loans" USING "btree" ("account_id");



CREATE INDEX "idx_loans_category_id" ON "public"."loans" USING "btree" ("category_id");



CREATE INDEX "idx_loans_metadata_purchase_category" ON "public"."loans" USING "btree" ((("metadata" ->> 'purchase_category'::"text"))) WHERE ("type" = 'purchase_emi'::"public"."loan_type");



CREATE INDEX "idx_loans_next_due_date" ON "public"."loans" USING "btree" ("next_due_date");



CREATE INDEX "idx_loans_payment_day" ON "public"."loans" USING "btree" ("payment_day");



CREATE INDEX "idx_loans_status" ON "public"."loans" USING "btree" ("status");



CREATE INDEX "idx_loans_type_purchase_emi" ON "public"."loans" USING "btree" ("user_id", "type") WHERE ("type" = 'purchase_emi'::"public"."loan_type");



CREATE INDEX "idx_loans_user_id" ON "public"."loans" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_active" ON "public"."profiles" USING "btree" ("is_active");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role_id" ON "public"."profiles" USING "btree" ("role_id");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_recurring_transactions_active" ON "public"."recurring_transactions" USING "btree" ("is_active");



CREATE INDEX "idx_recurring_transactions_next_execution" ON "public"."recurring_transactions" USING "btree" ("next_execution");



CREATE INDEX "idx_recurring_transactions_user_id" ON "public"."recurring_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_role_permissions_permission_id" ON "public"."role_permissions" USING "btree" ("permission_id");



CREATE INDEX "idx_role_permissions_role_id" ON "public"."role_permissions" USING "btree" ("role_id");



CREATE INDEX "idx_subcategories_active" ON "public"."subcategories" USING "btree" ("is_active");



CREATE INDEX "idx_subcategories_category_active" ON "public"."subcategories" USING "btree" ("category_id", "is_active");



CREATE INDEX "idx_subcategories_category_id" ON "public"."subcategories" USING "btree" ("category_id");



CREATE INDEX "idx_subcategories_sort_order" ON "public"."subcategories" USING "btree" ("sort_order");



CREATE INDEX "idx_subscription_history_user_id" ON "public"."subscription_history" USING "btree" ("user_id");



CREATE INDEX "idx_subscription_payments_coupon_id" ON "public"."subscription_payments" USING "btree" ("coupon_id");



CREATE INDEX "idx_subscription_payments_created_at" ON "public"."subscription_payments" USING "btree" ("created_at");



CREATE INDEX "idx_subscription_payments_payment_method_id" ON "public"."subscription_payments" USING "btree" ("payment_method_id");



CREATE INDEX "idx_subscription_payments_plan_id" ON "public"."subscription_payments" USING "btree" ("plan_id");



CREATE INDEX "idx_subscription_payments_status" ON "public"."subscription_payments" USING "btree" ("status");



CREATE INDEX "idx_subscription_payments_user_id" ON "public"."subscription_payments" USING "btree" ("user_id");



CREATE INDEX "idx_transactions_account_id" ON "public"."transactions" USING "btree" ("account_id");



CREATE INDEX "idx_transactions_category_id" ON "public"."transactions" USING "btree" ("category_id");



CREATE INDEX "idx_transactions_created_at" ON "public"."transactions" USING "btree" ("created_at");



CREATE INDEX "idx_transactions_date" ON "public"."transactions" USING "btree" ("date");



CREATE INDEX "idx_transactions_investment_id" ON "public"."transactions" USING "btree" ("investment_id");



CREATE INDEX "idx_transactions_investment_transaction_id" ON "public"."transactions" USING "btree" ("investment_transaction_id");



CREATE INDEX "idx_transactions_is_investment_related" ON "public"."transactions" USING "btree" ("is_investment_related");



CREATE INDEX "idx_transactions_recurring_template_id" ON "public"."transactions" USING "btree" ("recurring_template_id");



CREATE INDEX "idx_transactions_type" ON "public"."transactions" USING "btree" ("type");



CREATE INDEX "idx_transactions_user_date" ON "public"."transactions" USING "btree" ("user_id", "date");



CREATE INDEX "idx_transactions_user_id" ON "public"."transactions" USING "btree" ("user_id");



CREATE INDEX "idx_transactions_user_type" ON "public"."transactions" USING "btree" ("user_id", "type");



CREATE INDEX "idx_user_permissions_permission_id" ON "public"."user_permissions" USING "btree" ("permission_id");



CREATE INDEX "idx_user_permissions_user_id" ON "public"."user_permissions" USING "btree" ("user_id");



CREATE INDEX "idx_user_sessions_active" ON "public"."user_sessions" USING "btree" ("is_active");



CREATE INDEX "idx_user_sessions_expires" ON "public"."user_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_user_sessions_user_id" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_user_subscriptions_end_date" ON "public"."user_subscriptions" USING "btree" ("end_date");



CREATE INDEX "idx_user_subscriptions_payment_id" ON "public"."user_subscriptions" USING "btree" ("payment_id");



CREATE INDEX "idx_user_subscriptions_plan_id" ON "public"."user_subscriptions" USING "btree" ("plan_id");



CREATE INDEX "idx_user_subscriptions_status" ON "public"."user_subscriptions" USING "btree" ("status");



CREATE INDEX "idx_user_subscriptions_status_end_date" ON "public"."user_subscriptions" USING "btree" ("status", "end_date");



CREATE INDEX "idx_user_subscriptions_user_id" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trigger_create_investment_main_transaction" BEFORE INSERT ON "public"."investment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."create_investment_main_transaction"();



CREATE OR REPLACE TRIGGER "trigger_delete_investment_main_transaction" AFTER DELETE ON "public"."investment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."delete_investment_main_transaction"();



CREATE OR REPLACE TRIGGER "trigger_transaction_balance_delete" AFTER DELETE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_account_balance_on_delete"();



CREATE OR REPLACE TRIGGER "trigger_transaction_balance_insert" AFTER INSERT ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_account_balance_on_insert"();



CREATE OR REPLACE TRIGGER "trigger_transaction_balance_update" AFTER UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_account_balance_on_update"();



CREATE OR REPLACE TRIGGER "trigger_update_account_balance" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_account_balance"();



CREATE OR REPLACE TRIGGER "trigger_update_budget_spent" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_budget_spent"();



CREATE OR REPLACE TRIGGER "trigger_update_investment_calculated_fields" BEFORE INSERT OR UPDATE ON "public"."investments" FOR EACH ROW EXECUTE FUNCTION "public"."update_investment_calculated_fields"();



CREATE OR REPLACE TRIGGER "trigger_update_investment_from_transactions" AFTER INSERT OR DELETE OR UPDATE ON "public"."investment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_investment_from_transactions"();



CREATE OR REPLACE TRIGGER "trigger_update_investment_main_transaction" AFTER UPDATE ON "public"."investment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_investment_main_transaction"();



CREATE OR REPLACE TRIGGER "update_accounts_updated_at" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_budget_templates_updated_at" BEFORE UPDATE ON "public"."budget_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_budgets_updated_at" BEFORE UPDATE ON "public"."budgets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_coupons_updated_at" BEFORE UPDATE ON "public"."coupons" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_emi_payments_updated_at" BEFORE UPDATE ON "public"."emi_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_emi_schedules_updated_at" BEFORE UPDATE ON "public"."emi_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_emi_templates_updated_at" BEFORE UPDATE ON "public"."emi_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_investment_portfolios_updated_at" BEFORE UPDATE ON "public"."investment_portfolios" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_investment_templates_updated_at" BEFORE UPDATE ON "public"."investment_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_investment_transactions_updated_at" BEFORE UPDATE ON "public"."investment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_lending_payments_updated_at" BEFORE UPDATE ON "public"."lending_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_lending_updated_at" BEFORE UPDATE ON "public"."lending" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_loans_updated_at" BEFORE UPDATE ON "public"."loans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_methods_updated_at" BEFORE UPDATE ON "public"."payment_methods" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_recurring_transactions_updated_at" BEFORE UPDATE ON "public"."recurring_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subcategories_updated_at" BEFORE UPDATE ON "public"."subcategories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscription_payments_updated_at" BEFORE UPDATE ON "public"."subscription_payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscription_plans_updated_at" BEFORE UPDATE ON "public"."subscription_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_transactions_updated_at" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_subscriptions_updated_at" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_audit_logs"
    ADD CONSTRAINT "admin_audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_insights"
    ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_templates"
    ADD CONSTRAINT "budget_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_usage"
    ADD CONSTRAINT "coupon_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emi_payments"
    ADD CONSTRAINT "emi_payments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emi_payments"
    ADD CONSTRAINT "emi_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id");



ALTER TABLE ONLY "public"."emi_payments"
    ADD CONSTRAINT "emi_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emi_schedules"
    ADD CONSTRAINT "emi_schedules_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emi_schedules"
    ADD CONSTRAINT "emi_schedules_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."emi_payments"("id");



ALTER TABLE ONLY "public"."emi_schedules"
    ADD CONSTRAINT "emi_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emi_templates"
    ADD CONSTRAINT "emi_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_groups"
    ADD CONSTRAINT "family_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_invitations"
    ADD CONSTRAINT "family_invitations_family_group_id_fkey" FOREIGN KEY ("family_group_id") REFERENCES "public"."family_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_invitations"
    ADD CONSTRAINT "family_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "fk_profiles_family_group" FOREIGN KEY ("family_group_id") REFERENCES "public"."family_groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "fk_profiles_invited_by" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."investment_performance_snapshots"
    ADD CONSTRAINT "investment_performance_snapshots_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investment_performance_snapshots"
    ADD CONSTRAINT "investment_performance_snapshots_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."investment_portfolios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investment_performance_snapshots"
    ADD CONSTRAINT "investment_performance_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investment_portfolios"
    ADD CONSTRAINT "investment_portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investment_price_history"
    ADD CONSTRAINT "investment_price_history_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investment_templates"
    ADD CONSTRAINT "investment_templates_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."investment_portfolios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."investment_templates"
    ADD CONSTRAINT "investment_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investment_transactions"
    ADD CONSTRAINT "investment_transactions_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investment_transactions"
    ADD CONSTRAINT "investment_transactions_main_transaction_id_fkey" FOREIGN KEY ("main_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."investment_transactions"
    ADD CONSTRAINT "investment_transactions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."investment_portfolios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."investment_transactions"
    ADD CONSTRAINT "investment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "public"."investment_portfolios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lending"
    ADD CONSTRAINT "lending_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id");



ALTER TABLE ONLY "public"."lending"
    ADD CONSTRAINT "lending_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."lending_payments"
    ADD CONSTRAINT "lending_payments_lending_id_fkey" FOREIGN KEY ("lending_id") REFERENCES "public"."lending"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lending_payments"
    ADD CONSTRAINT "lending_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id");



ALTER TABLE ONLY "public"."lending_payments"
    ADD CONSTRAINT "lending_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lending"
    ADD CONSTRAINT "lending_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lending"
    ADD CONSTRAINT "lending_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id");



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."loans"
    ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurring_transactions"
    ADD CONSTRAINT "recurring_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_payments"
    ADD CONSTRAINT "subscription_payments_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id");



ALTER TABLE ONLY "public"."subscription_payments"
    ADD CONSTRAINT "subscription_payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id");



ALTER TABLE ONLY "public"."subscription_payments"
    ADD CONSTRAINT "subscription_payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscription_payments"
    ADD CONSTRAINT "subscription_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_payments"
    ADD CONSTRAINT "subscription_payments_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_investment_transaction_id_fkey" FOREIGN KEY ("investment_transaction_id") REFERENCES "public"."investment_transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_recurring_template_id_fkey" FOREIGN KEY ("recurring_template_id") REFERENCES "public"."recurring_transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_transfer_to_account_id_fkey" FOREIGN KEY ("transfer_to_account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."subscription_payments"("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can access all subscription payments" ON "public"."subscription_payments" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."roles" "r" ON (("p"."role_id" = "r"."id")))
  WHERE (("p"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "Admins can manage all subscriptions" ON "public"."user_subscriptions" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."roles" "r" ON (("p"."role_id" = "r"."id")))
  WHERE (("p"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))));



CREATE POLICY "Admins can manage global templates" ON "public"."budget_templates" USING ((("is_global" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role_id" IN ( SELECT "roles"."id"
           FROM "public"."roles"
          WHERE (("roles"."name")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[])))))))));



CREATE POLICY "Block access to permissions" ON "public"."permissions" USING (false);



CREATE POLICY "Block access to role permissions" ON "public"."role_permissions" USING (false);



CREATE POLICY "Block access to roles" ON "public"."roles" USING (false);



CREATE POLICY "Block access to user permissions" ON "public"."user_permissions" USING (false);



CREATE POLICY "Block audit logs access" ON "public"."admin_audit_logs" USING (false);



CREATE POLICY "Family members can view family invitations" ON "public"."family_invitations" FOR SELECT USING ((("invited_by" = ( SELECT "profiles"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))) OR ("family_group_id" = ( SELECT "profiles"."family_group_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Primary users can manage family invitations" ON "public"."family_invitations" USING (("invited_by" = ( SELECT "profiles"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Primary users can manage their family group" ON "public"."family_groups" USING (("created_by" = ( SELECT "profiles"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Public can view active coupons" ON "public"."coupons" FOR SELECT USING ((("is_active" = true) AND (("scope")::"text" = 'public'::"text")));



CREATE POLICY "System can manage investment price history" ON "public"."investment_price_history" USING (true);



CREATE POLICY "System can manage sessions" ON "public"."user_sessions" USING (true);



CREATE POLICY "Users can access own subscription payments" ON "public"."subscription_payments" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own accounts" ON "public"."accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own accounts" ON "public"."accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own ai insights" ON "public"."ai_insights" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own budgets" ON "public"."budgets" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own emi payments" ON "public"."emi_payments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own emi schedules" ON "public"."emi_schedules" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own emi templates" ON "public"."emi_templates" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own investment performance" ON "public"."investment_performance_snapshots" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own investment portfolios" ON "public"."investment_portfolios" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own investment templates" ON "public"."investment_templates" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own investment transactions" ON "public"."investment_transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own investments" ON "public"."investments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own lending" ON "public"."lending" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own lending payments" ON "public"."lending_payments" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own loans" ON "public"."loans" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own notifications" ON "public"."notifications" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own recurring transactions" ON "public"."recurring_transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own templates" ON "public"."budget_templates" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own transactions" ON "public"."transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own transactions" ON "public"."transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read all accounts" ON "public"."accounts" FOR SELECT USING ((("user_id" IS NULL) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Users can read all categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Users can read all subcategories" ON "public"."subcategories" FOR SELECT USING (true);



CREATE POLICY "Users can read global investment templates" ON "public"."investment_templates" FOR SELECT USING (("is_global" = true));



CREATE POLICY "Users can read global templates" ON "public"."budget_templates" FOR SELECT USING (("is_global" = true));



CREATE POLICY "Users can read investment price history" ON "public"."investment_price_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."investments" "i"
  WHERE (("i"."id" = "investment_price_history"."investment_id") AND ("i"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read own subscriptions" ON "public"."user_subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own accounts" ON "public"."accounts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view global templates for all operations" ON "public"."budget_templates" FOR SELECT USING (("is_global" = true));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own sessions" ON "public"."user_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own family group" ON "public"."family_groups" FOR SELECT USING ((("created_by" = ( SELECT "profiles"."user_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"()))) OR ("id" = ( SELECT "profiles"."family_group_id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_usage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coupon_usage_insert_policy" ON "public"."coupon_usage" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "coupon_usage_select_policy" ON "public"."coupon_usage" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coupons_comprehensive_access" ON "public"."coupons" USING (((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."roles" "r" ON (("p"."role_id" = "r"."id")))
  WHERE (("p"."user_id" = "auth"."uid"()) AND (("r"."name")::"text" = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::"text"[]))))) OR (("is_active" = true) AND (("scope")::"text" = 'public'::"text")) OR (("is_active" = true) AND ("auth"."uid"() = ANY ("allowed_users")))));



ALTER TABLE "public"."emi_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."emi_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."emi_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_performance_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_portfolios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_price_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lending" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lending_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_methods_select_policy" ON "public"."payment_methods" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recurring_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subcategories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscription_history_select_policy" ON "public"."subscription_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."subscription_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscription_plans_select_policy" ON "public"."subscription_plans" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_family_invitation"("p_user_id" "uuid", "p_invitation_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_family_invitation"("p_user_id" "uuid", "p_invitation_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_family_invitation"("p_user_id" "uuid", "p_invitation_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_create_coupon"("p_code" character varying, "p_description" "text", "p_type" "text", "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" "text", "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_create_coupon"("p_code" character varying, "p_description" "text", "p_type" "text", "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" "text", "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_create_coupon"("p_code" character varying, "p_description" "text", "p_type" "text", "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" "text", "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_create_coupon"("p_code" character varying, "p_description" "text", "p_type" character varying, "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" character varying, "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_create_coupon"("p_code" character varying, "p_description" "text", "p_type" character varying, "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" character varying, "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_create_coupon"("p_code" character varying, "p_description" "text", "p_type" character varying, "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" character varying, "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_coupon"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_coupon"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_coupon"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_all_coupons"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_all_coupons"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_all_coupons"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_subscription_analytics"("p_admin_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_analytics"("p_admin_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_analytics"("p_admin_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_subscription_overview"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_overview"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_overview"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments_count"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments_count"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_subscription_payments_count"("p_admin_user_id" "uuid", "p_status" "text", "p_search" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_manage_user_subscription"("p_admin_user_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_plan_id" "uuid", "p_extend_months" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_manage_user_subscription"("p_admin_user_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_plan_id" "uuid", "p_extend_months" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_manage_user_subscription"("p_admin_user_id" "uuid", "p_user_id" "uuid", "p_action" "text", "p_plan_id" "uuid", "p_extend_months" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_toggle_coupon_status"("p_coupon_id" "uuid", "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_toggle_coupon_status"("p_coupon_id" "uuid", "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_toggle_coupon_status"("p_coupon_id" "uuid", "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_coupon"("p_id" "uuid", "p_description" "text", "p_type" "text", "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" "text", "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_coupon"("p_id" "uuid", "p_description" "text", "p_type" "text", "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" "text", "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_coupon"("p_id" "uuid", "p_description" "text", "p_type" "text", "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" "text", "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_coupon"("p_coupon_id" "uuid", "p_description" "text", "p_type" character varying, "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" character varying, "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_coupon"("p_coupon_id" "uuid", "p_description" "text", "p_type" character varying, "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" character varying, "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_coupon"("p_coupon_id" "uuid", "p_description" "text", "p_type" character varying, "p_value" numeric, "p_max_uses" integer, "p_max_uses_per_user" integer, "p_minimum_amount" numeric, "p_max_discount_amount" numeric, "p_expires_at" timestamp with time zone, "p_scope" character varying, "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_payment_status"("p_admin_user_id" "uuid", "p_payment_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_rejection_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_payment_status"("p_admin_user_id" "uuid", "p_payment_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_rejection_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_payment_status"("p_admin_user_id" "uuid", "p_payment_id" "uuid", "p_status" "text", "p_admin_notes" "text", "p_rejection_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_coupon"("p_user_id" "uuid", "p_coupon_code" character varying, "p_plan_name" character varying, "p_billing_cycle" character varying, "p_base_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."apply_coupon"("p_user_id" "uuid", "p_coupon_code" character varying, "p_plan_name" character varying, "p_billing_cycle" character varying, "p_base_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_coupon"("p_user_id" "uuid", "p_coupon_code" character varying, "p_plan_name" character varying, "p_billing_cycle" character varying, "p_base_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_next_execution_date"("base_date" "date", "frequency" character varying, "interval_value" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_next_execution_date"("base_date" "date", "frequency" character varying, "interval_value" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_next_execution_date"("base_date" "date", "frequency" character varying, "interval_value" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."can_create_account"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_create_account"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_create_account"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_create_account_type"("p_user_id" "uuid", "p_account_type" "public"."account_type") TO "anon";
GRANT ALL ON FUNCTION "public"."can_create_account_type"("p_user_id" "uuid", "p_account_type" "public"."account_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_create_account_type"("p_user_id" "uuid", "p_account_type" "public"."account_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_auto_payment_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_auto_payment_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_auto_payment_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_ai_insights"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_ai_insights"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_ai_insights"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_cron_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_cron_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_cron_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_better_default_accounts"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_better_default_accounts"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_better_default_accounts"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_accounts"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_accounts"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_accounts"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_emi_schedule_entries"("p_loan_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_emi_schedule_entries"("p_loan_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_emi_schedule_entries"("p_loan_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_family_group"("p_user_id" "uuid", "p_family_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."create_family_group"("p_user_id" "uuid", "p_family_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_family_group"("p_user_id" "uuid", "p_family_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_global_accounts"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_global_accounts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_global_accounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_global_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_global_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_global_categories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_investment_main_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_investment_main_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_investment_main_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_lending_payment_transaction"("p_lending_id" "uuid", "p_user_id" "uuid", "p_payment_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_lending_payment_transaction"("p_lending_id" "uuid", "p_user_id" "uuid", "p_payment_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_lending_payment_transaction"("p_lending_id" "uuid", "p_user_id" "uuid", "p_payment_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_lending_transaction"("p_lending_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_transaction_type" character varying, "p_payment_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_lending_transaction"("p_lending_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_transaction_type" character varying, "p_payment_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_lending_transaction"("p_lending_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_transaction_type" character varying, "p_payment_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_loan_payment_transaction"("p_loan_id" "uuid", "p_user_id" "uuid", "p_payment_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_loan_payment_transaction"("p_loan_id" "uuid", "p_user_id" "uuid", "p_payment_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_loan_payment_transaction"("p_loan_id" "uuid", "p_user_id" "uuid", "p_payment_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_payment_reminders"("p_user_id" "uuid", "p_check_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_payment_reminders"("p_user_id" "uuid", "p_check_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_payment_reminders"("p_user_id" "uuid", "p_check_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_purchase_emi"("p_user_id" "uuid", "p_item_name" "text", "p_vendor_name" "text", "p_purchase_category" "text", "p_principal_amount" numeric, "p_interest_rate" numeric, "p_tenure_months" integer, "p_purchase_date" "date", "p_down_payment" numeric, "p_item_condition" "text", "p_warranty_period" integer, "p_payment_day" integer, "p_account_id" "uuid", "p_category_id" "uuid", "p_notes" "text", "p_currency" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_purchase_emi"("p_user_id" "uuid", "p_item_name" "text", "p_vendor_name" "text", "p_purchase_category" "text", "p_principal_amount" numeric, "p_interest_rate" numeric, "p_tenure_months" integer, "p_purchase_date" "date", "p_down_payment" numeric, "p_item_condition" "text", "p_warranty_period" integer, "p_payment_day" integer, "p_account_id" "uuid", "p_category_id" "uuid", "p_notes" "text", "p_currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_purchase_emi"("p_user_id" "uuid", "p_item_name" "text", "p_vendor_name" "text", "p_purchase_category" "text", "p_principal_amount" numeric, "p_interest_rate" numeric, "p_tenure_months" integer, "p_purchase_date" "date", "p_down_payment" numeric, "p_item_condition" "text", "p_warranty_period" integer, "p_payment_day" integer, "p_account_id" "uuid", "p_category_id" "uuid", "p_notes" "text", "p_currency" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_coupon_usage"("coupon_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_coupon_usage"("coupon_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_coupon_usage"("coupon_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_investment_main_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_investment_main_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_investment_main_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."exec_sql"("query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."exec_sql"("query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."exec_sql"("query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_pending_investment_templates"() TO "anon";
GRANT ALL ON FUNCTION "public"."execute_pending_investment_templates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_pending_investment_templates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_pending_recurring_transactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."execute_pending_recurring_transactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_pending_recurring_transactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_emi_schedule"("p_loan_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_emi_schedule"("p_loan_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_emi_schedule"("p_loan_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_account_display_balance"("account_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_account_display_balance"("account_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_account_display_balance"("account_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_account_limit"("plan_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_account_limit"("plan_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_account_limit"("plan_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_allowed_account_types"("plan_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_allowed_account_types"("plan_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_allowed_account_types"("plan_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_asset_allocation_data"("p_user_id" "uuid", "p_currency" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_asset_allocation_data"("p_user_id" "uuid", "p_currency" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_asset_allocation_data"("p_user_id" "uuid", "p_currency" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_credit"("account_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_credit"("account_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_credit"("account_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_complete_schema_info"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_complete_schema_info"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_complete_schema_info"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_constraints"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_constraints"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_constraints"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cron_job_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_cron_job_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cron_job_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_database_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_database_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_database_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_effective_category"("p_category_id" "uuid", "p_subcategory_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_effective_category"("p_category_id" "uuid", "p_subcategory_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_effective_category"("p_category_id" "uuid", "p_subcategory_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_emi_overview"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_emi_overview"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_emi_overview"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_emi_overview"("p_user_id" "uuid", "p_currency" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_emi_overview"("p_user_id" "uuid", "p_currency" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_emi_overview"("p_user_id" "uuid", "p_currency" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_family_account_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_family_account_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_family_account_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_family_members"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_family_members"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_family_members"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_financial_summary"("p_user_id" "uuid", "p_currency" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_financial_summary"("p_user_id" "uuid", "p_currency" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_financial_summary"("p_user_id" "uuid", "p_currency" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_indexes"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_indexes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_indexes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_investment_analytics_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_investment_analytics_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_investment_analytics_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_lending_overview"("p_user_id" "uuid", "p_currency" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_lending_overview"("p_user_id" "uuid", "p_currency" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_lending_overview"("p_user_id" "uuid", "p_currency" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monthly_trend_data"("p_user_id" "uuid", "p_currency" character varying, "p_months_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_monthly_trend_data"("p_user_id" "uuid", "p_currency" character varying, "p_months_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monthly_trend_data"("p_user_id" "uuid", "p_currency" character varying, "p_months_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_portfolio_performance_data"("p_user_id" "uuid", "p_period" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_portfolio_performance_data"("p_user_id" "uuid", "p_period" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_portfolio_performance_data"("p_user_id" "uuid", "p_period" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchase_emi_overview"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchase_emi_overview"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchase_emi_overview"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_rls_policies"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_rls_policies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_rls_policies"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sequences"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_sequences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sequences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_subscription_status"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_subscription_status"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_subscription_status"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_triggers"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_triggers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_triggers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_account_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_account_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_account_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_permissions"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_tables"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tables"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tables"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_resource" "text", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_resource" "text", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_resource" "text", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_coupon_usage"("coupon_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_coupon_usage"("coupon_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_coupon_usage"("coupon_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_template_usage"("template_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_template_usage"("template_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_template_usage"("template_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_family_member"("p_inviter_id" "uuid", "p_email" "text", "p_role" "public"."family_role_type") TO "anon";
GRANT ALL ON FUNCTION "public"."invite_family_member"("p_inviter_id" "uuid", "p_email" "text", "p_role" "public"."family_role_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_family_member"("p_inviter_id" "uuid", "p_email" "text", "p_role" "public"."family_role_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_family_primary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_family_primary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_family_primary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_emi_payment_paid"("p_schedule_id" "uuid", "p_user_id" "uuid", "p_payment_amount" numeric, "p_payment_date" "date", "p_payment_method" character varying, "p_late_fee" numeric, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_emi_payment_paid"("p_schedule_id" "uuid", "p_user_id" "uuid", "p_payment_amount" numeric, "p_payment_date" "date", "p_payment_method" character varying, "p_late_fee" numeric, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_emi_payment_paid"("p_schedule_id" "uuid", "p_user_id" "uuid", "p_payment_amount" numeric, "p_payment_date" "date", "p_payment_method" character varying, "p_late_fee" numeric, "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_auto_debit_payments"("p_user_id" "uuid", "p_process_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."process_auto_debit_payments"("p_user_id" "uuid", "p_process_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_auto_debit_payments"("p_user_id" "uuid", "p_process_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_daily_auto_payments"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_daily_auto_payments"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_daily_auto_payments"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_lending_auto_debit_payments"("p_user_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."process_lending_auto_debit_payments"("p_user_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_lending_auto_debit_payments"("p_user_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."reverse_account_balance"("p_account_id" "uuid", "p_amount" numeric, "p_transaction_type" "public"."transaction_type") TO "anon";
GRANT ALL ON FUNCTION "public"."reverse_account_balance"("p_account_id" "uuid", "p_amount" numeric, "p_transaction_type" "public"."transaction_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reverse_account_balance"("p_account_id" "uuid", "p_amount" numeric, "p_transaction_type" "public"."transaction_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."revert_coupon_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."revert_coupon_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."revert_coupon_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_coupon_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_coupon_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_coupon_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_auto_payments_now"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_auto_payments_now"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_auto_payments_now"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_account_balance_on_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_account_balance_on_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_account_balance_on_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_account_balance_on_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_account_balance_on_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_account_balance_on_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_account_balance_on_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_account_balance_on_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_account_balance_on_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_account_balance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_account_balance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_account_balance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_account_balance"("p_account_id" "uuid", "p_amount" numeric, "p_transaction_type" "public"."transaction_type") TO "anon";
GRANT ALL ON FUNCTION "public"."update_account_balance"("p_account_id" "uuid", "p_amount" numeric, "p_transaction_type" "public"."transaction_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_account_balance"("p_account_id" "uuid", "p_amount" numeric, "p_transaction_type" "public"."transaction_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_budget_for_expense"("p_category_id" "uuid", "p_amount" numeric, "p_date" "date", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_budget_for_expense"("p_category_id" "uuid", "p_amount" numeric, "p_date" "date", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_budget_for_expense"("p_category_id" "uuid", "p_amount" numeric, "p_date" "date", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_budget_spent"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_budget_spent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_budget_spent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_investment_calculated_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_investment_calculated_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_investment_calculated_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_investment_from_transactions"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_investment_from_transactions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_investment_from_transactions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_investment_main_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_investment_main_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_investment_main_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upgrade_user_subscription"("p_user_id" "uuid", "p_payment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."upgrade_user_subscription"("p_user_id" "uuid", "p_payment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upgrade_user_subscription"("p_user_id" "uuid", "p_payment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_coupon_usage"("p_user_id" "uuid", "p_coupon_code" character varying, "p_base_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_coupon_usage"("p_user_id" "uuid", "p_coupon_code" character varying, "p_base_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_coupon_usage"("p_user_id" "uuid", "p_coupon_code" character varying, "p_base_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_credit_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_credit_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_credit_transaction"() TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_insights" TO "anon";
GRANT ALL ON TABLE "public"."ai_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_insights" TO "service_role";



GRANT ALL ON TABLE "public"."budget_templates" TO "anon";
GRANT ALL ON TABLE "public"."budget_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_templates" TO "service_role";



GRANT ALL ON TABLE "public"."budgets" TO "anon";
GRANT ALL ON TABLE "public"."budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."budgets" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_usage" TO "anon";
GRANT ALL ON TABLE "public"."coupon_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_usage" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."cron_job_logs" TO "anon";
GRANT ALL ON TABLE "public"."cron_job_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."cron_job_logs" TO "service_role";



GRANT ALL ON TABLE "public"."cron_job_stats" TO "anon";
GRANT ALL ON TABLE "public"."cron_job_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."cron_job_stats" TO "service_role";



GRANT ALL ON TABLE "public"."emi_payments" TO "anon";
GRANT ALL ON TABLE "public"."emi_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."emi_payments" TO "service_role";



GRANT ALL ON TABLE "public"."emi_schedules" TO "anon";
GRANT ALL ON TABLE "public"."emi_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."emi_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."emi_templates" TO "anon";
GRANT ALL ON TABLE "public"."emi_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."emi_templates" TO "service_role";



GRANT ALL ON TABLE "public"."family_groups" TO "anon";
GRANT ALL ON TABLE "public"."family_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."family_groups" TO "service_role";



GRANT ALL ON TABLE "public"."family_invitations" TO "anon";
GRANT ALL ON TABLE "public"."family_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."family_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."investment_performance_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."investment_performance_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."investment_performance_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."investment_portfolios" TO "anon";
GRANT ALL ON TABLE "public"."investment_portfolios" TO "authenticated";
GRANT ALL ON TABLE "public"."investment_portfolios" TO "service_role";



GRANT ALL ON TABLE "public"."investment_price_history" TO "anon";
GRANT ALL ON TABLE "public"."investment_price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."investment_price_history" TO "service_role";



GRANT ALL ON TABLE "public"."investment_templates" TO "anon";
GRANT ALL ON TABLE "public"."investment_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."investment_templates" TO "service_role";



GRANT ALL ON TABLE "public"."investment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."investment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."investment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."investments" TO "anon";
GRANT ALL ON TABLE "public"."investments" TO "authenticated";
GRANT ALL ON TABLE "public"."investments" TO "service_role";



GRANT ALL ON TABLE "public"."investments_backup" TO "anon";
GRANT ALL ON TABLE "public"."investments_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."investments_backup" TO "service_role";



GRANT ALL ON TABLE "public"."lending" TO "anon";
GRANT ALL ON TABLE "public"."lending" TO "authenticated";
GRANT ALL ON TABLE "public"."lending" TO "service_role";



GRANT ALL ON TABLE "public"."lending_payments" TO "anon";
GRANT ALL ON TABLE "public"."lending_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."lending_payments" TO "service_role";



GRANT ALL ON TABLE "public"."subcategories" TO "anon";
GRANT ALL ON TABLE "public"."subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."subcategories" TO "service_role";



GRANT ALL ON TABLE "public"."lending_with_categories" TO "anon";
GRANT ALL ON TABLE "public"."lending_with_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."lending_with_categories" TO "service_role";



GRANT ALL ON TABLE "public"."loans" TO "anon";
GRANT ALL ON TABLE "public"."loans" TO "authenticated";
GRANT ALL ON TABLE "public"."loans" TO "service_role";



GRANT ALL ON TABLE "public"."loans_with_categories" TO "anon";
GRANT ALL ON TABLE "public"."loans_with_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."loans_with_categories" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_emis" TO "anon";
GRANT ALL ON TABLE "public"."purchase_emis" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_emis" TO "service_role";



GRANT ALL ON TABLE "public"."recent_cron_jobs" TO "anon";
GRANT ALL ON TABLE "public"."recent_cron_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."recent_cron_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."recurring_transactions" TO "anon";
GRANT ALL ON TABLE "public"."recurring_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."recurring_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_history" TO "anon";
GRANT ALL ON TABLE "public"."subscription_history" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_history" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_payments" TO "anon";
GRANT ALL ON TABLE "public"."subscription_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_payments" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_payments_with_users" TO "anon";
GRANT ALL ON TABLE "public"."subscription_payments_with_users" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_payments_with_users" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_seed_data_summary" TO "anon";
GRANT ALL ON TABLE "public"."subscription_seed_data_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_seed_data_summary" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."unified_transactions" TO "anon";
GRANT ALL ON TABLE "public"."unified_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions_with_details" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions_with_details" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions_with_details" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






