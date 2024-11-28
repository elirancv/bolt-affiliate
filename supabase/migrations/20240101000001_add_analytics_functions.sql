-- Create analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    product_clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, date)
);

-- Enable RLS on analytics table
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Analytics policies
CREATE POLICY "Analytics are viewable by store owner" ON analytics
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Analytics are insertable by store owner" ON analytics
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Analytics are updatable by store owner" ON analytics
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

-- Function to increment page views
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment product clicks
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
