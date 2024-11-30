-- Drop dependent views first
DROP VIEW IF EXISTS product_clicks_view CASCADE;

-- Recreate the view without image_url dependency
CREATE OR REPLACE VIEW product_clicks_view AS
SELECT 
    p.id,
    p.store_id,
    p.name,
    p.description,
    p.price,
    p.affiliate_url,
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

-- Now we can safely modify the products table
-- Rename affiliate_link to affiliate_url (if it hasn't been done already)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'affiliate_link'
    ) THEN
        ALTER TABLE public.products RENAME COLUMN affiliate_link TO affiliate_url;
    END IF;
END $$;

-- Add product_url column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_url TEXT;

-- Drop image_url column since we're using image_urls array
ALTER TABLE public.products DROP COLUMN IF EXISTS image_url;

-- Add image_urls array column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'image_urls') THEN
        ALTER TABLE public.products ADD COLUMN image_urls TEXT[] DEFAULT '{}';
    END IF;
END $$;
