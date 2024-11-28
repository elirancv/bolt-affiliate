-- Drop existing functions
DROP FUNCTION IF EXISTS increment_page_view(UUID, DATE);
DROP FUNCTION IF EXISTS increment_product_clicks(UUID, DATE);

-- Function to increment page views with more permissive RLS
CREATE OR REPLACE FUNCTION increment_page_view(p_store_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO analytics (store_id, date, page_views)
    VALUES (p_store_id, p_date, 1)
    ON CONFLICT (store_id, date)
    DO UPDATE SET 
        page_views = analytics.page_views + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment product clicks with more permissive RLS
CREATE OR REPLACE FUNCTION increment_product_clicks(p_store_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO analytics (store_id, date, product_clicks)
    VALUES (p_store_id, p_date, 1)
    ON CONFLICT (store_id, date)
    DO UPDATE SET 
        product_clicks = analytics.product_clicks + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Make analytics table accessible to anonymous users for inserts
DROP POLICY IF EXISTS "Analytics are insertable by anyone" ON analytics;
CREATE POLICY "Analytics are insertable by anyone" ON analytics
    FOR INSERT WITH CHECK (true);

-- Make products table readable by anyone
DROP POLICY IF EXISTS "Products are viewable by anyone" ON products;
CREATE POLICY "Products are viewable by anyone" ON products
    FOR SELECT USING (true);
