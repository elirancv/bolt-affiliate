-- Drop existing analytics policies
DROP POLICY IF EXISTS "Enable read access for store owners and admin" ON analytics;
DROP POLICY IF EXISTS "Enable write access for store owners and admin" ON analytics;
DROP POLICY IF EXISTS "Enable update access for store owners and admin" ON analytics;

-- Create simplified analytics policies
CREATE POLICY "Enable all access for store owners and admin"
  ON analytics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin())
    )
  );

-- Add default values for analytics columns
ALTER TABLE analytics 
  ALTER COLUMN page_views SET DEFAULT 0,
  ALTER COLUMN unique_visitors SET DEFAULT 0,
  ALTER COLUMN product_clicks SET DEFAULT 0;

-- Create function to initialize analytics record
CREATE OR REPLACE FUNCTION initialize_analytics_record(p_store_id UUID, p_date DATE)
RETURNS UUID AS $$
DECLARE
  new_record_id UUID;
BEGIN
  INSERT INTO analytics (store_id, date)
  VALUES (p_store_id, p_date)
  ON CONFLICT (store_id, date) 
  DO UPDATE SET 
    updated_at = NOW()
  RETURNING id INTO new_record_id;
  
  RETURN new_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION initialize_analytics_record TO authenticated;