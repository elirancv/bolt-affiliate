-- Add category_id column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Update the product_clicks_view to include category_id
DROP VIEW IF EXISTS product_clicks_view CASCADE;

CREATE OR REPLACE VIEW product_clicks_view AS
SELECT 
    p.id,
    p.store_id,
    p.name,
    p.description,
    p.price,
    p.affiliate_url,
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
) pc ON p.id = pc.product_id;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
