-- Drop existing analytics table and related objects
DROP TABLE IF EXISTS analytics CASCADE;
DROP FUNCTION IF EXISTS increment_product_clicks CASCADE;
DROP FUNCTION IF EXISTS increment_page_view CASCADE;

-- Create analytics table
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

-- Create RLS policy
CREATE POLICY "Allow analytics access for store owners and admins"
  ON analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin())
    )
  );

-- Create function to increment product clicks
CREATE OR REPLACE FUNCTION increment_product_clicks(p_store_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics (
    store_id,
    date,
    product_clicks,
    page_views,
    unique_visitors
  )
  VALUES (
    p_store_id,
    p_date,
    1,
    0,
    0
  )
  ON CONFLICT (store_id, date)
  DO UPDATE SET
    product_clicks = analytics.product_clicks + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment page views
CREATE OR REPLACE FUNCTION increment_page_view(p_store_id UUID, p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics (
    store_id,
    date,
    product_clicks,
    page_views,
    unique_visitors
  )
  VALUES (
    p_store_id,
    p_date,
    0,
    1,
    1
  )
  ON CONFLICT (store_id, date)
  DO UPDATE SET
    page_views = analytics.page_views + 1,
    unique_visitors = analytics.unique_visitors + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON analytics TO authenticated;
GRANT EXECUTE ON FUNCTION increment_product_clicks TO authenticated;
GRANT EXECUTE ON FUNCTION increment_page_view TO authenticated;