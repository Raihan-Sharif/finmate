CREATE TYPE "public"."account_type" AS ENUM (
    'bank',
    'credit_card',
    'wallet',
    'investment',
    'savings',
    'other',
    'cash'
);


--
CREATE TYPE "public"."audit_action" AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'role_change'
);


ALTER TYPE "public"."audit_action" OWNER TO "postgres";
--
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
--
CREATE TYPE "public"."investment_status" AS ENUM (
    'active',
    'matured',
    'sold',
    'paused',
    'closed'
);


ALTER TYPE "public"."investment_status" OWNER TO "postgres";

--
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
--
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

--
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
--
CREATE TYPE "public"."payment_status_type" AS ENUM (
    'pending',
    'submitted',
    'verified',
    'approved',
    'rejected',
    'expired'
);


ALTER TYPE "public"."payment_status_type" OWNER TO "postgres";
--
CREATE TYPE "public"."permission_action" AS ENUM (
    'create',
    'read',
    'update',
    'delete',
    'manage'
);


ALTER TYPE "public"."permission_action" OWNER TO "postgres";

--
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
--
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


--
CREATE TYPE "public"."user_role" AS ENUM (
    'super_admin',
    'admin',
    'paid_user',
    'user'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


