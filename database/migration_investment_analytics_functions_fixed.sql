-- =============================================
-- INVESTMENT ANALYTICS DATABASE FUNCTIONS - CORRECTED VERSION
-- =============================================
-- Migration file for investment analytics and chart data functions
-- Fixed to use correct column names from actual database schema
-- All functions use SECURITY DEFINER to bypass RLS policies safely

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_portfolio_performance_data(UUID, VARCHAR);
DROP FUNCTION IF EXISTS get_asset_allocation_data(UUID, VARCHAR);
DROP FUNCTION IF EXISTS get_monthly_trend_data(UUID, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS get_investment_analytics_summary(UUID);

-- =============================================
-- PORTFOLIO PERFORMANCE DATA FUNCTION
-- =============================================
-- Returns time series data for portfolio performance charts
CREATE OR REPLACE FUNCTION get_portfolio_performance_data(
    p_user_id UUID,
    p_period VARCHAR DEFAULT '6m'
)
RETURNS TABLE (
    date TEXT,
    total_invested DECIMAL,
    current_value DECIMAL,
    gain_loss DECIMAL,
    return_percentage DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    days_back INTEGER;
    date_format TEXT;
BEGIN
    -- Determine period parameters
    CASE p_period
        WHEN '1m' THEN 
            days_back := 30;
            date_format := 'YYYY-MM-DD';
        WHEN '3m' THEN 
            days_back := 90;
            date_format := 'YYYY-MM-DD';
        WHEN '6m' THEN 
            days_back := 180;
            date_format := 'YYYY-MM';
        WHEN '1y' THEN 
            days_back := 365;
            date_format := 'YYYY-MM';
        ELSE 
            days_back := 1095; -- 3 years for 'all'
            date_format := 'YYYY-MM';
    END CASE;

    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '1 day' * days_back,
            CURRENT_DATE,
            INTERVAL '1 month'
        )::DATE as period_date
    ),
    portfolio_snapshots AS (
        SELECT 
            DATE_TRUNC('month', t.transaction_date)::DATE as snapshot_date,
            SUM(CASE 
                WHEN t.type = 'buy' THEN t.total_amount 
                ELSE 0 
            END) as invested_amount,
            SUM(CASE 
                WHEN t.type = 'buy' THEN t.total_amount * (i.current_price / t.price_per_unit)
                ELSE 0 
            END) as current_portfolio_value
        FROM investment_transactions t
        INNER JOIN investments i ON t.investment_id = i.id
        WHERE t.user_id = p_user_id
        AND t.transaction_date >= CURRENT_DATE - INTERVAL '1 day' * days_back
        GROUP BY DATE_TRUNC('month', t.transaction_date)::DATE
    ),
    cumulative_data AS (
        SELECT 
            ds.period_date,
            COALESCE(
                SUM(ps.invested_amount) OVER (
                    ORDER BY ds.period_date 
                    ROWS UNBOUNDED PRECEDING
                ), 0
            ) as cumulative_invested,
            COALESCE(
                SUM(ps.current_portfolio_value) OVER (
                    ORDER BY ds.period_date 
                    ROWS UNBOUNDED PRECEDING
                ), 0
            ) as cumulative_value
        FROM date_series ds
        LEFT JOIN portfolio_snapshots ps ON ds.period_date = ps.snapshot_date
    )
    SELECT 
        TO_CHAR(cd.period_date, date_format) as date,
        cd.cumulative_invested::DECIMAL as total_invested,
        cd.cumulative_value::DECIMAL as current_value,
        (cd.cumulative_value - cd.cumulative_invested)::DECIMAL as gain_loss,
        CASE 
            WHEN cd.cumulative_invested > 0 
            THEN ((cd.cumulative_value - cd.cumulative_invested) / cd.cumulative_invested * 100)::DECIMAL
            ELSE 0::DECIMAL
        END as return_percentage
    FROM cumulative_data cd
    WHERE cd.cumulative_invested > 0
    ORDER BY cd.period_date;
END;
$$;

