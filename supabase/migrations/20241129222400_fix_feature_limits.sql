-- Fix the feature_limits type and function
DROP TYPE IF EXISTS public.feature_limits CASCADE;

CREATE TYPE public.feature_limits AS (
    max_stores INTEGER,
    max_products_per_store INTEGER,
    max_file_size_mb INTEGER
);

-- Fix the get_user_feature_limits_v2 function
CREATE OR REPLACE FUNCTION public.get_user_feature_limits_v2()
RETURNS public.feature_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription_tier TEXT;
    v_limits public.feature_limits;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO v_subscription_tier
    FROM users
    WHERE id = auth.uid();
    
    -- Set limits based on subscription tier
    CASE v_subscription_tier
        WHEN 'free' THEN
            v_limits := ROW(1, 10, 5)::public.feature_limits;
        WHEN 'pro' THEN
            v_limits := ROW(5, 50, 20)::public.feature_limits;
        WHEN 'business' THEN
            v_limits := ROW(20, 200, 50)::public.feature_limits;
        ELSE
            v_limits := ROW(1, 10, 5)::public.feature_limits;
    END CASE;
    
    RETURN v_limits;
END;
$$;

-- Fix the get_user_dashboard_summary_by_id function
CREATE OR REPLACE FUNCTION public.get_user_dashboard_summary_by_id(p_user_id UUID)
RETURNS TABLE (
    total_stores INTEGER,
    active_stores INTEGER,
    total_products INTEGER,
    active_products INTEGER,
    total_views INTEGER,
    total_clicks INTEGER,
    overall_conversion_rate DECIMAL,
    subscription_tier TEXT,
    stores_limit INTEGER,
    products_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription_tier TEXT;
    v_max_stores INTEGER;
    v_max_products_per_store INTEGER;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO v_subscription_tier
    FROM users
    WHERE id = p_user_id;
    
    -- Set limits based on subscription tier
    CASE v_subscription_tier
        WHEN 'free' THEN
            v_max_stores := 1;
            v_max_products_per_store := 10;
        WHEN 'pro' THEN
            v_max_stores := 5;
            v_max_products_per_store := 50;
        WHEN 'business' THEN
            v_max_stores := 20;
            v_max_products_per_store := 200;
        ELSE
            v_max_stores := 1;
            v_max_products_per_store := 10;
    END CASE;

    RETURN QUERY
    WITH metrics AS (
        SELECT 
            COUNT(DISTINCT s.id)::INTEGER as total_stores,
            COUNT(DISTINCT CASE WHEN s.is_active THEN s.id END)::INTEGER as active_stores,
            COUNT(DISTINCT p.id)::INTEGER as total_products,
            COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END)::INTEGER as active_products,
            COUNT(DISTINCT pv.id)::INTEGER as total_views,
            COUNT(DISTINCT pc.id)::INTEGER as total_clicks
        FROM stores s
        LEFT JOIN products p ON s.id = p.store_id
        LEFT JOIN product_views pv ON p.id = pv.product_id
        LEFT JOIN product_clicks pc ON p.id = pc.product_id
        WHERE s.user_id = p_user_id
    )
    SELECT 
        m.total_stores,
        m.active_stores,
        m.total_products,
        m.active_products,
        m.total_views,
        m.total_clicks,
        CASE 
            WHEN m.total_views > 0 
            THEN (m.total_clicks::DECIMAL / m.total_views * 100)
            ELSE 0
        END as overall_conversion_rate,
        u.subscription_tier,
        v_max_stores,
        v_max_stores * v_max_products_per_store
    FROM metrics m
    CROSS JOIN users u
    WHERE u.id = p_user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_feature_limits_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_summary_by_id(UUID) TO authenticated;
