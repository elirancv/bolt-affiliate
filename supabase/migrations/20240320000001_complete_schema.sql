-- Reset everything
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Reset RLS
ALTER TABLE IF EXISTS auth.users DISABLE ROW LEVEL SECURITY;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set up storage (only if bucket doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
    END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON auth.users;
DROP POLICY IF EXISTS "Users can update own profile." ON auth.users;

-- Create storage policies
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars');

-- Create auth policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'auth' 
        AND tablename = 'users' 
        AND policyname = 'Public profiles are viewable by everyone.'
    ) THEN
        CREATE POLICY "Public profiles are viewable by everyone."
            ON auth.users FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'auth' 
        AND tablename = 'users' 
        AND policyname = 'Users can update own profile.'
    ) THEN
        CREATE POLICY "Users can update own profile."
            ON auth.users FOR UPDATE
            USING (auth.uid() = id);
    END IF;
END $$;

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stores table
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

-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
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

-- Create store_settings table
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

-- Create analytics table
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

-- Create clicks table
CREATE TABLE clicks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    source TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT,
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

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to check store ownership
CREATE OR REPLACE FUNCTION is_store_owner(store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM stores 
        WHERE id = store_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS handle_%I_updated_at ON %I;
            CREATE TRIGGER handle_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION handle_updated_at();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Product validation trigger function
CREATE OR REPLACE FUNCTION products_validation_trigger()
RETURNS trigger AS $$
BEGIN
    -- Check required fields
    IF NEW.name IS NULL OR NEW.name = '' THEN
        RAISE EXCEPTION 'Product name is required';
    END IF;

    IF NEW.product_url IS NULL OR NEW.product_url = '' THEN
        RAISE EXCEPTION 'Product URL is required';
    END IF;

    -- Validate price
    IF NEW.price IS NOT NULL AND NEW.price < 0 THEN
        RAISE EXCEPTION 'Price cannot be negative';
    END IF;

    IF NEW.sale_price IS NOT NULL THEN
        IF NEW.sale_price < 0 THEN
            RAISE EXCEPTION 'Sale price cannot be negative';
        END IF;
        
        IF NEW.price IS NOT NULL AND NEW.sale_price >= NEW.price THEN
            RAISE EXCEPTION 'Sale price must be less than regular price';
        END IF;
    END IF;

    -- Validate URLs
    IF NEW.product_url !~ '^https?://' THEN
        RAISE EXCEPTION 'Product URL must start with http:// or https://';
    END IF;

    IF NEW.affiliate_url IS NOT NULL AND NEW.affiliate_url !~ '^https?://' THEN
        RAISE EXCEPTION 'Affiliate URL must start with http:// or https://';
    END IF;

    -- Validate image URLs array
    IF NEW.image_urls IS NULL OR array_length(NEW.image_urls, 1) = 0 THEN
        RAISE EXCEPTION 'At least one image URL is required';
    END IF;

    -- Validate metadata
    IF NEW.metadata IS NOT NULL AND NOT jsonb_typeof(NEW.metadata) = 'object' THEN
        RAISE EXCEPTION 'Metadata must be a valid JSON object';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_product ON products;

-- Create trigger for product validation
CREATE TRIGGER validate_product
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION products_validation_trigger();

-- Triggers
CREATE TRIGGER store_created_trigger
    AFTER INSERT ON stores
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories();

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Store policies using the helper function
CREATE POLICY "Store owner access"
    ON stores FOR ALL
    USING (auth.uid() = user_id);

-- Product policies using the helper function
CREATE POLICY "Products are viewable by anyone"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Products are manageable by store owner"
    ON products FOR ALL
    USING (is_store_owner(store_id));

-- Category policies using the helper function
CREATE POLICY "Categories are viewable by anyone"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Categories are manageable by store owner"
    ON categories FOR ALL
    USING (is_store_owner(store_id));

-- Store settings policies using the helper function
CREATE POLICY "Store settings are manageable by store owner"
    ON store_settings FOR ALL
    USING (is_store_owner(store_id));

-- Analytics policies using the helper function
CREATE POLICY "Analytics are viewable by store owner"
    ON analytics FOR SELECT
    USING (is_store_owner(store_id));

CREATE POLICY "Analytics are insertable by anyone"
    ON analytics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Analytics are updatable by anyone"
    ON analytics FOR UPDATE
    USING (true);

-- Clicks policies using the helper function
CREATE POLICY "Clicks are viewable by store owner"
    ON clicks FOR SELECT
    USING (is_store_owner(store_id));

CREATE POLICY "Clicks are insertable by anyone"
    ON clicks FOR INSERT
    WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.products_validation_trigger TO authenticated;

-- Grant permissions
GRANT SELECT ON store_metrics TO authenticated;
GRANT SELECT ON store_metrics TO anon;
GRANT EXECUTE ON FUNCTION increment_product_clicks TO authenticated;
GRANT EXECUTE ON FUNCTION increment_page_views TO authenticated;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RPC function for frontend validation
CREATE OR REPLACE FUNCTION public.check_schema(
    product JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    name TEXT;
    product_url TEXT;
    price DECIMAL;
    sale_price DECIMAL;
    affiliate_url TEXT;
    image_urls TEXT[];
    metadata JSONB;
BEGIN
    -- Extract values from JSONB
    name := product->>'name';
    product_url := product->>'product_url';
    price := (product->>'price')::DECIMAL;
    sale_price := (product->>'sale_price')::DECIMAL;
    affiliate_url := product->>'affiliate_url';
    image_urls := ARRAY(SELECT jsonb_array_elements_text(product->'image_urls'));
    metadata := product->'metadata';

    -- Check required fields
    IF name IS NULL OR name = '' THEN
        RAISE EXCEPTION 'Product name is required';
    END IF;

    IF product_url IS NULL OR product_url = '' THEN
        RAISE EXCEPTION 'Product URL is required';
    END IF;

    -- Validate price
    IF price IS NOT NULL AND price < 0 THEN
        RAISE EXCEPTION 'Price cannot be negative';
    END IF;

    IF sale_price IS NOT NULL THEN
        IF sale_price < 0 THEN
            RAISE EXCEPTION 'Sale price cannot be negative';
        END IF;
        
        IF price IS NOT NULL AND sale_price >= price THEN
            RAISE EXCEPTION 'Sale price must be less than regular price';
        END IF;
    END IF;

    -- Validate URLs
    IF product_url !~ '^https?://' THEN
        RAISE EXCEPTION 'Product URL must start with http:// or https://';
    END IF;

    IF affiliate_url IS NOT NULL AND affiliate_url !~ '^https?://' THEN
        RAISE EXCEPTION 'Affiliate URL must start with http:// or https://';
    END IF;

    -- Validate image URLs array
    IF image_urls IS NULL OR array_length(image_urls, 1) = 0 THEN
        RAISE EXCEPTION 'At least one image URL is required';
    END IF;

    -- Validate metadata
    IF metadata IS NOT NULL AND NOT jsonb_typeof(metadata) = 'object' THEN
        RAISE EXCEPTION 'Metadata must be a valid JSON object';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION public.check_schema(JSONB) TO authenticated;
