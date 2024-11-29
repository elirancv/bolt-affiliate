-- Create type for daily stats
CREATE TYPE public.daily_stats AS (
    date DATE,
    views INTEGER,
    clicks INTEGER,
    conversion_rate DECIMAL
);

-- Create type for product performance
CREATE TYPE public.product_performance AS (
    product_id UUID,
    product_name TEXT,
    views INTEGER,
    clicks INTEGER,
    conversion_rate DECIMAL,
    is_active BOOLEAN
);

-- Function to get daily statistics for a store
CREATE OR REPLACE FUNCTION public.get_store_daily_stats(
    p_store_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS SETOF public.daily_stats
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
    WITH dates AS (
        SELECT generate_series(p_start_date::date, p_end_date::date, '1 day'::interval)::date AS date
    ),
    daily_metrics AS (
        SELECT 
            d.date,
            COUNT(DISTINCT pv.id) as views,
            COUNT(DISTINCT pc.id) as clicks
        FROM dates d
        LEFT JOIN products p ON p.store_id = p_store_id
        LEFT JOIN product_views pv ON p.id = pv.product_id 
            AND date_trunc('day', pv.viewed_at) = d.date
        LEFT JOIN product_clicks pc ON p.id = pc.product_id 
            AND date_trunc('day', pc.clicked_at) = d.date
        GROUP BY d.date
    )
    SELECT 
        date,
        views,
        clicks,
        CASE 
            WHEN views > 0 THEN (clicks::DECIMAL / views * 100)
            ELSE 0
        END as conversion_rate
    FROM daily_metrics
    ORDER BY date;
END;
$$;

-- Function to get product performance for a store
CREATE OR REPLACE FUNCTION public.get_store_product_performance(
    p_store_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS SETOF public.product_performance
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
        p.id as product_id,
        p.name as product_name,
        COUNT(DISTINCT pv.id) as views,
        COUNT(DISTINCT pc.id) as clicks,
        CASE 
            WHEN COUNT(DISTINCT pv.id) > 0 
            THEN (COUNT(DISTINCT pc.id)::DECIMAL / COUNT(DISTINCT pv.id) * 100)
            ELSE 0
        END as conversion_rate,
        p.is_active
    FROM products p
    LEFT JOIN product_views pv ON p.id = pv.product_id 
        AND pv.viewed_at >= NOW() - (p_days || ' days')::INTERVAL
    LEFT JOIN product_clicks pc ON p.id = pc.product_id 
        AND pc.clicked_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE p.store_id = p_store_id
    GROUP BY p.id, p.name, p.is_active
    ORDER BY views DESC;
END;
$$;

-- Function to get store performance summary
CREATE OR REPLACE FUNCTION public.get_store_performance_summary(
    p_store_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_views INTEGER,
    total_clicks INTEGER,
    conversion_rate DECIMAL,
    active_products INTEGER,
    total_products INTEGER,
    avg_views_per_day DECIMAL,
    avg_clicks_per_day DECIMAL,
    best_performing_product TEXT,
    best_performing_product_clicks INTEGER
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
    WITH metrics AS (
        SELECT 
            COUNT(DISTINCT pv.id) as total_views,
            COUNT(DISTINCT pc.id) as total_clicks,
            COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END) as active_products,
            COUNT(DISTINCT p.id) as total_products
        FROM products p
        LEFT JOIN product_views pv ON p.id = pv.product_id 
            AND pv.viewed_at >= NOW() - (p_days || ' days')::INTERVAL
        LEFT JOIN product_clicks pc ON p.id = pc.product_id 
            AND pc.clicked_at >= NOW() - (p_days || ' days')::INTERVAL
        WHERE p.store_id = p_store_id
    ),
    product_metrics AS (
        SELECT 
            p.name,
            COUNT(DISTINCT pc.id) as clicks
        FROM products p
        LEFT JOIN product_clicks pc ON p.id = pc.product_id 
            AND pc.clicked_at >= NOW() - (p_days || ' days')::INTERVAL
        WHERE p.store_id = p_store_id
        GROUP BY p.id, p.name
        ORDER BY clicks DESC
        LIMIT 1
    )
    SELECT 
        m.total_views,
        m.total_clicks,
        CASE 
            WHEN m.total_views > 0 
            THEN (m.total_clicks::DECIMAL / m.total_views * 100)
            ELSE 0
        END as conversion_rate,
        m.active_products,
        m.total_products,
        (m.total_views::DECIMAL / p_days) as avg_views_per_day,
        (m.total_clicks::DECIMAL / p_days) as avg_clicks_per_day,
        pm.name as best_performing_product,
        pm.clicks as best_performing_product_clicks
    FROM metrics m
    CROSS JOIN product_metrics pm;
END;
$$;

-- Function to get top performing products across all stores
CREATE OR REPLACE FUNCTION public.get_top_performing_products(
    p_limit INTEGER DEFAULT 10,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    store_name TEXT,
    product_name TEXT,
    views INTEGER,
    clicks INTEGER,
    conversion_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.name as store_name,
        p.name as product_name,
        COUNT(DISTINCT pv.id) as views,
        COUNT(DISTINCT pc.id) as clicks,
        CASE 
            WHEN COUNT(DISTINCT pv.id) > 0 
            THEN (COUNT(DISTINCT pc.id)::DECIMAL / COUNT(DISTINCT pv.id) * 100)
            ELSE 0
        END as conversion_rate
    FROM stores s
    JOIN products p ON s.id = p.store_id
    LEFT JOIN product_views pv ON p.id = pv.product_id 
        AND pv.viewed_at >= NOW() - (p_days || ' days')::INTERVAL
    LEFT JOIN product_clicks pc ON p.id = pc.product_id 
        AND pc.clicked_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE s.user_id = auth.uid()
        AND p.is_active = true
    GROUP BY s.name, p.name
    ORDER BY clicks DESC
    LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_store_daily_stats(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_product_performance(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_performance_summary(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_performing_products(INTEGER, INTEGER) TO authenticated;
