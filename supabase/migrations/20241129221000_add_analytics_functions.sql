-- Create functions for tracking product views and clicks
CREATE OR REPLACE FUNCTION public.track_product_view(
    p_product_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO product_views (
        product_id,
        user_id,
        viewed_at
    )
    VALUES (
        p_product_id,
        COALESCE(p_user_id, auth.uid()),
        NOW()
    );
END;
$$;

-- Function to track product clicks (affiliate link clicks)
CREATE OR REPLACE FUNCTION public.track_product_click(
    p_product_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO product_clicks (
        product_id,
        user_id,
        clicked_at
    )
    VALUES (
        p_product_id,
        COALESCE(p_user_id, auth.uid()),
        NOW()
    );
END;
$$;

-- Function to get product analytics
CREATE OR REPLACE FUNCTION public.get_product_analytics(
    p_product_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '30 days'),
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    views_count INTEGER,
    clicks_count INTEGER,
    conversion_rate DECIMAL,
    unique_viewers INTEGER,
    unique_clickers INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(DISTINCT CASE WHEN pv.viewed_at BETWEEN p_start_date AND p_end_date THEN pv.id END) as total_views,
            COUNT(DISTINCT CASE WHEN pc.clicked_at BETWEEN p_start_date AND p_end_date THEN pc.id END) as total_clicks,
            COUNT(DISTINCT CASE WHEN pv.viewed_at BETWEEN p_start_date AND p_end_date THEN pv.user_id END) as unique_views,
            COUNT(DISTINCT CASE WHEN pc.clicked_at BETWEEN p_start_date AND p_end_date THEN pc.user_id END) as unique_clicks
        FROM products p
        LEFT JOIN product_views pv ON p.id = pv.product_id
        LEFT JOIN product_clicks pc ON p.id = pc.product_id
        WHERE p.id = p_product_id
    )
    SELECT
        total_views::INTEGER as views_count,
        total_clicks::INTEGER as clicks_count,
        CASE 
            WHEN total_views > 0 
            THEN (total_clicks::DECIMAL / total_views * 100)
            ELSE 0
        END as conversion_rate,
        unique_views::INTEGER as unique_viewers,
        unique_clicks::INTEGER as unique_clickers
    FROM stats;
END;
$$;

-- Function to get store analytics
CREATE OR REPLACE FUNCTION public.get_store_analytics(
    p_store_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '30 days'),
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_views INTEGER,
    total_clicks INTEGER,
    overall_conversion_rate DECIMAL,
    total_unique_viewers INTEGER,
    total_unique_clickers INTEGER,
    top_products JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    top_products_data JSON;
BEGIN
    -- Get top products data
    WITH product_stats AS (
        SELECT 
            p.id,
            p.name,
            COUNT(DISTINCT CASE WHEN pv.viewed_at BETWEEN p_start_date AND p_end_date THEN pv.id END) as view_count,
            COUNT(DISTINCT CASE WHEN pc.clicked_at BETWEEN p_start_date AND p_end_date THEN pc.id END) as click_count
        FROM products p
        LEFT JOIN product_views pv ON p.id = pv.product_id
        LEFT JOIN product_clicks pc ON p.id = pc.product_id
        WHERE p.store_id = p_store_id
        GROUP BY p.id, p.name
        ORDER BY view_count DESC
        LIMIT 5
    )
    SELECT json_agg(row_to_json(product_stats))
    INTO top_products_data
    FROM product_stats;

    -- Get overall stats
    RETURN QUERY
    WITH store_stats AS (
        SELECT
            COUNT(DISTINCT CASE WHEN pv.viewed_at BETWEEN p_start_date AND p_end_date THEN pv.id END) as all_views,
            COUNT(DISTINCT CASE WHEN pc.clicked_at BETWEEN p_start_date AND p_end_date THEN pc.id END) as all_clicks,
            COUNT(DISTINCT CASE WHEN pv.viewed_at BETWEEN p_start_date AND p_end_date THEN pv.user_id END) as unique_views,
            COUNT(DISTINCT CASE WHEN pc.clicked_at BETWEEN p_start_date AND p_end_date THEN pc.user_id END) as unique_clicks
        FROM products p
        LEFT JOIN product_views pv ON p.id = pv.product_id
        LEFT JOIN product_clicks pc ON p.id = pc.product_id
        WHERE p.store_id = p_store_id
    )
    SELECT
        all_views::INTEGER,
        all_clicks::INTEGER,
        CASE 
            WHEN all_views > 0 
            THEN (all_clicks::DECIMAL / all_views * 100)
            ELSE 0
        END,
        unique_views::INTEGER,
        unique_clicks::INTEGER,
        top_products_data
    FROM store_stats;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.track_product_view(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_product_click(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_analytics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_analytics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
