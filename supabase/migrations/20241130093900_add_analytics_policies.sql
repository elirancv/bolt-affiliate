-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own product views" ON product_views;
DROP POLICY IF EXISTS "Users can view their own product clicks" ON product_clicks;

-- Add foreign key constraints for product_views and product_clicks
ALTER TABLE product_views
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

ALTER TABLE product_clicks
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Enable RLS
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for product_views
CREATE POLICY "Users can view their own product views"
ON product_views
FOR SELECT
TO authenticated
USING (
  product_id IN (
    SELECT p.id 
    FROM products p
    JOIN stores s ON p.store_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- Create policies for product_clicks
CREATE POLICY "Users can view their own product clicks"
ON product_clicks
FOR SELECT
TO authenticated
USING (
  product_id IN (
    SELECT p.id 
    FROM products p
    JOIN stores s ON p.store_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- Grant access to authenticated users
GRANT SELECT ON product_views TO authenticated;
GRANT SELECT ON product_clicks TO authenticated;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS product_views_product_id_idx ON product_views(product_id);
CREATE INDEX IF NOT EXISTS product_clicks_product_id_idx ON product_clicks(product_id);
