-- Drop existing functions
DROP FUNCTION IF EXISTS increment_product_clicks CASCADE;
DROP FUNCTION IF EXISTS increment_page_view CASCADE;

-- Create function to increment product clicks
CREATE OR REPLACE FUNCTION public.increment_product_clicks(p_store_id UUID, p_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create function to increment page views
CREATE OR REPLACE FUNCTION public.increment_page_view(p_store_id UUID, p_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_product_clicks TO authenticated;
GRANT EXECUTE ON FUNCTION increment_page_view TO authenticated;