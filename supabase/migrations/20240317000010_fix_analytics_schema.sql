-- Drop existing analytics policies
DROP POLICY IF EXISTS "Enable read for users and admin" ON analytics;
DROP POLICY IF EXISTS "Enable write for users and admin" ON analytics;

-- Create new analytics policies
CREATE POLICY "Enable read access for store owners and admin"
  ON analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Enable write access for store owners and admin"
  ON analytics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Enable update access for store owners and admin"
  ON analytics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin())
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_store_id_date ON analytics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);

-- Add constraints
ALTER TABLE analytics 
  ADD CONSTRAINT analytics_page_views_check 
  CHECK (page_views >= 0);

ALTER TABLE analytics 
  ADD CONSTRAINT analytics_unique_visitors_check 
  CHECK (unique_visitors >= 0);

ALTER TABLE analytics 
  ADD CONSTRAINT analytics_product_clicks_check 
  CHECK (product_clicks >= 0);