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

CREATE OR REPLACE FUNCTION "public"."admin_delete_coupon"("p_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM coupons WHERE id = p_id;
    RETURN FOUND;
END;
$$;

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

CREATE OR REPLACE FUNCTION "public"."admin_get_subscription_payments"() RETURNS TABLE("id" "uuid", "user_id" "uuid", "plan_id" "uuid", "payment_method_id" "uuid", "billing_cycle" "text", "transaction_id" "text", "sender_number" "text", "base_amount" numeric, "discount_amount" numeric, "final_amount" numeric, "coupon_id" "uuid", "status" "text", "admin_notes" "text", "rejection_reason" "text", "submitted_at" timestamp with time zone, "verified_at" timestamp with time zone, "approved_at" timestamp with time zone, "rejected_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "currency" "text", "user_full_name" "text", "user_email" "text", "plan_name" "text", "plan_display_name" "text", "plan_price_monthly" numeric, "plan_price_yearly" numeric, "payment_method_name" "text", "payment_method_display_name" "text", "coupon_code" "text", "coupon_type" "text", "coupon_value" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Return comprehensive payment data with all joins (no permission check for simplified version)
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
    -- User data with fallbacks
    COALESCE(p.full_name, 'Unknown User') as user_full_name,
    COALESCE(au.email, 'unknown@example.com') as user_email,
    -- Plan data with fallbacks
    COALESCE(spl.plan_name, 'unknown') as plan_name,
    COALESCE(spl.display_name, 'Unknown Plan') as plan_display_name,
    COALESCE(spl.price_monthly, 0) as plan_price_monthly,
    COALESCE(spl.price_yearly, 0) as plan_price_yearly,
    -- Payment method data with fallbacks (corrected field names)
    COALESCE(pm.method_name, 'manual') as payment_method_name,
    COALESCE(pm.display_name, 'Manual Payment') as payment_method_display_name,
    -- Coupon data (nullable)
    c.code as coupon_code,
    c.type as coupon_type,
    c.value as coupon_value
  FROM subscription_payments sp
  -- Join with profiles
  LEFT JOIN profiles p ON sp.user_id = p.user_id
  -- Join with auth.users for email (using auth schema)
  LEFT JOIN auth.users au ON sp.user_id = au.id
  -- Join with subscription plans
  LEFT JOIN subscription_plans spl ON sp.plan_id = spl.id
  -- Join with payment methods (using payment_method_id)
  LEFT JOIN payment_methods pm ON sp.payment_method_id = pm.id
  -- Join with coupons (optional)
  LEFT JOIN coupons c ON sp.coupon_id = c.id
  ORDER BY sp.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."admin_get_subscription_payments"("p_admin_user_id" "uuid", "p_status" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "user_id" "uuid", "plan_id" "uuid", "payment_method_id" "uuid", "billing_cycle" "text", "transaction_id" "text", "sender_number" "text", "base_amount" numeric, "discount_amount" numeric, "final_amount" numeric, "coupon_id" "uuid", "status" "text", "admin_notes" "text", "rejection_reason" "text", "submitted_at" timestamp with time zone, "verified_at" timestamp with time zone, "approved_at" timestamp with time zone, "rejected_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "currency" "text", "user_full_name" "text", "user_email" "text", "plan_name" "text", "plan_display_name" "text", "plan_price_monthly" numeric, "plan_price_yearly" numeric, "payment_method_name" "text", "payment_method_display_name" "text", "coupon_code" "text", "coupon_type" "text", "coupon_value" numeric)
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

  -- Return comprehensive payment data with all joins
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
    -- User data with fallbacks
    COALESCE(p.full_name, 'Unknown User') as user_full_name,
    COALESCE(au.email, 'unknown@example.com') as user_email,
    -- Plan data with fallbacks
    COALESCE(spl.plan_name, 'unknown') as plan_name,
    COALESCE(spl.display_name, 'Unknown Plan') as plan_display_name,
    COALESCE(spl.price_monthly, 0) as plan_price_monthly,
    COALESCE(spl.price_yearly, 0) as plan_price_yearly,
    -- Payment method data with fallbacks (corrected field names)
    COALESCE(pm.method_name, 'manual') as payment_method_name,
    COALESCE(pm.display_name, 'Manual Payment') as payment_method_display_name,
    -- Coupon data (nullable)
    c.code as coupon_code,
    c.type as coupon_type,
    c.value as coupon_value
  FROM subscription_payments sp
  -- Join with profiles
  LEFT JOIN profiles p ON sp.user_id = p.user_id
  -- Join with auth.users for email (using auth schema)
  LEFT JOIN auth.users au ON sp.user_id = au.id
  -- Join with subscription plans
  LEFT JOIN subscription_plans spl ON sp.plan_id = spl.id
  -- Join with payment methods (using payment_method_id)
  LEFT JOIN payment_methods pm ON sp.payment_method_id = pm.id
  -- Join with coupons (optional)
  LEFT JOIN coupons c ON sp.coupon_id = c.id
  WHERE
    (p_status IS NULL OR p_status = 'all' OR sp.status::text = p_status)
  ORDER BY sp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."admin_get_subscription_payments_count"("p_admin_user_id" "uuid", "p_status" "text" DEFAULT NULL::"text") RETURNS integer
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

  -- Get count
  SELECT COUNT(*)
  INTO payment_count
  FROM subscription_payments sp
  WHERE
    (p_status IS NULL OR p_status = 'all' OR sp.status = p_status);

  RETURN payment_count;
END;
$$;

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

CREATE OR REPLACE FUNCTION "public"."trigger_auto_payments_now"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN process_daily_auto_payments();
END;
$$;

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

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

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

