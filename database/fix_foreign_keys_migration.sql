-- =====================================================
-- 🔧 FOREIGN KEY RELATIONSHIPS FIX
-- =====================================================
-- Purpose: Add missing foreign key constraints for subscription system
-- This will fix the "Could not find a relationship" errors

-- =====================================================
-- 🎯 ADD MISSING FOREIGN KEY CONSTRAINTS
-- =====================================================

-- 1. Fix subscription_payments table foreign keys
-- subscription_payments.plan_id -> subscription_plans.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'subscription_payments_plan_id_fkey'
        AND table_name = 'subscription_payments'
    ) THEN
        ALTER TABLE "public"."subscription_payments"
        ADD CONSTRAINT "subscription_payments_plan_id_fkey"
        FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- subscription_payments.payment_method_id -> payment_methods.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'subscription_payments_payment_method_id_fkey'
        AND table_name = 'subscription_payments'
    ) THEN
        ALTER TABLE "public"."subscription_payments"
        ADD CONSTRAINT "subscription_payments_payment_method_id_fkey"
        FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- subscription_payments.coupon_id -> coupons.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'subscription_payments_coupon_id_fkey'
        AND table_name = 'subscription_payments'
    ) THEN
        ALTER TABLE "public"."subscription_payments"
        ADD CONSTRAINT "subscription_payments_coupon_id_fkey"
        FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Fix user_subscriptions table foreign keys
-- user_subscriptions.plan_id -> subscription_plans.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_subscriptions_plan_id_fkey'
        AND table_name = 'user_subscriptions'
    ) THEN
        ALTER TABLE "public"."user_subscriptions"
        ADD CONSTRAINT "user_subscriptions_plan_id_fkey"
        FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE RESTRICT;
    END IF;
END $$;

-- user_subscriptions.payment_id -> subscription_payments.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_subscriptions_payment_id_fkey'
        AND table_name = 'user_subscriptions'
    ) THEN
        ALTER TABLE "public"."user_subscriptions"
        ADD CONSTRAINT "user_subscriptions_payment_id_fkey"
        FOREIGN KEY ("payment_id") REFERENCES "public"."subscription_payments"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- 🔍 CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for subscription_payments
CREATE INDEX IF NOT EXISTS "idx_subscription_payments_plan_id" ON "public"."subscription_payments" ("plan_id");
CREATE INDEX IF NOT EXISTS "idx_subscription_payments_payment_method_id" ON "public"."subscription_payments" ("payment_method_id");
CREATE INDEX IF NOT EXISTS "idx_subscription_payments_coupon_id" ON "public"."subscription_payments" ("coupon_id");
CREATE INDEX IF NOT EXISTS "idx_subscription_payments_status" ON "public"."subscription_payments" ("status");

-- Indexes for user_subscriptions
CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_plan_id" ON "public"."user_subscriptions" ("plan_id");
CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_payment_id" ON "public"."user_subscriptions" ("payment_id");
CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_status" ON "public"."user_subscriptions" ("status");
CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_end_date" ON "public"."user_subscriptions" ("end_date");

-- =====================================================
-- 📊 REFRESH SCHEMA CACHE (Supabase PostgREST)
-- =====================================================

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- ✅ VERIFICATION QUERIES
-- =====================================================

-- Verify foreign keys were created
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_name IN ('subscription_payments', 'user_subscriptions')
    AND constraint_name LIKE '%_plan_id_fkey'
    OR constraint_name LIKE '%_payment_method_id_fkey'
    OR constraint_name LIKE '%_coupon_id_fkey'
    OR constraint_name LIKE '%_payment_id_fkey';

    RAISE NOTICE 'Created % foreign key constraints for subscription tables', fk_count;
END $$;

-- =====================================================
-- 💬 COMPLETION MESSAGE
-- =====================================================

COMMENT ON SCHEMA "public" IS 'Foreign key relationships fixed for subscription system - PostgREST joins should now work properly';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Foreign key migration completed successfully!';
    RAISE NOTICE '🔗 All subscription table relationships are now properly defined';
    RAISE NOTICE '📊 Schema cache refresh triggered for PostgREST';
    RAISE NOTICE '🚀 Subscription management APIs should now work without foreign key errors';
END $$;