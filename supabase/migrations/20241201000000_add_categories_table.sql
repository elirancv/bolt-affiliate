-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own store's categories
CREATE POLICY "Users can view their store categories"
    ON public.categories
    FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to insert categories for their stores
CREATE POLICY "Users can create categories for their stores"
    ON public.categories
    FOR INSERT
    WITH CHECK (
        store_id IN (
            SELECT id FROM stores 
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to update their store categories
CREATE POLICY "Users can update their store categories"
    ON public.categories
    FOR UPDATE
    USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to delete their store categories
CREATE POLICY "Users can delete their store categories"
    ON public.categories
    FOR DELETE
    USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE user_id = auth.uid()
        )
    );

-- Add products_categories junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.products_categories (
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (product_id, category_id)
);

-- Add RLS policies for products_categories
ALTER TABLE public.products_categories ENABLE ROW LEVEL SECURITY;

-- Allow users to view product categories relationships
CREATE POLICY "Users can view their product categories"
    ON public.products_categories
    FOR SELECT
    USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN stores s ON s.id = p.store_id
            WHERE s.user_id = auth.uid()
        )
    );

-- Allow users to manage product categories relationships
CREATE POLICY "Users can manage their product categories"
    ON public.products_categories
    FOR ALL
    USING (
        product_id IN (
            SELECT p.id FROM products p
            JOIN stores s ON s.id = p.store_id
            WHERE s.user_id = auth.uid()
        )
    );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);
CREATE INDEX IF NOT EXISTS idx_products_categories_product_id ON public.products_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_products_categories_category_id ON public.products_categories(category_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
