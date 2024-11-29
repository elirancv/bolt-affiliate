-- Add store_id and ensure it references stores table
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;

-- Add product status and featured fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);

-- Update RLS policies for products table
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
    WHERE status = 'active'
  )
);

-- Add function to update product status
CREATE OR REPLACE FUNCTION update_product_status(
  product_id uuid,
  new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = product_id
  AND EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = products.store_id
    AND stores.user_id = auth.uid()
  );
END;
$$;
