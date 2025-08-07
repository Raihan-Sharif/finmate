-- =============================================
-- RECURRING TRANSACTIONS UPDATE
-- Add proper foreign key relationship and automation
-- Run this on existing databases to add recurring functionality
-- =============================================

-- Step 1: Add the new foreign key column (nullable for existing data)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS recurring_template_id UUID 
REFERENCES recurring_transactions(id) ON DELETE SET NULL;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_template_id 
ON transactions(recurring_template_id);

-- Step 3: Update existing transactions to link to their recurring templates
UPDATE transactions 
SET recurring_template_id = CAST(recurring_pattern->>'recurring_id' AS UUID)
WHERE recurring_template_id IS NULL  -- Only update if not already set
AND recurring_pattern IS NOT NULL 
AND recurring_pattern ? 'recurring_id'
AND CAST(recurring_pattern->>'recurring_id' AS UUID) IN (
    SELECT id FROM recurring_transactions
);

-- Step 4: Create function to automatically execute recurring transactions
CREATE OR REPLACE FUNCTION execute_pending_recurring_transactions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Step 5: Create helper function to calculate next execution date
CREATE OR REPLACE FUNCTION calculate_next_execution_date(
    base_date DATE,
    frequency VARCHAR(20),
    interval_value INTEGER DEFAULT 1
) RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
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

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION execute_pending_recurring_transactions() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_execution_date(DATE, VARCHAR, INTEGER) TO authenticated;

-- =============================================
-- CRON JOB SETUP (Optional - requires pg_cron)
-- =============================================
-- Enable pg_cron extension in Supabase Dashboard > Database > Extensions
-- Then uncomment and run the following:

-- SELECT cron.schedule(
--     'execute-recurring-transactions', 
--     '0 2 * * *', 
--     'SELECT execute_pending_recurring_transactions();'
-- );

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 
    'Recurring transactions update completed successfully!' as message,
    COUNT(*) as total_recurring_transactions
FROM recurring_transactions;

-- Test the function (optional)
-- SELECT execute_pending_recurring_transactions() as transactions_executed;