-- =============================================
-- ASSET ALLOCATION DATA FUNCTION  
-- =============================================
-- Returns asset allocation breakdown for pie charts
CREATE OR REPLACE FUNCTION get_asset_allocation_data(
    p_user_id UUID,
    p_currency VARCHAR DEFAULT 'BDT'
)
RETURNS TABLE (
    name TEXT,
    investment_type TEXT,
    value DECIMAL,
    percentage DECIMAL,
    color TEXT,
    investment_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH portfolio_totals AS (
        SELECT SUM(i.current_value) as total_portfolio_value
        FROM investments i
        WHERE i.user_id = p_user_id
        AND i.status = 'active'
    ),
    type_colors AS (
        SELECT 
            'stock'::TEXT as inv_type, '#3B82F6'::TEXT as type_color
        UNION ALL SELECT 'mutual_fund', '#10B981'
        UNION ALL SELECT 'crypto', '#F59E0B'
        UNION ALL SELECT 'bond', '#8B5CF6'
        UNION ALL SELECT 'fd', '#06B6D4'
        UNION ALL SELECT 'sip', '#84CC16'
        UNION ALL SELECT 'dps', '#F97316'
        UNION ALL SELECT 'gold', '#EAB308'
        UNION ALL SELECT 'real_estate', '#EF4444'
        UNION ALL SELECT 'other', '#6B7280'
    )
    SELECT 
        CASE i.type::TEXT
            WHEN 'stock' THEN 'Stocks'
            WHEN 'mutual_fund' THEN 'Mutual Funds'
            WHEN 'crypto' THEN 'Cryptocurrency'
            WHEN 'bond' THEN 'Bonds'
            WHEN 'fd' THEN 'Fixed Deposits'
            WHEN 'sip' THEN 'SIP Investments'
            WHEN 'dps' THEN 'DPS'
            WHEN 'gold' THEN 'Gold'
            WHEN 'real_estate' THEN 'Real Estate'
            ELSE 'Others'
        END as name,
        i.type::TEXT as investment_type,
        SUM(i.current_value)::DECIMAL as value,
        CASE 
            WHEN pt.total_portfolio_value > 0 
            THEN (SUM(i.current_value) / pt.total_portfolio_value * 100)::DECIMAL
            ELSE 0::DECIMAL
        END as percentage,
        COALESCE(tc.type_color, '#6B7280')::TEXT as color,
        COUNT(*)::INTEGER as investment_count
    FROM investments i
    CROSS JOIN portfolio_totals pt
    LEFT JOIN type_colors tc ON i.type::TEXT = tc.inv_type
    WHERE i.user_id = p_user_id
    AND i.status = 'active'
    AND i.current_value > 0
    GROUP BY i.type, pt.total_portfolio_value, tc.type_color
    ORDER BY SUM(i.current_value) DESC;
END;
$$;

-- =============================================
-- MONTHLY TREND DATA FUNCTION
-- =============================================  
-- Returns monthly investment trend data for bar/line charts
CREATE OR REPLACE FUNCTION get_monthly_trend_data(
    p_user_id UUID,
    p_currency VARCHAR DEFAULT 'BDT',
    p_months_back INTEGER DEFAULT 12
)
RETURNS TABLE (
    month TEXT,
    month_name TEXT,
    invested DECIMAL,
    current_value DECIMAL,
    gain_loss DECIMAL,
    return_percentage DECIMAL,
    transaction_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            DATE_TRUNC('month', t.transaction_date) as month_date,
            SUM(CASE 
                WHEN t.type = 'buy' THEN t.total_amount 
                ELSE 0 
            END) as monthly_invested,
            COUNT(*) as monthly_transactions
        FROM investment_transactions t
        WHERE t.user_id = p_user_id
        AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * p_months_back)
        GROUP BY DATE_TRUNC('month', t.transaction_date)
    ),
    current_values AS (
        SELECT 
            md.month_date,
            md.monthly_invested,
            md.monthly_transactions,
            COALESCE(
                SUM(
                    CASE 
                        WHEN i.current_value > 0 
                        THEN (t.total_amount / t.price_per_unit * i.current_price)
                        ELSE t.total_amount 
                    END
                ), 0
            ) as estimated_current_value
        FROM monthly_data md
        LEFT JOIN investment_transactions t ON DATE_TRUNC('month', t.transaction_date) = md.month_date
        LEFT JOIN investments i ON t.investment_id = i.id
        WHERE t.user_id = p_user_id AND t.type = 'buy'
        GROUP BY md.month_date, md.monthly_invested, md.monthly_transactions
    )
    SELECT 
        TO_CHAR(cv.month_date, 'YYYY-MM')::TEXT as month,
        TO_CHAR(cv.month_date, 'Mon')::TEXT as month_name,
        COALESCE(cv.monthly_invested, 0)::DECIMAL as invested,
        COALESCE(cv.estimated_current_value, 0)::DECIMAL as current_value,
        COALESCE(cv.estimated_current_value - cv.monthly_invested, 0)::DECIMAL as gain_loss,
        CASE 
            WHEN cv.monthly_invested > 0 
            THEN ((cv.estimated_current_value - cv.monthly_invested) / cv.monthly_invested * 100)::DECIMAL
            ELSE 0::DECIMAL
        END as return_percentage,
        COALESCE(cv.monthly_transactions, 0)::INTEGER as transaction_count
    FROM current_values cv
    ORDER BY cv.month_date;
END;
$$;

