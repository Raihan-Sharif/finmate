-- =====================================================
-- 🌱 SUBSCRIPTION SYSTEM SEED DATA
-- =====================================================
-- Purpose: Create sample data for testing subscription management system
-- This includes plans, payment methods, and sample transactions

-- =====================================================
-- 🎯 SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO "public"."subscription_plans" (
    "id",
    "plan_name",
    "display_name",
    "description",
    "price_monthly",
    "price_yearly",
    "features",
    "max_accounts",
    "max_family_members",
    "allowed_account_types",
    "is_active",
    "sort_order"
) VALUES
-- Basic Plan
(
    gen_random_uuid(),
    'basic',
    'Basic Plan',
    'Perfect for individuals just starting their financial journey',
    499.00,
    4990.00,
    '["Up to 3 bank accounts", "Basic transaction tracking", "Monthly reports", "Email support"]'::jsonb,
    3,
    1,
    ARRAY['cash', 'bank'],
    true,
    1
),
-- Premium Plan
(
    gen_random_uuid(),
    'premium',
    'Premium Plan',
    'Advanced features for serious financial management',
    999.00,
    9990.00,
    '["Up to 10 bank accounts", "Advanced analytics", "Investment tracking", "Family sharing (up to 4 members)", "Priority support", "Export reports"]'::jsonb,
    10,
    4,
    ARRAY['cash', 'bank', 'investment', 'credit_card'],
    true,
    2
),
-- Professional Plan
(
    gen_random_uuid(),
    'professional',
    'Professional Plan',
    'Complete financial management for professionals and businesses',
    1999.00,
    19990.00,
    '["Unlimited accounts", "Business features", "Tax planning tools", "Custom categories", "API access", "Dedicated support", "Advanced security"]'::jsonb,
    999,
    10,
    ARRAY['cash', 'bank', 'investment', 'credit_card', 'business'],
    true,
    3
),
-- Free Plan (for testing)
(
    gen_random_uuid(),
    'free',
    'Free Plan',
    'Basic features to get started',
    0.00,
    0.00,
    '["1 bank account", "Basic transactions", "Limited reports"]'::jsonb,
    1,
    1,
    ARRAY['cash'],
    true,
    0
) ON CONFLICT (plan_name) DO NOTHING;

-- =====================================================
-- 🎯 PAYMENT METHODS
-- =====================================================

INSERT INTO "public"."payment_methods" (
    "id",
    "method_name",
    "display_name",
    "description",
    "account_info",
    "instructions",
    "logo_url",
    "is_active",
    "sort_order"
) VALUES
-- bKash
(
    gen_random_uuid(),
    'bkash',
    'bKash',
    'Pay with bKash mobile banking',
    '{"account_number": "01711000000", "account_type": "personal", "reference": "FinMate-Subscription"}'::jsonb,
    'Send money to 01711000000 and use your email as reference. Share the transaction ID.',
    '/images/payment/bkash.png',
    true,
    1
),
-- Nagad
(
    gen_random_uuid(),
    'nagad',
    'Nagad',
    'Pay with Nagad mobile banking',
    '{"account_number": "01511000000", "account_type": "personal", "reference": "FinMate-Sub"}'::jsonb,
    'Send money to 01511000000 with reference "FinMate-Sub". Provide transaction ID after payment.',
    '/images/payment/nagad.png',
    true,
    2
),
-- Rocket
(
    gen_random_uuid(),
    'rocket',
    'Rocket',
    'Pay with Dutch-Bangla Rocket',
    '{"account_number": "01811000000", "account_type": "personal"}'::jsonb,
    'Send money to 01811000000. Share the transaction ID and your registered phone number.',
    '/images/payment/rocket.png',
    true,
    3
),
-- Bank Transfer
(
    gen_random_uuid(),
    'bank_transfer',
    'Bank Transfer',
    'Direct bank account transfer',
    '{"bank_name": "Dutch-Bangla Bank", "account_number": "1234567890", "account_name": "FinMate Limited", "routing": "090"}'::jsonb,
    'Transfer to Dutch-Bangla Bank Account: 1234567890 (FinMate Limited). Provide bank reference number.',
    '/images/payment/bank.png',
    true,
    4
),
-- Manual/Admin
(
    gen_random_uuid(),
    'manual',
    'Manual Payment',
    'Manual payment processing by admin',
    '{"type": "manual", "note": "Admin processed payment"}'::jsonb,
    'Payment processed manually by system administrator.',
    '/images/payment/manual.png',
    true,
    99
) ON CONFLICT (method_name) DO NOTHING;

-- =====================================================
-- 🎯 SAMPLE COUPONS
-- =====================================================

INSERT INTO "public"."coupons" (
    "id",
    "code",
    "type",
    "value",
    "description",
    "min_amount",
    "max_uses",
    "max_uses_per_user",
    "valid_from",
    "valid_until",
    "is_active"
) VALUES
-- Welcome discount
(
    gen_random_uuid(),
    'WELCOME25',
    'percentage',
    25.00,
    'Welcome discount for new users - 25% off first subscription',
    100.00,
    1000,
    1,
    NOW(),
    NOW() + INTERVAL '30 days',
    true
),
-- Early bird
(
    gen_random_uuid(),
    'EARLYBIRD50',
    'fixed',
    500.00,
    'Early bird special - 500 BDT off any plan',
    500.00,
    500,
    1,
    NOW(),
    NOW() + INTERVAL '60 days',
    true
),
-- Premium upgrade
(
    gen_random_uuid(),
    'UPGRADE10',
    'percentage',
    10.00,
    'Upgrade discount for existing users',
    1000.00,
    NULL,
    3,
    NOW(),
    NOW() + INTERVAL '90 days',
    true
) ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 📊 CREATE SAMPLE DATA INFO VIEW
-- =====================================================

-- Create a view to see what data was created
CREATE OR REPLACE VIEW subscription_seed_data_summary AS
SELECT
    'Subscription Plans' as table_name,
    COUNT(*)::text as record_count,
    array_agg(plan_name ORDER BY sort_order) as sample_data
FROM subscription_plans
WHERE is_active = true

UNION ALL

SELECT
    'Payment Methods' as table_name,
    COUNT(*)::text as record_count,
    array_agg(method_name ORDER BY sort_order) as sample_data
FROM payment_methods
WHERE is_active = true

UNION ALL

SELECT
    'Active Coupons' as table_name,
    COUNT(*)::text as record_count,
    array_agg(code ORDER BY created_at) as sample_data
FROM coupons
WHERE is_active = true AND valid_until > NOW();

-- =====================================================
-- 📋 VERIFICATION QUERIES
-- =====================================================

-- Check if seed data was created successfully
DO $$
DECLARE
    plan_count INTEGER;
    method_count INTEGER;
    coupon_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO plan_count FROM subscription_plans WHERE is_active = true;
    SELECT COUNT(*) INTO method_count FROM payment_methods WHERE is_active = true;
    SELECT COUNT(*) INTO coupon_count FROM coupons WHERE is_active = true;

    RAISE NOTICE '✅ Seed data created successfully!';
    RAISE NOTICE '📦 Subscription Plans: %', plan_count;
    RAISE NOTICE '💳 Payment Methods: %', method_count;
    RAISE NOTICE '🎫 Active Coupons: %', coupon_count;

    IF plan_count = 0 THEN
        RAISE WARNING '⚠️  No subscription plans were created!';
    END IF;

    IF method_count = 0 THEN
        RAISE WARNING '⚠️  No payment methods were created!';
    END IF;
END $$;

-- Show summary
SELECT * FROM subscription_seed_data_summary;