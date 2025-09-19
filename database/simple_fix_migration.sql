-- Simple fix for subscription management issues
-- This addresses the foreign key relationship problems by using a simple approach

-- Since the foreign keys go to auth.users, we need to make the API work with the current schema
-- The API has been updated to fetch user data separately, so no database changes are needed

-- However, let's create a simple view to help with future queries
CREATE OR REPLACE VIEW subscription_payments_with_users AS
SELECT
    sp.*,
    p.full_name as user_full_name,
    p.email as user_email,
    p.phone_number as user_phone,
    spl.plan_name,
    spl.display_name as plan_display_name,
    spl.price_monthly as plan_price_monthly,
    spl.price_yearly as plan_price_yearly,
    pm.method_name as payment_method_name,
    pm.display_name as payment_method_display_name,
    c.code as coupon_code,
    c.type as coupon_type,
    c.value as coupon_value
FROM subscription_payments sp
LEFT JOIN profiles p ON sp.user_id = p.user_id
LEFT JOIN subscription_plans spl ON sp.plan_id = spl.id
LEFT JOIN payment_methods pm ON sp.payment_method_id = pm.id
LEFT JOIN coupons c ON sp.coupon_id = c.id;

-- Create a view for user subscriptions with users
CREATE OR REPLACE VIEW user_subscriptions_with_details AS
SELECT
    us.*,
    p.full_name as user_full_name,
    p.email as user_email,
    p.phone_number as user_phone,
    spl.plan_name,
    spl.display_name as plan_display_name,
    spl.price_monthly as plan_price_monthly,
    spl.price_yearly as plan_price_yearly,
    spl.features as plan_features,
    sp.transaction_id as payment_transaction_id,
    sp.final_amount as payment_amount,
    sp.status as payment_status
FROM user_subscriptions us
LEFT JOIN profiles p ON us.user_id = p.user_id
LEFT JOIN subscription_plans spl ON us.plan_id = spl.id
LEFT JOIN subscription_payments sp ON us.payment_id = sp.id;

-- Grant permissions
GRANT SELECT ON subscription_payments_with_users TO authenticated;
GRANT SELECT ON subscription_payments_with_users TO service_role;
GRANT SELECT ON user_subscriptions_with_details TO authenticated;
GRANT SELECT ON user_subscriptions_with_details TO service_role;

-- Comment
COMMENT ON VIEW subscription_payments_with_users IS 'View combining subscription payments with user and related data for easier querying';
COMMENT ON VIEW user_subscriptions_with_details IS 'View combining user subscriptions with user, plan, and payment data for easier querying';