-- =============================================
-- INVESTMENT ANALYTICS SUMMARY FUNCTION
-- =============================================
-- Returns comprehensive analytics summary for dashboard
CREATE OR REPLACE FUNCTION get_investment_analytics_summary(
    p_user_id UUID
)
RETURNS TABLE (
    total_portfolios INTEGER,
    total_investments INTEGER,
    total_invested DECIMAL,
    current_value DECIMAL,
    total_gain_loss DECIMAL,
    total_return_percentage DECIMAL,
    best_performing_investment JSONB,
    worst_performing_investment JSONB,
    active_sips INTEGER,
    monthly_sip_amount DECIMAL,
    recent_transactions JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    portfolio_count INTEGER;
    investment_count INTEGER;
    invested_total DECIMAL;
    current_total DECIMAL;
    gain_loss_total DECIMAL;
    return_pct DECIMAL;
    best_investment JSONB;
    worst_investment JSONB;
    sip_count INTEGER;
    sip_monthly DECIMAL;
    recent_trans JSONB;
BEGIN
    -- Get basic portfolio and investment counts
    SELECT COUNT(*) INTO portfolio_count
    FROM investment_portfolios 
    WHERE user_id = p_user_id AND is_active = true;
    
    SELECT COUNT(*) INTO investment_count
    FROM investments 
    WHERE user_id = p_user_id AND status = 'active';
    
    -- Get financial totals
    SELECT 
        COALESCE(SUM(total_invested), 0),
        COALESCE(SUM(current_value), 0)
    INTO invested_total, current_total
    FROM investments 
    WHERE user_id = p_user_id AND status = 'active';
    
    gain_loss_total := current_total - invested_total;
    return_pct := CASE 
        WHEN invested_total > 0 
        THEN (gain_loss_total / invested_total * 100)
        ELSE 0 
    END;
    
    -- Get best performing investment
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'type', type,
        'gain_loss_percentage', gain_loss_percentage,
        'current_value', current_value
    ) INTO best_investment
    FROM investments 
    WHERE user_id = p_user_id 
    AND status = 'active'
    AND gain_loss_percentage IS NOT NULL
    ORDER BY gain_loss_percentage DESC
    LIMIT 1;
    
    -- Get worst performing investment
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'type', type,
        'gain_loss_percentage', gain_loss_percentage,
        'current_value', current_value
    ) INTO worst_investment
    FROM investments 
    WHERE user_id = p_user_id 
    AND status = 'active'
    AND gain_loss_percentage IS NOT NULL
    ORDER BY gain_loss_percentage ASC
    LIMIT 1;
    
    -- Get SIP data
    SELECT COUNT(*) INTO sip_count
    FROM investment_templates 
    WHERE user_id = p_user_id AND is_active = true;
    
    SELECT COALESCE(SUM(
        CASE frequency
            WHEN 'daily' THEN amount_per_investment * 30
            WHEN 'weekly' THEN amount_per_investment * 4.33
            WHEN 'biweekly' THEN amount_per_investment * 2.17
            WHEN 'monthly' THEN amount_per_investment
            WHEN 'quarterly' THEN amount_per_investment / 3
            WHEN 'yearly' THEN amount_per_investment / 12
            ELSE 0
        END
    ), 0) INTO sip_monthly
    FROM investment_templates 
    WHERE user_id = p_user_id AND is_active = true;
    
    -- Get recent transactions
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'investment_name', COALESCE(i.name, 'Unknown'),
            'transaction_type', t.type,
            'amount', t.total_amount,
            'transaction_date', t.transaction_date,
            'currency', t.currency
        )
        ORDER BY t.transaction_date DESC
    ) INTO recent_trans
    FROM investment_transactions t
    LEFT JOIN investments i ON t.investment_id = i.id
    WHERE t.user_id = p_user_id
    LIMIT 10;
    
    RETURN QUERY SELECT 
        portfolio_count,
        investment_count,
        invested_total,
        current_total,
        gain_loss_total,
        return_pct,
        best_investment,
        worst_investment,
        sip_count,
        sip_monthly,
        recent_trans;
END;
$$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_portfolio_performance_data(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_asset_allocation_data(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_trend_data(UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_investment_analytics_summary(UUID) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investment_transactions_user_date 
ON investment_transactions(user_id, transaction_date);

CREATE INDEX IF NOT EXISTS idx_investment_transactions_type_date 
ON investment_transactions(type, transaction_date);

CREATE INDEX IF NOT EXISTS idx_investments_user_status_type 
ON investments(user_id, status, type);

COMMENT ON FUNCTION get_portfolio_performance_data IS 'Returns time series data for portfolio performance charts with configurable periods';
COMMENT ON FUNCTION get_asset_allocation_data IS 'Returns asset allocation breakdown for pie charts with investment type distribution';
COMMENT ON FUNCTION get_monthly_trend_data IS 'Returns monthly investment trend data for bar/line charts showing growth over time';
COMMENT ON FUNCTION get_investment_analytics_summary IS 'Returns comprehensive analytics summary for investment dashboard with key metrics';