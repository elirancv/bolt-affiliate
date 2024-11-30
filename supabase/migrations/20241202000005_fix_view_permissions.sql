-- Drop the existing view
DROP VIEW IF EXISTS product_clicks_view CASCADE;

-- Add category_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id);
    END IF;
END $$;

-- Recreate the view with all necessary columns and security check
CREATE OR REPLACE VIEW product_clicks_view AS
SELECT 
    p.id,
    p.store_id,
    p.name,
    p.description,
    p.price,
    p.affiliate_url,
    p.product_url,
    p.image_urls,
    p.category_id,
    p.created_at,
    p.updated_at,
    COALESCE(pc.click_count, 0) as click_count
FROM products p
LEFT JOIN (
    SELECT product_id, COUNT(*) as click_count
    FROM product_clicks
    GROUP BY product_id
) pc ON p.id = pc.product_id
WHERE EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = p.store_id
    AND s.user_id = auth.uid()
);

-- Grant access to the view for authenticated users
GRANT SELECT ON product_clicks_view TO authenticated;

-- Create a secure function to get top products
CREATE OR REPLACE FUNCTION public.get_top_products(
    p_store_ids UUID[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    store_id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL,
    affiliate_url TEXT,
    product_url TEXT,
    image_urls TEXT[],
    category_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    click_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.store_id,
        p.name,
        p.description,
        p.price,
        p.affiliate_url,
        p.product_url,
        p.image_urls,
        p.category_id,
        p.created_at,
        p.updated_at,
        COALESCE(pc.click_count, 0) as click_count
    FROM products p
    LEFT JOIN (
        SELECT product_id, COUNT(*) as click_count
        FROM product_clicks
        GROUP BY product_id
    ) pc ON p.id = pc.product_id
    WHERE (p_store_ids IS NULL OR p.store_id = ANY(p_store_ids))
    AND EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = p.store_id
        AND s.user_id = auth.uid()
    )
    ORDER BY click_count DESC
    LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_top_products TO authenticated;

-- Create admin stats function
CREATE OR REPLACE FUNCTION public.get_admin_stats(time_range TEXT DEFAULT '24h')
RETURNS TABLE (
    total_users BIGINT,
    total_stores BIGINT,
    total_products BIGINT,
    total_clicks BIGINT,
    active_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    time_filter TIMESTAMP;
BEGIN
    -- Set time filter based on range
    time_filter := CASE time_range
        WHEN '24h' THEN NOW() - INTERVAL '24 hours'
        WHEN '7d' THEN NOW() - INTERVAL '7 days'
        WHEN '30d' THEN NOW() - INTERVAL '30 days'
        ELSE NOW() - INTERVAL '24 hours'
    END;

    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_subscriptions 
        WHERE user_id = auth.uid() 
        AND subscription_type = 'admin'
        AND valid_until > NOW()
    ) THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT id) FROM auth.users) as total_users,
        (SELECT COUNT(*) FROM stores) as total_stores,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM product_clicks WHERE created_at >= time_filter) as total_clicks,
        (SELECT COUNT(DISTINCT user_id) 
         FROM stores s
         JOIN products p ON s.id = p.store_id
         JOIN product_clicks pc ON p.id = pc.product_id
         WHERE pc.created_at >= time_filter
        ) as active_users;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO authenticated;
