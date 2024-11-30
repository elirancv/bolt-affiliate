-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial categories
INSERT INTO public.categories (name, slug, description) VALUES
    ('Electronics', 'electronics', 'Electronic devices and accessories'),
    ('Fashion', 'fashion', 'Clothing, shoes, and accessories'),
    ('Home & Kitchen', 'home-kitchen', 'Home appliances and kitchen essentials'),
    ('Beauty & Personal Care', 'beauty-personal-care', 'Beauty products and personal care items'),
    ('Books', 'books', 'Books and digital content'),
    ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear'),
    ('Toys & Games', 'toys-games', 'Toys, games, and entertainment items'),
    ('Health & Wellness', 'health-wellness', 'Health supplements and wellness products'),
    ('Automotive', 'automotive', 'Car accessories and parts'),
    ('Pet Supplies', 'pet-supplies', 'Products for pets');

-- Add RLS policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access for all authenticated users"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow full access to service_role
CREATE POLICY "Allow full access to service_role"
    ON public.categories
    TO service_role
    USING (true)
    WITH CHECK (true);
