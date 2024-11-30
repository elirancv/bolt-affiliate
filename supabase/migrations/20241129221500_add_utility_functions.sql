-- Function to update store status
CREATE OR REPLACE FUNCTION public.update_store_status(
    p_store_id UUID,
    p_is_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user owns the store
    IF NOT EXISTS (
        SELECT 1 FROM stores 
        WHERE id = p_store_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Store not found or access denied';
    END IF;

    UPDATE stores
    SET 
        is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_store_id;
END;
$$;

-- Function to update product status
CREATE OR REPLACE FUNCTION public.update_product_status(
    p_product_id UUID,
    p_is_active BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user owns the product's store
    IF NOT EXISTS (
        SELECT 1 
        FROM products p
        JOIN stores s ON p.store_id = s.id
        WHERE p.id = p_product_id AND s.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Product not found or access denied';
    END IF;

    UPDATE products
    SET 
        is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_product_id;
END;
$$;

-- Function to get user's subscription details
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
            COUNT(DISTINCT s.id) as total_stores,
            COUNT(DISTINCT p.id) as total_products
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

-- Function to get recent activity
CREATE OR REPLACE FUNCTION public.get_recent_activity(
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    activity_type TEXT,
    activity_date TIMESTAMPTZ,
    store_id UUID,
    store_name TEXT,
    product_id UUID,
    product_name TEXT,
    activity_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH user_stores AS (
        SELECT id, name
        FROM stores
        WHERE user_id = auth.uid()
    ),
    user_products AS (
        SELECT p.id, p.name, p.store_id
        FROM products p
        JOIN user_stores us ON p.store_id = us.id
    ),
    views AS (
        SELECT 
            'view'::TEXT as activity_type,
            date_trunc('day', pv.viewed_at) as activity_date,
            up.store_id,
            us.name as store_name,
            up.id as product_id,
            up.name as product_name,
            COUNT(*) as activity_count
        FROM product_views pv
        JOIN user_products up ON pv.product_id = up.id
        JOIN user_stores us ON up.store_id = us.id
        WHERE pv.viewed_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY 1, 2, 3, 4, 5, 6
    ),
    clicks AS (
        SELECT 
            'click'::TEXT as activity_type,
            date_trunc('day', pc.clicked_at) as activity_date,
            up.store_id,
            us.name as store_name,
            up.id as product_id,
            up.name as product_name,
            COUNT(*) as activity_count
        FROM product_clicks pc
        JOIN user_products up ON pc.product_id = up.id
        JOIN user_stores us ON up.store_id = us.id
        WHERE pc.clicked_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY 1, 2, 3, 4, 5, 6
    )
    SELECT * FROM views
    UNION ALL
    SELECT * FROM clicks
    ORDER BY activity_date DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_store_status(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_status(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_details() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_activity(INTEGER) TO authenticated;
