-- Rename affiliate_link to affiliate_url
ALTER TABLE public.products RENAME COLUMN affiliate_link TO affiliate_url;

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
