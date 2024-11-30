-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy for viewing categories (anyone can view)
CREATE POLICY "Anyone can view categories"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert predefined categories
INSERT INTO public.categories (name, slug, type) VALUES
    ('Electronics', 'electronics', 'product'),
    ('Fashion', 'fashion', 'product'),
    ('Home & Garden', 'home-garden', 'product'),
    ('Books', 'books', 'product'),
    ('Sports & Outdoors', 'sports-outdoors', 'product'),
    ('Health & Beauty', 'health-beauty', 'product'),
    ('Toys & Games', 'toys-games', 'product'),
    ('Automotive', 'automotive', 'product'),
    ('Pet Supplies', 'pet-supplies', 'product'),
    ('Food & Beverages', 'food-beverages', 'product');

-- Grant permissions
GRANT ALL ON public.categories TO postgres;
GRANT SELECT ON public.categories TO authenticated;
