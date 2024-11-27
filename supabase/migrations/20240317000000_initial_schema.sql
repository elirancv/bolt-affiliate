-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Safely drop existing objects
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS handle_new_user CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    DROP FUNCTION IF EXISTS is_admin CASCADE;
END $$;

-- Drop existing tables
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS user_metadata CASCADE;

-- Create trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_metadata 
    WHERE user_metadata.user_id = $1 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create tables

-- user_metadata table
CREATE TABLE user_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_subscription_tier CHECK (
    subscription_tier IN ('free', 'starter', 'professional', 'business', 'unlimited')
  ),
  CONSTRAINT unique_user_metadata UNIQUE (user_id)
);

-- stores table
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  theme TEXT NOT NULL DEFAULT 'default',
  social_links JSONB NOT NULL DEFAULT '{}',
  social_links_position TEXT NOT NULL DEFAULT 'footer' CHECK (social_links_position IN ('header', 'footer', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  affiliate_url TEXT NOT NULL,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- pages table
CREATE TABLE pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content JSONB NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

-- analytics table
CREATE TABLE analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  page_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  product_clicks INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, date)
);

-- Create updated_at triggers for all tables
CREATE TRIGGER update_user_metadata_updated_at
  BEFORE UPDATE ON user_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at
  BEFORE UPDATE ON analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create indexes for optimized performance
CREATE INDEX idx_user_metadata_user_id ON user_metadata(user_id);
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_pages_store_id ON pages(store_id);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_analytics_store_id_date ON analytics(store_id, date);
CREATE INDEX idx_products_image_urls ON products USING gin(image_urls);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_metadata (
    user_id,
    subscription_tier,
    is_admin
  )
  VALUES (
    NEW.id,
    'free',
    CASE 
      WHEN NEW.email = current_setting('app.admin_email', true) THEN true 
      ELSE false 
    END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- RLS Policies

-- User Metadata policies
CREATE POLICY "Users can view metadata"
  ON user_metadata FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

CREATE POLICY "Users can update metadata"
  ON user_metadata FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

-- Store policies
CREATE POLICY "Users can view stores"
  ON stores FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

CREATE POLICY "Users can manage stores"
  ON stores FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

-- Product policies
CREATE POLICY "Users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

-- Set initial admin user
DO $$
BEGIN
  -- Insert admin user metadata if not exists
  INSERT INTO user_metadata (user_id, subscription_tier, is_admin)
  SELECT 
    auth.uid(),
    'unlimited',
    true
  FROM auth.users
  WHERE email = current_setting('app.admin_email', true)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    subscription_tier = 'unlimited',
    is_admin = true;
END $$;