-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables and functions
DROP TRIGGER IF EXISTS store_created_trigger ON stores;
DROP FUNCTION IF EXISTS create_default_categories();
DROP FUNCTION IF EXISTS insert_default_categories(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS refresh_store_metrics();
DROP FUNCTION IF EXISTS increment_page_view(UUID, DATE);
DROP FUNCTION IF EXISTS increment_product_clicks(UUID, DATE);
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS commissions CASCADE;
DROP TABLE IF EXISTS clicks CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS affiliate_networks CASCADE;
DROP TABLE IF EXISTS payout_info CASCADE;

-- Affiliate Networks table
CREATE TABLE affiliate_networks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    website TEXT,
    api_endpoint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout Information
CREATE TABLE payout_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    payment_details JSONB,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table
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
    affiliate_network_id UUID REFERENCES affiliate_networks(id),
    affiliate_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add promotion settings to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS promotion_settings jsonb DEFAULT jsonb_build_object(
  'show_free_shipping_banner', false,
  'free_shipping_threshold', 50.00,
  'banner_text', '🎉 Free shipping on orders over $50',
  'banner_enabled', false
);

-- Categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table with image_urls array
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

-- Store Settings table
CREATE TABLE store_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    theme_settings JSONB DEFAULT '{}',
    custom_domain TEXT,
    analytics_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    product_clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, date)
);

-- Clicks/Analytics table
CREATE TABLE clicks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    source TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for all tables
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment page views
CREATE OR REPLACE FUNCTION increment_page_views(p_store_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO analytics (store_id, date, page_views)
  VALUES (p_store_id, p_date, 1)
  ON CONFLICT (store_id, date)
  DO UPDATE SET
    page_views = analytics.page_views + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to insert default categories
CREATE OR REPLACE FUNCTION insert_default_categories(store_uuid UUID)
RETURNS void AS $$
DECLARE
    default_categories TEXT[] := ARRAY[
        'Electronics',
        'Fashion',
        'Home & Garden',
        'Books',
        'Sports & Outdoors',
        'Beauty & Health',
        'Toys & Games',
        'Automotive',
        'Pet Supplies',
        'Office Supplies'
    ];
    category TEXT;
BEGIN
    FOREACH category IN ARRAY default_categories
    LOOP
        INSERT INTO categories (store_id, name, description)
        VALUES (store_uuid, category, category || ' products');
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create default categories
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM insert_default_categories(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new stores
CREATE TRIGGER store_created_trigger
    AFTER INSERT ON stores
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories();

-- Function to refresh store metrics
CREATE OR REPLACE FUNCTION refresh_store_metrics(store_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert or update store metrics
  INSERT INTO store_metrics (store_id, product_count, click_count, total_commission, approved_commissions)
  SELECT 
    p.store_id,
    COUNT(DISTINCT p.id) as product_count,
    COALESCE(SUM(a.product_clicks), 0) as click_count,
    COALESCE(SUM(c.amount), 0) as total_commission,
    COALESCE(SUM(CASE WHEN c.status = 'approved' THEN c.amount ELSE 0 END), 0) as approved_commissions
  FROM products p
  LEFT JOIN analytics a ON p.store_id = a.store_id
  LEFT JOIN commissions c ON p.store_id = c.store_id
  WHERE p.store_id = store_id
  GROUP BY p.store_id
  ON CONFLICT (store_id) DO UPDATE SET
    product_count = EXCLUDED.product_count,
    click_count = EXCLUDED.click_count,
    total_commission = EXCLUDED.total_commission,
    approved_commissions = EXCLUDED.approved_commissions,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Store policies
CREATE POLICY "Stores are viewable by owner" ON stores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Stores are insertable by authenticated users" ON stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Stores are updatable by owner" ON stores
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Stores are deletable by owner" ON stores
    FOR DELETE USING (auth.uid() = user_id);

-- Category policies
CREATE POLICY "Categories are viewable by store owner" ON categories
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Categories are insertable by store owner or system" ON categories
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        ) OR 
        COALESCE(CURRENT_SETTING('app.current_user_id', TRUE), '') = ''
    );

CREATE POLICY "Categories are updatable by store owner" ON categories
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Categories are deletable by store owner" ON categories
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

-- Product policies
CREATE POLICY "Products are viewable by anyone" ON products
    FOR SELECT USING (true);

CREATE POLICY "Products are insertable by store owner" ON products
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Products are updatable by store owner" ON products
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Products are deletable by store owner" ON products
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

-- Analytics policies
CREATE POLICY "Analytics are viewable by store owner" ON analytics
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM stores WHERE id = store_id
        )
    );

CREATE POLICY "Analytics are insertable by anyone" ON analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Analytics are updatable by anyone" ON analytics
    FOR UPDATE USING (true);

-- Create view for store metrics
CREATE OR REPLACE VIEW store_metrics AS
SELECT 
    s.id as store_id,
    s.name as store_name,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT c.id) as click_count,
    0 as total_commission
FROM stores s
LEFT JOIN products p ON p.store_id = s.id
LEFT JOIN clicks c ON c.store_id = s.id
GROUP BY s.id, s.name;
