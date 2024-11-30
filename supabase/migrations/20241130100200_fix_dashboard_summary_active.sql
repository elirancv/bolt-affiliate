-- Drop and recreate the get_user_dashboard_summary function
DROP FUNCTION IF EXISTS public.get_user_dashboard_summary();

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
    v_user_id uuid;
    v_limits jsonb;
    v_tier text;
BEGIN
    -- Get the authenticated user's ID
    v_user_id := auth.uid();
    
    -- Get user's subscription tier and limits
    SELECT 
        tier, 
        limits INTO v_tier, v_limits
    FROM public.user_feature_limits 
    WHERE user_id = v_user_id;

    RETURN QUERY
    WITH metrics AS (
        SELECT 
            COUNT(DISTINCT s.id)::INTEGER as total_stores,
            COUNT(DISTINCT CASE WHEN s.is_active THEN s.id END)::INTEGER as active_stores,
            COUNT(DISTINCT p.id)::INTEGER as total_products,
            COUNT(DISTINCT p.id)::INTEGER as active_products, -- All products are considered active for now
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
        COALESCE(v_tier, 'free') as subscription_tier,
        COALESCE((v_limits->>'max_stores')::INTEGER, 1) as stores_limit,
        COALESCE((v_limits->>'total_products_limit')::INTEGER, 10) as products_limit
    FROM metrics m;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_summary() TO authenticated;
