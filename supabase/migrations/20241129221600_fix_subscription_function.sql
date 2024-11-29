-- Fix the get_user_subscription_details function
CREATE OR REPLACE FUNCTION public.get_user_subscription_details()
RETURNS TABLE (
    subscription_tier TEXT,
    subscription_status TEXT,
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    stores_used INTEGER,
    stores_limit INTEGER,
    products_used INTEGER,
    products_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limits public.feature_limits;
BEGIN
    -- Get user's feature limits
    v_limits := public.get_user_feature_limits_v2();

    RETURN QUERY
    WITH store_counts AS (
        SELECT 
            COUNT(DISTINCT s.id)::INTEGER as total_stores,
            COUNT(DISTINCT p.id)::INTEGER as total_products
        FROM stores s
        LEFT JOIN products p ON s.id = p.store_id
        WHERE s.user_id = auth.uid()
    )
    SELECT 
        u.subscription_tier,
        'active'::TEXT as subscription_status,
        u.created_at as subscription_start_date,
        NULL::TIMESTAMPTZ as subscription_end_date,
        sc.total_stores,
        v_limits.max_stores,
        sc.total_products,
        v_limits.max_stores * v_limits.max_products_per_store
    FROM users u
    CROSS JOIN store_counts sc
    WHERE u.id = auth.uid();
END;
$$;
