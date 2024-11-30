-- Drop existing enum if it exists
DROP TYPE IF EXISTS category_type CASCADE;

-- Create category_type enum
CREATE TYPE category_type AS ENUM ('product', 'service', 'digital');

-- Create a temporary table to store the data
CREATE TEMP TABLE temp_categories AS SELECT * FROM public.categories;

-- Drop the existing table and its policies
DROP TABLE IF EXISTS public.categories CASCADE;

-- Recreate the table with the enum type
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type category_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Copy the data back
INSERT INTO public.categories (id, name, slug, type, created_at, updated_at)
SELECT id, name, slug, 'product'::category_type, created_at, updated_at
FROM temp_categories;

-- Drop the temporary table
DROP TABLE temp_categories;

-- Add RLS policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy for viewing categories
CREATE POLICY "Anyone can view categories"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant permissions
GRANT ALL ON public.categories TO postgres;
GRANT SELECT ON public.categories TO authenticated;
