-- Add category_type enum
CREATE TYPE public.category_type AS ENUM (
    'custom',
    'predefined'
);

-- Make store_id nullable and add type column to categories table
ALTER TABLE public.categories
ALTER COLUMN store_id DROP NOT NULL,
ADD COLUMN type category_type NOT NULL DEFAULT 'custom',
ADD COLUMN slug TEXT UNIQUE;

-- Add constraint to ensure custom categories have store_id
ALTER TABLE public.categories
ADD CONSTRAINT categories_store_id_check
CHECK (
    (type = 'predefined' AND store_id IS NULL) OR
    (type = 'custom' AND store_id IS NOT NULL)
);

-- Create predefined categories
INSERT INTO public.categories (name, description, type, slug, store_id) VALUES
('Best Sellers', 'Products with the highest sales', 'predefined', 'best-sellers', NULL),
('New Arrivals', 'Recently added products', 'predefined', 'new-arrivals', NULL),
('Featured', 'Hand-picked featured products', 'predefined', 'featured', NULL),
('On Sale', 'Products with active discounts', 'predefined', 'on-sale', NULL),
('Trending', 'Products gaining popularity', 'predefined', 'trending', NULL),
('Most Viewed', 'Products with highest view counts', 'predefined', 'most-viewed', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Update RLS policies to allow reading predefined categories
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.categories;
CREATE POLICY "Enable read access for authenticated users"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (
        type = 'predefined' OR
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = categories.store_id 
            AND stores.user_id = auth.uid()
        )
    );

-- Function to automatically assign products to predefined categories
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
        INSERT INTO products_categories (product_id, category_id)
        VALUES (NEW.id, new_arrival_id);
    END IF;

    -- Products with discounts go to On Sale
    IF NEW.discount_price IS NOT NULL AND NEW.discount_price > 0 THEN
        INSERT INTO products_categories (product_id, category_id)
        VALUES (NEW.id, on_sale_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Featured products
    IF NEW.is_featured = true THEN
        INSERT INTO products_categories (product_id, category_id)
        VALUES (NEW.id, featured_id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic category assignment
DROP TRIGGER IF EXISTS update_product_predefined_categories_trigger ON products;
CREATE TRIGGER update_product_predefined_categories_trigger
    AFTER INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_predefined_categories();

-- Add is_featured column to products if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'is_featured') THEN
        ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
END $$;
