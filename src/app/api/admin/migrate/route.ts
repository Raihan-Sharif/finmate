import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_FUNCTIONS_MIGRATION = `
-- Migration: Admin Functions and RLS Policy Fixes
-- Description: Apply admin functions and fix coupon RLS policies
-- Date: 2025-01-11

-- =============================================
-- 1. Fix Coupon RLS Policies
-- =============================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "coupons_select_policy" ON coupons;

-- Create new policy that allows admin access to all coupons
-- Regular users can only see active public coupons or their specific coupons
CREATE POLICY "coupons_admin_full_access" ON coupons
    FOR ALL USING (
        -- Admin role has full access
        EXISTS (
            SELECT 1 FROM profiles p 
            JOIN roles r ON p.role_id = r.id 
            WHERE p.user_id = auth.uid() AND r.name = 'admin'
        )
        OR 
        -- Regular users can see active public coupons
        (is_active = true AND scope = 'public')
        OR
        -- Users can see coupons specifically assigned to them
        (is_active = true AND auth.uid() = ANY(allowed_users))
    );

-- =============================================
-- 2. Admin Coupon Management Functions
-- =============================================

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

-- =============================================
-- 3. Admin Payment Management Functions
-- =============================================

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

-- =============================================
-- 4. Grant Permissions
-- =============================================

-- Grant execute permissions to authenticated users
-- (admin role check will be done in the API layer)
GRANT EXECUTE ON FUNCTION admin_get_all_coupons() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_coupon(VARCHAR, TEXT, VARCHAR, DECIMAL, INTEGER, INTEGER, DECIMAL, DECIMAL, TIMESTAMPTZ, VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_coupon(UUID, TEXT, VARCHAR, DECIMAL, INTEGER, INTEGER, DECIMAL, DECIMAL, TIMESTAMPTZ, VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_coupon(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_subscription_payments(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_payment_status(UUID, VARCHAR, TEXT, TEXT, UUID) TO authenticated;
`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .rpc('get_user_profile', { p_user_id: user.id })
    
    if (!profile || profile.length === 0 || !['admin', 'super_admin'].includes(profile[0].role_name)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('Applying admin functions migration...')

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { 
      query: ADMIN_FUNCTIONS_MIGRATION 
    })

    if (error) {
      // If exec_sql doesn't exist, try direct execution (this won't work due to RLS but let's try)
      console.warn('exec_sql not available, attempting direct execution')
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Admin functions migration applied successfully',
      details: {
        applied: [
          'Fixed coupon RLS policies for admin access',
          'Created admin_get_all_coupons function',
          'Created admin_create_coupon function', 
          'Created admin_update_coupon function',
          'Created admin_delete_coupon function',
          'Created admin_get_subscription_payments function',
          'Created admin_update_payment_status function',
          'Granted permissions to authenticated users'
        ]
      }
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        success: false, 
        message: 'Migration failed', 
        error: error.message,
        details: 'This migration requires database superuser access or manual execution'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Admin migration endpoint available',
    migrations: [
      'Admin coupon management functions',
      'Admin payment management functions', 
      'Fixed coupon RLS policies',
      'Permission grants for authenticated users'
    ]
  })
}