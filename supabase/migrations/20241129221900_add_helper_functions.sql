-- Function to get all user stores with basic info
CREATE OR REPLACE FUNCTION public.get_user_stores()
RETURNS TABLE (
    store_id UUID,
    store_name TEXT,
    store_description TEXT,
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN,
    product_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.logo_url,
        s.website_url,
        s.is_active,
        COUNT(p.id)::INTEGER as product_count
    FROM stores s
    LEFT JOIN products p ON s.id = p.store_id
    WHERE s.user_id = auth.uid()
    GROUP BY s.id, s.name, s.description, s.logo_url, s.website_url, s.is_active;
END;
$$;

-- Function to get store products with stats
CREATE OR REPLACE FUNCTION public.get_store_products_with_stats(
    p_store_id UUID
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_description TEXT,
    price DECIMAL,
    image_url TEXT,
    affiliate_link TEXT,
    is_active BOOLEAN,
    view_count INTEGER,
    click_count INTEGER,
    conversion_rate DECIMAL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
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

    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.affiliate_link,
        p.is_active,
        COUNT(DISTINCT pv.id)::INTEGER as view_count,
        COUNT(DISTINCT pc.id)::INTEGER as click_count,
        CASE 
            WHEN COUNT(DISTINCT pv.id) > 0 
            THEN (COUNT(DISTINCT pc.id)::DECIMAL / COUNT(DISTINCT pv.id) * 100)
            ELSE 0
        END as conversion_rate,
        p.created_at,
        p.updated_at
    FROM products p
    LEFT JOIN product_views pv ON p.id = pv.product_id
    LEFT JOIN product_clicks pc ON p.id = pc.product_id
    WHERE p.store_id = p_store_id
    GROUP BY p.id, p.name, p.description, p.price, p.image_url, 
             p.affiliate_link, p.is_active, p.created_at, p.updated_at;
END;
$$;

-- Function to get user dashboard summary
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
BEGIN
    -- Get user's feature limits
    v_limits := public.get_user_feature_limits_v2();

    RETURN QUERY
    WITH metrics AS (
        SELECT 
            COUNT(DISTINCT s.id) as total_stores,
            COUNT(DISTINCT CASE WHEN s.is_active THEN s.id END) as active_stores,
            COUNT(DISTINCT p.id) as total_products,
            COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END) as active_products,
            COUNT(DISTINCT pv.id) as total_views,
            COUNT(DISTINCT pc.id) as total_clicks
        FROM stores s
        LEFT JOIN products p ON s.id = p.store_id
        LEFT JOIN product_views pv ON p.id = pv.product_id
        LEFT JOIN product_clicks pc ON p.id = pc.product_id
        WHERE s.user_id = auth.uid()
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
    WHERE u.id = auth.uid();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_stores() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_products_with_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_summary() TO authenticated;
