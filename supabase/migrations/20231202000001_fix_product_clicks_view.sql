-- Drop the old view first
DROP VIEW IF EXISTS product_clicks_view;

-- Create the view with security definer to inherit RLS policies
CREATE VIEW product_clicks_view 
WITH (security_barrier = true)
AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.store_id,
  p.image_url,
  p.status,
  p.is_featured,
  p.created_at,
  p.updated_at,
  COALESCE(pc.count, 0) as click_count
FROM products p
LEFT JOIN product_clicks pc ON pc.product_id = p.id
GROUP BY 
  p.id,
  p.name,
  p.description,
  p.store_id,
  p.image_url,
  p.status,
  p.is_featured,
  p.created_at,
  p.updated_at;

-- Grant access to authenticated users
GRANT SELECT ON product_clicks_view TO authenticated;
