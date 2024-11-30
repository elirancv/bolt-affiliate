-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.product_categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.product_categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.categories;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.categories;

-- Drop the existing foreign key if it exists
ALTER TABLE IF EXISTS public.products 
DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT,
    slug TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create a junction table for products and categories if it doesn't exist
CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (product_id, category_id)
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for product_categories
CREATE POLICY "Enable read access for all users" ON public.product_categories
    FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.product_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.stores s ON p.store_id = s.id
            WHERE p.id = product_categories.product_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for authenticated users" ON public.product_categories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.stores s ON p.store_id = s.id
            WHERE p.id = product_categories.product_id
            AND s.user_id = auth.uid()
        )
    );

-- Add RLS policies for categories
CREATE POLICY "Enable read access for all users" ON public.categories
    FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.categories
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.products;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.products;

-- Drop existing view
DROP VIEW IF EXISTS product_details;

-- Create view for product details with security barrier
CREATE VIEW product_details WITH (security_barrier) AS
SELECT 
    p.id,
    p.store_id,
    p.name,
    p.description,
    p.price,
    p.sale_price,
    p.product_url,
    p.affiliate_url,
    p.image_urls,
    p.status,
    p.is_featured,
    p.created_at,
    p.updated_at,
    s.name as store_name,
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'type', c.type,
                'slug', c.slug
            )
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'::jsonb
    ) as categories
FROM public.products p
LEFT JOIN public.stores s ON p.store_id = s.id
LEFT JOIN public.product_categories pc ON p.id = pc.product_id
LEFT JOIN public.categories c ON pc.category_id = c.id
WHERE EXISTS (
    SELECT 1 FROM public.stores s2
    WHERE s2.id = p.store_id
    AND s2.user_id = auth.uid()
)
GROUP BY 
    p.id,
    p.store_id,
    p.name,
    p.description,
    p.price,
    p.sale_price,
    p.product_url,
    p.affiliate_url,
    p.image_urls,
    p.status,
    p.is_featured,
    p.created_at,
    p.updated_at,
    s.name;

-- Grant permissions on the view
GRANT SELECT ON product_details TO authenticated;
GRANT SELECT ON product_details TO anon;

-- Add RLS policy for products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.products
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = store_id
            AND s.user_id = auth.uid()
        )
    );
