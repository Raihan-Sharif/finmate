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
--
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
--
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
    LEFT JOIN pg_trigger tr ON tr.tgname = t.trigger_name
    WHERE t.trigger_schema NOT IN ('information_schema', 'pg_catalog', 'auth', 'storage', 'realtime');
END;
$$;


ALTER FUNCTION "public"."get_triggers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_account_summary"("p_user_id" "uuid") RETURNS TABLE("account_count" integer, "total_balance" numeric, "default_account_id" "uuid", "default_currency" character varying, "subscription_plan" "text", "max_accounts" integer, "can_create_more" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
--
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
--
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
--
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
--
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
--
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
--
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
--
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
