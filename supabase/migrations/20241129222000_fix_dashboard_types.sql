-- Fix the get_user_dashboard_summary function with correct types
CREATE OR REPLACE FUNCTION public.get_user_dashboard_summary()
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
    v_limits public.feature_limits;
    v_user_id uuid;
BEGIN
    -- Get the authenticated user's ID
    v_user_id := auth.uid();

    -- Get user's feature limits
    v_limits := public.get_user_feature_limits_v2();

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
        WHERE s.user_id = v_user_id
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
        v_limits.max_stores,
        v_limits.max_stores * v_limits.max_products_per_store
    FROM metrics m
    CROSS JOIN users u
    WHERE u.id = v_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_summary() TO authenticated;
