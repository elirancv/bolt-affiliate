-- Update existing tables

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_clicks_store_id ON clicks(store_id);
CREATE INDEX IF NOT EXISTS idx_clicks_product_id ON clicks(product_id);

-- Add commission tracking table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    click_id UUID REFERENCES clicks(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    transaction_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add commission policies
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commissions are viewable by store owner" ON commissions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Commissions are insertable by system" ON commissions
    FOR INSERT WITH CHECK (
        COALESCE(CURRENT_SETTING('app.current_user_id', TRUE), '') = ''
    );

-- Add commission trigger for updated_at
CREATE TRIGGER update_commissions_updated_at
    BEFORE UPDATE ON commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add analytics improvements to clicks table
ALTER TABLE clicks 
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS ip_address TEXT,
    ADD COLUMN IF NOT EXISTS country_code TEXT,
    ADD COLUMN IF NOT EXISTS device_type TEXT,
    ADD COLUMN IF NOT EXISTS campaign_id TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add store analytics view
CREATE OR REPLACE VIEW store_analytics AS
SELECT 
    s.id as store_id,
    s.name as store_name,
    COUNT(DISTINCT c.id) as total_clicks,
    COUNT(DISTINCT cm.id) as total_conversions,
    COALESCE(SUM(cm.amount), 0) as total_commission,
    DATE_TRUNC('day', c.created_at) as date
FROM stores s
LEFT JOIN clicks c ON s.id = c.store_id
LEFT JOIN commissions cm ON c.id = cm.click_id
GROUP BY s.id, s.name, DATE_TRUNC('day', c.created_at);

-- Add store settings improvements
ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS seo_settings JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS payment_settings JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS integration_settings JSONB DEFAULT '{}';

-- Add product improvements
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS sku TEXT,
    ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')),
    ADD COLUMN IF NOT EXISTS tags TEXT[],
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Create materialized view for product performance
CREATE MATERIALIZED VIEW IF NOT EXISTS product_performance AS
SELECT 
    p.id,
    p.name,
    p.store_id,
    COUNT(DISTINCT c.id) as click_count,
    COUNT(DISTINCT cm.id) as conversion_count,
    COALESCE(SUM(cm.amount), 0) as total_commission,
    CASE 
        WHEN COUNT(DISTINCT c.id) > 0 
        THEN (COUNT(DISTINCT cm.id)::FLOAT / COUNT(DISTINCT c.id)) * 100 
        ELSE 0 
    END as conversion_rate
FROM products p
LEFT JOIN clicks c ON p.id = c.product_id
LEFT JOIN commissions cm ON c.id = cm.click_id
GROUP BY p.id, p.name, p.store_id;

-- Create index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_performance_id ON product_performance(id);

-- Create function to refresh product performance
CREATE OR REPLACE FUNCTION refresh_product_performance()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_performance;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh product performance
CREATE TRIGGER refresh_product_performance_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON clicks
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_product_performance();

-- Add function for calculating store metrics
CREATE OR REPLACE FUNCTION calculate_store_metrics(store_uuid UUID)
RETURNS TABLE (
    total_clicks BIGINT,
    total_conversions BIGINT,
    total_commission DECIMAL,
    conversion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.id) as total_clicks,
        COUNT(DISTINCT cm.id) as total_conversions,
        COALESCE(SUM(cm.amount), 0) as total_commission,
        CASE 
            WHEN COUNT(DISTINCT c.id) > 0 
            THEN (COUNT(DISTINCT cm.id)::FLOAT / COUNT(DISTINCT c.id)) * 100 
            ELSE 0 
        END as conversion_rate
    FROM stores s
    LEFT JOIN clicks c ON s.id = c.store_id
    LEFT JOIN commissions cm ON c.id = cm.click_id
    WHERE s.id = store_uuid;
END;
$$ LANGUAGE plpgsql;
