-- Create stores table first
CREATE TABLE IF NOT EXISTS stores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type text DEFAULT 'custom' CHECK (type IN ('custom', 'predefined')),
    slug text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products_categories junction table
CREATE TABLE IF NOT EXISTS products_categories (
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Create analytics_page_views table
CREATE TABLE IF NOT EXISTS analytics_page_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    view_date date NOT NULL,
    view_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, view_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stores
DROP POLICY IF EXISTS "Stores are viewable by owner" ON stores;
DROP POLICY IF EXISTS "Stores are viewable by public when active" ON stores;

CREATE POLICY "Stores are viewable by owner"
ON stores FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Stores are viewable by public when active"
ON stores FOR SELECT
TO anon
USING (is_active = true);

-- Create RLS policies for products
DROP POLICY IF EXISTS "Products are viewable by store owner" ON products;
DROP POLICY IF EXISTS "Products are viewable by public when active" ON products;

CREATE POLICY "Products are viewable by store owner"
ON products FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT id FROM stores
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Products are viewable by public when active"
ON products FOR SELECT
TO anon
USING (
  status = 'active' AND
  store_id IN (
    SELECT id FROM stores
    WHERE is_active = true
  )
);

-- Create RLS policies for categories
DROP POLICY IF EXISTS "Categories are viewable by store owner" ON categories;
DROP POLICY IF EXISTS "Categories are viewable by public" ON categories;

CREATE POLICY "Categories are viewable by store owner"
ON categories FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT id FROM stores
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Categories are viewable by public"
ON categories FOR SELECT
TO anon
USING (
  store_id IN (
    SELECT id FROM stores
    WHERE is_active = true
  )
);

-- Create RLS policies for products_categories
DROP POLICY IF EXISTS "Products categories are viewable by store owner" ON products_categories;
DROP POLICY IF EXISTS "Products categories are viewable by public" ON products_categories;

CREATE POLICY "Products categories are viewable by store owner"
ON products_categories FOR SELECT
TO authenticated
USING (
  product_id IN (
    SELECT id FROM products WHERE store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Products categories are viewable by public"
ON products_categories FOR SELECT
TO anon
USING (
  product_id IN (
    SELECT id FROM products WHERE store_id IN (
      SELECT id FROM stores WHERE is_active = true
    )
  )
);

-- Create RLS policies for analytics_page_views
DROP POLICY IF EXISTS "Analytics are viewable by store owner" ON analytics_page_views;
DROP POLICY IF EXISTS "Analytics are insertable by anyone" ON analytics_page_views;
DROP POLICY IF EXISTS "Analytics are updatable by anyone" ON analytics_page_views;

CREATE POLICY "Analytics are viewable by store owner"
ON analytics_page_views FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT id FROM stores
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Analytics are insertable by anyone"
ON analytics_page_views FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Analytics are updatable by anyone"
ON analytics_page_views FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Create function to increment page views
CREATE OR REPLACE FUNCTION increment_page_views(p_date date, p_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO analytics_page_views (store_id, view_date, view_count)
    VALUES (p_store_id, p_date, 1)
    ON CONFLICT (store_id, view_date)
    DO UPDATE SET 
        view_count = analytics_page_views.view_count + 1,
        updated_at = NOW();
END;
$$;
