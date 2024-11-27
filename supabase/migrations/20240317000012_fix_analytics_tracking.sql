-- Drop existing analytics function
DROP FUNCTION IF EXISTS initialize_analytics_record;

-- Create improved analytics initialization function
CREATE OR REPLACE FUNCTION initialize_analytics_record(p_store_id UUID, p_date DATE)
RETURNS UUID AS $$
DECLARE
  new_record_id UUID;
BEGIN
  INSERT INTO analytics (
    store_id, 
    date,
    page_views,
    unique_visitors,
    product_clicks
  )
  VALUES (
    p_store_id,
    p_date,
    0,
    0,
    0
  )
  ON CONFLICT (store_id, date) 
  DO NOTHING
  RETURNING id INTO new_record_id;

  IF new_record_id IS NULL THEN
    SELECT id INTO new_record_id
    FROM analytics
    WHERE store_id = p_store_id AND date = p_date;
  END IF;
  
  RETURN new_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing analytics policies
DROP POLICY IF EXISTS "Enable all access for store owners and admin" ON analytics;
DROP POLICY IF EXISTS "Allow analytics access" ON analytics;

-- Create more permissive analytics policies
CREATE POLICY "Allow analytics access"
  ON analytics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Reset analytics table permissions
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
GRANT ALL ON analytics TO authenticated;

-- Ensure the analytics table has the correct UUID primary key setup
ALTER TABLE analytics ALTER COLUMN id SET DEFAULT gen_random_uuid();