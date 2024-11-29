-- Add missing columns to products table
DO $$ 
BEGIN
    -- Add discount_price if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'discount_price') THEN
        ALTER TABLE public.products ADD COLUMN discount_price DECIMAL(10,2);
    END IF;

    -- Add is_featured if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'is_featured') THEN
        ALTER TABLE public.products ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_product_predefined_categories_trigger ON products;
DROP FUNCTION IF EXISTS public.update_product_predefined_categories();

-- Recreate the function with proper field checks
CREATE OR REPLACE FUNCTION public.update_product_predefined_categories()
RETURNS TRIGGER AS $$
DECLARE
    best_seller_id UUID;
    new_arrival_id UUID;
    featured_id UUID;
    on_sale_id UUID;
    trending_id UUID;
    most_viewed_id UUID;
BEGIN
    -- Get predefined category IDs
    SELECT id INTO best_seller_id FROM categories WHERE slug = 'best-sellers' LIMIT 1;
    SELECT id INTO new_arrival_id FROM categories WHERE slug = 'new-arrivals' LIMIT 1;
    SELECT id INTO featured_id FROM categories WHERE slug = 'featured' LIMIT 1;
    SELECT id INTO on_sale_id FROM categories WHERE slug = 'on-sale' LIMIT 1;
    SELECT id INTO trending_id FROM categories WHERE slug = 'trending' LIMIT 1;
    SELECT id INTO most_viewed_id FROM categories WHERE slug = 'most-viewed' LIMIT 1;

    -- New products go to New Arrivals
    IF TG_OP = 'INSERT' THEN
        IF new_arrival_id IS NOT NULL THEN
            INSERT INTO products_categories (product_id, category_id)
            VALUES (NEW.id, new_arrival_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- Products with discounts go to On Sale
    IF NEW.discount_price IS NOT NULL AND NEW.discount_price > 0 THEN
        IF on_sale_id IS NOT NULL THEN
            INSERT INTO products_categories (product_id, category_id)
            VALUES (NEW.id, on_sale_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- Featured products
    IF NEW.is_featured = true THEN
        IF featured_id IS NOT NULL THEN
            INSERT INTO products_categories (product_id, category_id)
            VALUES (NEW.id, featured_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic category assignment
CREATE TRIGGER update_product_predefined_categories_trigger
    AFTER INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_predefined_categories();
