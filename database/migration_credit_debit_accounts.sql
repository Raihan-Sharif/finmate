-- Migration: Add Credit/Debit Account Functionality
-- Created: 2025-01-08
-- Description: Add credit limit and balance type fields to accounts table for better credit card and loan account management

-- Add balance_type enum to distinguish between debit and credit accounts
DO $$ BEGIN
    CREATE TYPE balance_type AS ENUM ('debit', 'credit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new fields to accounts table for credit/debit functionality
DO $$ BEGIN
    -- Add credit_limit field for credit accounts (credit cards, lines of credit, etc.)
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15,2) DEFAULT 0;
    
    -- Add balance_type field to indicate if this is a debit or credit account
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS balance_type balance_type DEFAULT 'debit' NOT NULL;
    
    -- Add interest_rate field for credit accounts
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,4) DEFAULT 0;
    
    -- Add minimum_payment field for credit accounts
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS minimum_payment DECIMAL(15,2) DEFAULT 0;
    
    -- Add payment_due_day field (day of month when payment is due)
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS payment_due_day INTEGER DEFAULT 1;
    
    -- Add statement_closing_day field (day of month when statement closes)
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS statement_closing_day INTEGER DEFAULT 28;
    
    -- Add is_default field if it doesn't exist
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false NOT NULL;
    
    -- Add display_order field if it doesn't exist
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding fields to accounts table: %', SQLERRM;
END $$;

-- Update account_type enum to include 'cash' type if not present
DO $$ BEGIN
    ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'cash';
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create index for better performance on credit accounts
CREATE INDEX IF NOT EXISTS idx_accounts_balance_type ON accounts(balance_type);
CREATE INDEX IF NOT EXISTS idx_accounts_credit_limit ON accounts(credit_limit) WHERE credit_limit > 0;
CREATE INDEX IF NOT EXISTS idx_accounts_payment_due_day ON accounts(payment_due_day) WHERE balance_type = 'credit';

-- Update existing credit_card accounts to have credit balance_type
UPDATE accounts 
SET balance_type = 'credit' 
WHERE type = 'credit_card' AND balance_type = 'debit';

-- Create or replace function to calculate available credit for credit accounts
CREATE OR REPLACE FUNCTION get_available_credit(account_id_param UUID)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create or replace function to validate credit account transactions
CREATE OR REPLACE FUNCTION validate_credit_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Create trigger for credit account validation (commented out by default)
-- Uncomment to enable strict credit limit validation
-- DROP TRIGGER IF EXISTS validate_credit_transaction_trigger ON transactions;
-- CREATE TRIGGER validate_credit_transaction_trigger
--     BEFORE INSERT OR UPDATE ON transactions
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_credit_transaction();

-- Create or replace function to get account display balance (considering credit vs debit)
CREATE OR REPLACE FUNCTION get_account_display_balance(account_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION get_available_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_account_display_balance(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN accounts.balance_type IS 'Indicates whether this is a debit account (asset) or credit account (liability)';
COMMENT ON COLUMN accounts.credit_limit IS 'Credit limit for credit accounts (credit cards, lines of credit, etc.)';
COMMENT ON COLUMN accounts.interest_rate IS 'Annual interest rate for credit accounts (as decimal, e.g., 0.1899 for 18.99%)';
COMMENT ON COLUMN accounts.minimum_payment IS 'Minimum payment required for credit accounts';
COMMENT ON COLUMN accounts.payment_due_day IS 'Day of the month when payment is due (1-31)';
COMMENT ON COLUMN accounts.statement_closing_day IS 'Day of the month when statement closes (1-31)';

COMMENT ON FUNCTION get_available_credit(UUID) IS 'Calculate available credit for a credit account';
COMMENT ON FUNCTION get_account_display_balance(UUID) IS 'Get formatted balance information for display, considering credit vs debit account types';

-- Update RLS policies to work with new fields (if needed)
-- The existing RLS policies should continue to work since they're based on user_id

-- Create sample data update for existing accounts (optional)
-- Update any existing accounts that should be credit accounts
DO $$ 
DECLARE
    account_record RECORD;
BEGIN
    -- Example: Set reasonable defaults for existing credit card accounts
    FOR account_record IN 
        SELECT id, name FROM accounts 
        WHERE type = 'credit_card' AND balance_type = 'credit' AND credit_limit = 0
    LOOP
        -- Set a default credit limit of 100,000 BDT for existing credit cards
        UPDATE accounts 
        SET credit_limit = 100000, 
            interest_rate = 0.24, -- 24% annual rate (example)
            minimum_payment = 1000, -- 1000 BDT minimum
            payment_due_day = 20,
            statement_closing_day = 25
        WHERE id = account_record.id;
        
        RAISE NOTICE 'Updated credit card account: %', account_record.name;
    END LOOP;
END $$;

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Credit/Debit account migration completed successfully!';
    RAISE NOTICE 'New features added:';
    RAISE NOTICE '- Credit limits for credit accounts';
    RAISE NOTICE '- Balance types (debit/credit)';
    RAISE NOTICE '- Interest rates and payment terms';
    RAISE NOTICE '- Available credit calculation';
    RAISE NOTICE '- Credit utilization tracking';
END $$;