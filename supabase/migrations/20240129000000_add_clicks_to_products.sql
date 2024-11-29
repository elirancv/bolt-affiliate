-- Add clicks column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS clicks integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_clicked_at timestamp with time zone;

-- Drop existing product_clicks table if it exists
DROP TABLE IF EXISTS product_clicks;

-- Create clicks history table with CASCADE delete
CREATE TABLE IF NOT EXISTS product_clicks (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    clicked_at timestamp with time zone DEFAULT now()
);

-- Grant permissions for authenticated users
GRANT SELECT, INSERT ON product_clicks TO authenticated;
GRANT SELECT, UPDATE, DELETE ON products TO authenticated;
GRANT SELECT ON stores TO authenticated;
GRANT INSERT, UPDATE ON analytics TO authenticated;

-- Function to get clicks for a time period
CREATE OR REPLACE FUNCTION get_product_clicks_in_period(
    p_store_id uuid,
    p_start_date timestamp with time zone,
    p_end_date timestamp with time zone
) RETURNS TABLE (
    product_id uuid,
    period_clicks bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.product_id,
        COUNT(*) as period_clicks
    FROM product_clicks pc
    WHERE pc.store_id = p_store_id
    AND pc.clicked_at >= p_start_date
    AND pc.clicked_at < p_end_date
    GROUP BY pc.product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_product_clicks_in_period(uuid, timestamp with time zone, timestamp with time zone) TO authenticated;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_top_products_with_clicks(uuid[], timestamp with time zone);

-- Function to get top products with their click counts for a time period
CREATE OR REPLACE FUNCTION get_top_products_with_clicks(
    store_ids uuid[],
    start_date timestamp with time zone
)
RETURNS TABLE (
    product_id uuid,
    product_name text,
    product_price numeric,
    product_image_urls text[],
    product_store_id uuid,
    product_url text,
    affiliate_url text,
    period_clicks bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
        p.image_urls as product_image_urls,
        p.store_id as product_store_id,
        p.product_url,
        p.affiliate_url,
        COUNT(pc.id) as period_clicks
    FROM products p
    LEFT JOIN product_clicks pc ON p.id = pc.product_id 
        AND pc.clicked_at >= start_date
    WHERE p.store_id = ANY(store_ids)
    AND p.status = 'active'
    GROUP BY p.id, p.name, p.price, p.image_urls, p.store_id, p.product_url, p.affiliate_url
    ORDER BY period_clicks DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_top_products_with_clicks(uuid[], timestamp with time zone) TO authenticated;

-- Function to increment clicks
CREATE OR REPLACE FUNCTION increment_product_clicks(
    p_store_id uuid,
    p_product_id uuid
)
RETURNS void AS $$
BEGIN
    -- Insert click record
    INSERT INTO product_clicks (store_id, product_id)
    VALUES (p_store_id, p_product_id);

    -- Update total clicks on product
    UPDATE products 
    SET clicks = clicks + 1,
        last_clicked_at = NOW()
    WHERE id = p_product_id;

    -- Update store metrics
    INSERT INTO analytics (store_id, date, product_clicks)
    VALUES (p_store_id, CURRENT_DATE, 1)
    ON CONFLICT (store_id, date)
    DO UPDATE SET product_clicks = analytics.product_clicks + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_product_clicks(uuid, uuid) TO authenticated;
