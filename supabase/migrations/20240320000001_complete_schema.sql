-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS clicks CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP VIEW IF EXISTS store_metrics CASCADE;

-- Create base tables
CREATE TABLE stores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    store_url TEXT,
    theme TEXT DEFAULT 'default',
    social_links JSONB DEFAULT '{}',
    social_links_position TEXT DEFAULT 'footer' CHECK (social_links_position IN ('header', 'footer', 'both')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    promotion_settings JSONB DEFAULT jsonb_build_object(
        'show_free_shipping_banner', false,
        'free_shipping_threshold', 50.00,
        'banner_text', '🎉 Free shipping on orders over $50',
        'banner_enabled', false
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    product_url TEXT NOT NULL,
    affiliate_url TEXT,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE store_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
    theme_settings JSONB DEFAULT '{}',
    custom_domain TEXT,
    analytics_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics tables
CREATE TABLE analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    product_clicks INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, date)
);

CREATE TABLE clicks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    source TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create store_metrics view
CREATE OR REPLACE VIEW store_metrics AS
WITH last_30_days_metrics AS (
    SELECT 
        store_id,
        SUM(page_views) as total_page_views,
        SUM(product_clicks) as total_product_clicks,
        SUM(unique_visitors) as total_unique_visitors
    FROM analytics
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY store_id
)
SELECT 
    s.id as store_id,
    COALESCE(m.total_unique_visitors, 0) as unique_visitors,
    COALESCE(m.total_product_clicks, 0) as product_clicks,
    COALESCE(m.total_page_views, 0) as page_views,
    CASE 
        WHEN COALESCE(m.total_page_views, 0) > 0 
        THEN ROUND((COALESCE(m.total_product_clicks, 0)::DECIMAL / COALESCE(m.total_page_views, 0)) * 100, 1)
        ELSE 0 
    END as conversion_rate,
    0 as total_commission,
    0 as approved_commissions
FROM 
    stores s
    LEFT JOIN last_30_days_metrics m ON s.id = m.store_id;

-- Analytics functions
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

CREATE OR REPLACE FUNCTION increment_page_views(p_store_id UUID, p_date DATE)
RETURNS void AS $$
DECLARE
    v_source text;
    v_referrer text;
BEGIN
    -- Get source info from session
    SELECT current_setting('request.headers')::jsonb->>'origin' INTO v_source;
    SELECT current_setting('request.headers')::jsonb->>'referer' INTO v_referrer;

    -- Insert or update analytics
    INSERT INTO analytics (store_id, date, page_views, unique_visitors)
    VALUES (
        p_store_id, 
        p_date, 
        1,
        CASE WHEN v_source IS NOT NULL AND v_source != '' THEN 1 ELSE 0 END
    )
    ON CONFLICT (store_id, date)
    DO UPDATE SET 
        page_views = analytics.page_views + 1,
        unique_visitors = CASE 
            WHEN v_source IS NOT NULL AND v_source != '' AND 
                 NOT EXISTS (
                    SELECT 1 FROM clicks 
                    WHERE store_id = p_store_id 
                    AND DATE(created_at) = p_date 
                    AND source = v_source
                 )
            THEN analytics.unique_visitors + 1
            ELSE analytics.unique_visitors
        END,
        updated_at = NOW();

    -- Record the click with source information if available
    IF v_source IS NOT NULL AND v_source != '' THEN
        INSERT INTO clicks (store_id, source, referrer)
        VALUES (p_store_id, v_source, v_referrer);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Default categories function
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default categories
    INSERT INTO categories (store_id, name, description)
    VALUES 
        (NEW.id, 'Featured', 'Featured products'),
        (NEW.id, 'New Arrivals', 'Latest products'),
        (NEW.id, 'Best Sellers', 'Most popular products'),
        (NEW.id, 'Sale', 'Products on sale');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER store_created_trigger
    AFTER INSERT ON stores
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories();

-- RLS Policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- Store policies
CREATE POLICY "Users can view their own stores"
    ON stores FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stores"
    ON stores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores"
    ON stores FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores"
    ON stores FOR DELETE
    USING (auth.uid() = user_id);

-- Product policies
CREATE POLICY "Products are viewable by anyone"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Products are insertable by store owner"
    ON products FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Products are updatable by store owner"
    ON products FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Products are deletable by store owner"
    ON products FOR DELETE
    USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

-- Category policies
CREATE POLICY "Categories are viewable by anyone"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Categories are manageable by store owner"
    ON categories FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

-- Store settings policies
CREATE POLICY "Settings are viewable by store owner"
    ON store_settings FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Settings are manageable by store owner"
    ON store_settings FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

-- Analytics policies
CREATE POLICY "Analytics are viewable by store owner"
    ON analytics FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Analytics are insertable by anyone"
    ON analytics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Analytics are updatable by anyone"
    ON analytics FOR UPDATE
    USING (true);

-- Clicks policies
CREATE POLICY "Clicks are viewable by store owner"
    ON clicks FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Clicks are insertable by anyone"
    ON clicks FOR INSERT
    WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON store_metrics TO authenticated;
GRANT SELECT ON store_metrics TO anon;
GRANT EXECUTE ON FUNCTION increment_product_clicks TO authenticated;
GRANT EXECUTE ON FUNCTION increment_page_views TO authenticated;
