-- Create product_clicks table to track click counts
CREATE TABLE IF NOT EXISTS product_clicks (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id)
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_product_clicks_product_id ON product_clicks(product_id);

-- Add RLS policies for product_clicks
ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname::text FROM pg_policies WHERE tablename = 'product_clicks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON product_clicks', pol.policyname);
    END LOOP;
END $$;

-- Create RLS policies
CREATE POLICY "Enable read access for product clicks"
ON product_clicks FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_clicks.product_id
        AND p.status = 'active'
    )
);

CREATE POLICY "Enable insert for product clicks"
ON product_clicks FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_id
        AND p.status = 'active'
    )
);

-- Drop existing view if it exists
DROP VIEW IF EXISTS product_clicks_view;

-- Create a view that joins products and product_clicks
CREATE VIEW product_clicks_view AS
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.description,
    p.store_id,
    p.image_url,
    p.status,
    p.is_featured,
    p.created_at,
    p.updated_at,
    COALESCE(clicks.total, 0) as click_count
  FROM products p
  LEFT JOIN LATERAL (
    SELECT product_id, SUM(count) as total
    FROM product_clicks
    WHERE product_id = p.id
    GROUP BY product_id
  ) clicks ON clicks.product_id = p.id;

-- Enable RLS
ALTER VIEW product_clicks_view SET (security_invoker = TRUE);
ALTER VIEW product_clicks_view ENABLE ROW LEVEL SECURITY;

-- Add policy
CREATE POLICY "Users can view product clicks for active products"
  ON product_clicks_view
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view product clicks for active products" ON product_clicks_view;

-- Create debug function for logging
CREATE OR REPLACE FUNCTION log_auth_details() 
RETURNS text 
LANGUAGE plpgsql
AS $$
DECLARE
    auth_role text;
    user_id text;
BEGIN
    -- Get current auth details
    auth_role := current_setting('role', TRUE);
    user_id := current_setting('request.jwt.claims', TRUE)::json->>'sub';
    
    RETURN format('Role: %s, User ID: %s', auth_role, user_id);
END;
$$;

-- Function to increment click count with logging
CREATE OR REPLACE FUNCTION increment_product_clicks(
  p_product_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_details text;
    v_store_id uuid;
    v_user_id uuid;
BEGIN
    -- Log authentication details
    v_auth_details := log_auth_details();
    RAISE LOG 'increment_product_clicks - Auth Details: %', v_auth_details;
    
    -- Get store_id and user_id for the product
    SELECT s.id, s.user_id 
    INTO v_store_id, v_user_id
    FROM products p
    JOIN stores s ON p.store_id = s.id
    WHERE p.id = p_product_id;
    
    RAISE LOG 'increment_product_clicks - Product ID: %, Store ID: %, User ID: %', 
              p_product_id, v_store_id, v_user_id;

    -- Insert or update click count
    INSERT INTO product_clicks (product_id, count)
    VALUES (p_product_id, 1)
    ON CONFLICT (product_id)
    DO UPDATE SET 
        count = product_clicks.count + 1,
        updated_at = NOW();
        
    RAISE LOG 'increment_product_clicks - Successfully updated click count for product %', p_product_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'increment_product_clicks - Error: %', SQLERRM;
        RAISE;
END;
$$;
