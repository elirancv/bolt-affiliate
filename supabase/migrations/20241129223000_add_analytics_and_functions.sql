-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_user_feature_limits_v2();
DROP FUNCTION IF EXISTS public.get_top_products_with_clicks(INTEGER);

-- Create function to get top products by clicks
CREATE OR REPLACE FUNCTION public.get_top_products_with_clicks(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    total_clicks BIGINT,
    total_views BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS product_id,
        p.name AS product_name,
        COALESCE(SUM(a.clicks), 0)::BIGINT AS total_clicks,
        COALESCE(SUM(a.views), 0)::BIGINT AS total_views
    FROM public.products p
    LEFT JOIN public.analytics a ON p.id = a.product_id
    WHERE p.store_id IN (
        SELECT id FROM public.stores 
        WHERE user_id = auth.uid()
    )
    GROUP BY p.id, p.name
    ORDER BY total_clicks DESC, total_views DESC
    LIMIT p_limit;
END;
$$;

-- Create function to get analytics summary
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    date DATE,
    total_views BIGINT,
    total_clicks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH dates AS (
        SELECT generate_series(p_start_date::date, p_end_date::date, '1 day'::interval)::date AS date
    )
    SELECT 
        d.date,
        COALESCE(SUM(a.views), 0)::BIGINT AS total_views,
        COALESCE(SUM(a.clicks), 0)::BIGINT AS total_clicks
    FROM dates d
    LEFT JOIN public.analytics a ON d.date = a.date
    WHERE a.store_id IN (
        SELECT id FROM public.stores 
        WHERE user_id = auth.uid()
    )
    OR a.store_id IS NULL
    GROUP BY d.date
    ORDER BY d.date;
END;
$$;

-- Create the get_user_feature_limits_v2 function
CREATE OR REPLACE FUNCTION public.get_user_feature_limits_v2()
RETURNS TABLE (
    max_stores INTEGER,
    max_products_per_store INTEGER,
    total_products_limit INTEGER,
    analytics_retention_days INTEGER,
    can_export_data BOOLEAN,
    subscription_tier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_subscription_tier TEXT;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Get user's subscription tier
    SELECT subscription_tier INTO v_subscription_tier
    FROM users
    WHERE id = v_user_id;
    
    -- Return limits based on subscription tier
    CASE v_subscription_tier
        WHEN 'free' THEN
            RETURN QUERY SELECT 
                1::INTEGER as max_stores,
                10::INTEGER as max_products_per_store,
                10::INTEGER as total_products_limit,
                7::INTEGER as analytics_retention_days,
                FALSE as can_export_data,
                'free'::TEXT as subscription_tier;
        WHEN 'pro' THEN
            RETURN QUERY SELECT 
                5::INTEGER as max_stores,
                50::INTEGER as max_products_per_store,
                250::INTEGER as total_products_limit,
                30::INTEGER as analytics_retention_days,
                TRUE as can_export_data,
                'pro'::TEXT as subscription_tier;
        WHEN 'business' THEN
            RETURN QUERY SELECT 
                20::INTEGER as max_stores,
                200::INTEGER as max_products_per_store,
                4000::INTEGER as total_products_limit,
                90::INTEGER as analytics_retention_days,
                TRUE as can_export_data,
                'business'::TEXT as subscription_tier;
        ELSE
            -- Default to free tier limits
            RETURN QUERY SELECT 
                1::INTEGER as max_stores,
                10::INTEGER as max_products_per_store,
                10::INTEGER as total_products_limit,
                7::INTEGER as analytics_retention_days,
                FALSE as can_export_data,
                'free'::TEXT as subscription_tier;
    END CASE;
END;
$$;
