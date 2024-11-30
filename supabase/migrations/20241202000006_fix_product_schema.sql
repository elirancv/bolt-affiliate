-- Drop the view first since it depends on the products table
DROP VIEW IF EXISTS product_clicks_view;

-- Drop and recreate the products table with all required columns
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL,
    sale_price DECIMAL,
    product_url TEXT,
    affiliate_url TEXT NOT NULL,
    image_urls TEXT[],
    category_id UUID REFERENCES categories(id),
    status TEXT NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'draft'))
);

-- Create clicks table if it doesn't exist
CREATE TABLE IF NOT EXISTS clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id),
    product_id UUID NOT NULL REFERENCES products(id),
    source TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products from their own stores"
    ON products FOR SELECT
    USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert products into their own stores"
    ON products FOR INSERT
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update products in their own stores"
    ON products FOR UPDATE
    USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete products from their own stores"
    ON products FOR DELETE
    USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

-- Add RLS policies for clicks
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clicks from their own stores"
    ON clicks FOR SELECT
    USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert clicks for their own stores"
    ON clicks FOR INSERT
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

-- Recreate the view
CREATE OR REPLACE VIEW product_clicks_view AS
SELECT 
    p.id,
    p.store_id,
    p.name,
    p.description,
    p.price,
    p.sale_price,
    p.product_url,
    p.affiliate_url,
    p.image_urls,
    p.category_id,
    p.status,
    p.is_featured,
    p.created_at,
    p.updated_at,
    COUNT(c.id) as total_clicks,
    COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as period_clicks
FROM products p
LEFT JOIN clicks c ON p.id = c.product_id
GROUP BY p.id;

-- Grant permissions on the view
GRANT SELECT ON product_clicks_view TO authenticated;
GRANT SELECT ON product_clicks_view TO service_role;
