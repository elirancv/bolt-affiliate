-- Drop the existing view
DROP VIEW IF EXISTS product_clicks_view CASCADE;

-- Add category_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id);
    END IF;
END $$;

-- Recreate the view with all necessary columns and security check
CREATE OR REPLACE VIEW product_clicks_view AS
SELECT 
    p.id,
    p.store_id,
    p.name,
    p.description,
    p.price,
    p.affiliate_url,
    p.product_url,
    p.image_urls,
    p.category_id,
    p.is_active,
    p.created_at,
    p.updated_at,
    COALESCE(pc.click_count, 0) as click_count
FROM products p
LEFT JOIN (
    SELECT product_id, COUNT(*) as click_count
    FROM product_clicks
    GROUP BY product_id
) pc ON p.id = pc.product_id
WHERE EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = p.store_id
    AND s.user_id = auth.uid()
);

-- Grant access to the view for authenticated users
GRANT SELECT ON product_clicks_view TO authenticated;
