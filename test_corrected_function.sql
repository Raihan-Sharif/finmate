-- ================================================
-- TEST CORRECTED ADMIN FUNCTION
-- ================================================
-- This script tests the corrected function and validates all types

-- 1. First, let's create some sample data if tables are empty
-- Insert sample subscription plans
INSERT INTO subscription_plans (
  plan_name, display_name, description,
  price_monthly, price_yearly, features,
  max_accounts, max_family_members, is_active, sort_order
) VALUES
(
  'basic', 'Basic Plan', 'Basic features for personal use',
  199, 1999, '[\"Up to 3 accounts\", \"Basic reports\", \"Mobile app\"]'::jsonb,
  3, 1, true, 1
),
(
  'premium', 'Premium Plan', 'Advanced features for power users',
  399, 3999, '[\"Unlimited accounts\", \"Advanced analytics\", \"Priority support\"]'::jsonb,
  10, 5, true, 2
)
ON CONFLICT (plan_name) DO NOTHING;

-- Insert sample payment methods
INSERT INTO payment_methods (
  method_name, display_name, description,
  account_info, instructions, is_active, sort_order
) VALUES
(
  'bkash', 'bKash', 'Mobile banking payment via bKash',
  '{"number": "01XXXXXXXXX", "type": "personal"}'::jsonb,
  'Send money to the provided bKash number and enter transaction ID',
  true, 1
),
(
  'nagad', 'Nagad', 'Mobile banking payment via Nagad',
  '{"number": "01XXXXXXXXX", "type": "personal"}'::jsonb,
  'Send money to the provided Nagad number and enter transaction ID',
  true, 2
),
(
  'manual', 'Manual Payment', 'Manual payment processing by admin',
  '{"type": "manual"}'::jsonb,
  'Admin will process this payment manually',
  true, 99
)
ON CONFLICT (method_name) DO NOTHING;

-- 2. Test the corrected function with your user ID
-- Replace 'YOUR_USER_ID' with your actual admin user ID
-- Get your user ID from: SELECT auth.uid();

-- Test basic function call
SELECT 'TESTING CORRECTED FUNCTION' as test_stage;

SELECT * FROM admin_get_subscription_payments(
  p_admin_user_id := auth.uid(),
  p_status := null,
  p_search := null,
  p_limit := 10,
  p_offset := 0
);

-- 3. Test specific filters
SELECT 'TESTING WITH STATUS FILTER' as test_stage;

SELECT * FROM admin_get_subscription_payments(
  p_admin_user_id := auth.uid(),
  p_status := 'submitted',
  p_search := null,
  p_limit := 10,
  p_offset := 0
);

-- 4. Test search functionality
SELECT 'TESTING WITH SEARCH FILTER' as test_stage;

SELECT * FROM admin_get_subscription_payments(
  p_admin_user_id := auth.uid(),
  p_status := null,
  p_search := 'DEMO',
  p_limit := 10,
  p_offset := 0
);

-- 5. Validate data types returned by the function
SELECT 'VALIDATING FUNCTION RETURN TYPES' as test_stage;

SELECT
  pg_typeof(id) as id_type,
  pg_typeof(transaction_id) as transaction_id_type,
  pg_typeof(sender_number) as sender_number_type,
  pg_typeof(currency) as currency_type,
  pg_typeof(plan_name) as plan_name_type,
  pg_typeof(plan_display_name) as plan_display_name_type,
  pg_typeof(payment_method_name) as payment_method_name_type,
  pg_typeof(payment_method_display_name) as payment_method_display_name_type
FROM admin_get_subscription_payments(
  p_admin_user_id := auth.uid(),
  p_status := null,
  p_search := null,
  p_limit := 1,
  p_offset := 0
)
LIMIT 1;

-- 6. Check if we have any sample data
SELECT 'CHECKING TABLE CONTENTS' as test_stage;

SELECT 'subscription_payments' as table_name, COUNT(*) as count FROM subscription_payments
UNION ALL
SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'roles', COUNT(*) FROM roles;

-- 7. Check user permissions
SELECT 'CHECKING USER PERMISSIONS' as test_stage;

SELECT
  p.user_id,
  p.full_name,
  p.role_id,
  r.name as role_name,
  r.display_name as role_display_name
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.user_id = auth.uid();

-- 8. Create a sample payment for testing (if none exists)
INSERT INTO subscription_payments (
  user_id, plan_id, payment_method_id,
  billing_cycle, transaction_id, sender_number,
  base_amount, discount_amount, final_amount,
  status, submitted_at, currency
)
SELECT
  auth.uid(),
  (SELECT id FROM subscription_plans WHERE plan_name = 'basic' LIMIT 1),
  (SELECT id FROM payment_methods WHERE method_name = 'bkash' LIMIT 1),
  'monthly'::billing_cycle_type,
  'TEST_' || extract(epoch from now()),
  '01712345678',
  199, 0, 199,
  'submitted'::payment_status_type,
  now(),
  'BDT'
WHERE EXISTS(SELECT 1 FROM subscription_plans WHERE plan_name = 'basic')
  AND EXISTS(SELECT 1 FROM payment_methods WHERE method_name = 'bkash')
  AND NOT EXISTS(
    SELECT 1 FROM subscription_payments
    WHERE user_id = auth.uid()
    AND transaction_id LIKE 'TEST_%'
  );

-- 9. Final test with sample data
SELECT 'FINAL TEST WITH SAMPLE DATA' as test_stage;

SELECT * FROM admin_get_subscription_payments(
  p_admin_user_id := auth.uid(),
  p_status := null,
  p_search := null,
  p_limit := 10,
  p_offset := 0
);