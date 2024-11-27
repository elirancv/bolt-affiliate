-- Drop existing analytics table and related objects
DROP TABLE IF EXISTS analytics CASCADE;

-- Recreate analytics table with proper structure
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  page_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  product_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT analytics_store_date_key UNIQUE (store_id, date),
  CONSTRAINT analytics_page_views_check CHECK (page_views >= 0),
  CONSTRAINT analytics_unique_visitors_check CHECK (unique_visitors >= 0),
  CONSTRAINT analytics_product_clicks_check CHECK (product_clicks >= 0)
);

-- Create updated_at trigger
CREATE TRIGGER update_analytics_updated_at
  BEFORE UPDATE ON analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_analytics_store_id ON analytics(store_id);
CREATE INDEX idx_analytics_date ON analytics(date);
CREATE INDEX idx_analytics_store_date ON analytics(store_id, date);

-- Enable RLS
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policy
CREATE POLICY "Allow all authenticated access"
  ON analytics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON analytics TO authenticated;