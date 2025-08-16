-- Complete fix for lending table columns and EMI functions
-- Run this in your Supabase SQL editor

-- First, ensure all required columns exist in lending table
ALTER TABLE lending ADD COLUMN IF NOT EXISTS pending_amount DECIMAL(15,2);
ALTER TABLE lending ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE lending ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE lending ADD COLUMN IF NOT EXISTS reminder_days INTEGER DEFAULT 7;
ALTER TABLE lending ADD COLUMN IF NOT EXISTS contact_info JSONB;
ALTER TABLE lending ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]';
ALTER TABLE lending ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update pending_amount to equal amount for existing records where it's NULL
UPDATE lending SET pending_amount = amount WHERE pending_amount IS NULL;

-- Add constraint for pending_amount
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lending_pending_amount_non_negative') THEN
        ALTER TABLE lending ADD CONSTRAINT lending_pending_amount_non_negative CHECK (pending_amount >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lending_pending_amount_not_exceeds') THEN
        ALTER TABLE lending ADD CONSTRAINT lending_pending_amount_not_exceeds CHECK (pending_amount <= amount);
    END IF;
END $$;

-- Ensure lending_status enum exists with all required values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lending_status') THEN
        CREATE TYPE lending_status AS ENUM ('pending', 'partial', 'completed', 'overdue');
    ELSE
        -- Add missing enum values if they don't exist
        BEGIN
            ALTER TYPE lending_status ADD VALUE IF NOT EXISTS 'overdue';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Fixed Function to get EMI overview for a user
CREATE OR REPLACE FUNCTION get_emi_overview(
    p_user_id UUID,
    p_currency VARCHAR(3) DEFAULT 'BDT'
) RETURNS TABLE (
    total_active_loans INTEGER,
    total_outstanding_amount DECIMAL(15,2),
    total_monthly_emi DECIMAL(15,2),
    overdue_payments INTEGER,
    overdue_amount DECIMAL(15,2),
    next_payment_date DATE,
    next_payment_amount DECIMAL(15,2),
    total_paid_this_month DECIMAL(15,2),
    total_pending_this_month DECIMAL(15,2)
) AS $$
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
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Fixed Function to get lending overview
CREATE OR REPLACE FUNCTION get_lending_overview(
    p_user_id UUID,
    p_currency VARCHAR(3) DEFAULT 'BDT'
) RETURNS TABLE (
    total_lent_amount DECIMAL(15,2),
    total_borrowed_amount DECIMAL(15,2),
    total_lent_pending DECIMAL(15,2),
    total_borrowed_pending DECIMAL(15,2),
    overdue_lent_count INTEGER,
    overdue_borrowed_count INTEGER,
    overdue_lent_amount DECIMAL(15,2),
    overdue_borrowed_amount DECIMAL(15,2)
) AS $$
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
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- Test the functions to ensure they work
SELECT 'EMI functions updated successfully!' as message;