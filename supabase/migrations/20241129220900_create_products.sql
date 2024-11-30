-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    image_urls TEXT[],
    affiliate_link TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    category_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy for viewing products (anyone can view active products)
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT
    USING (is_active = true);

-- Policy for store owners to manage their products
CREATE POLICY "Store owners can manage their products" ON public.products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = store_id
            AND s.user_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to check product limits before insert
CREATE OR REPLACE FUNCTION public.check_product_limit()
RETURNS TRIGGER AS $$
DECLARE
    product_count INTEGER;
    product_limit INTEGER;
    user_tier TEXT;
    store_owner_id UUID;
BEGIN
    -- Get store owner's ID
    SELECT user_id INTO store_owner_id
    FROM public.stores
    WHERE id = NEW.store_id;

    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM public.users
    WHERE id = store_owner_id;

    -- Calculate product limit based on tier
    product_limit := CASE user_tier
        WHEN 'free' THEN 100
        WHEN 'pro' THEN 1000
        WHEN 'enterprise' THEN -1  -- unlimited
        ELSE 0
    END;

    -- Count existing products in this store
    SELECT COUNT(*) INTO product_count
    FROM public.products
    WHERE store_id = NEW.store_id;

    -- Check if store can have more products
    IF product_limit != -1 AND product_count >= product_limit THEN
        RAISE EXCEPTION 'Product limit reached for your subscription tier';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to check limits before insert
CREATE TRIGGER check_product_limit
    BEFORE INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_product_limit();

-- Create function to create a test product
CREATE OR REPLACE FUNCTION public.create_test_product(
    p_store_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_price DECIMAL(10,2) DEFAULT NULL,
    p_affiliate_link TEXT DEFAULT NULL,
    p_image_urls TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_description TEXT,
    product_price DECIMAL(10,2),
    product_image_urls TEXT[],
    product_affiliate_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the user owns the store
    IF NOT EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = p_store_id
        AND s.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have permission to create products in this store';
    END IF;

    RETURN QUERY
    INSERT INTO products (
        store_id, 
        name, 
        description, 
        price, 
        affiliate_link,
        image_urls
    )
    VALUES (
        p_store_id, 
        p_name, 
        p_description, 
        p_price, 
        p_affiliate_link,
        p_image_urls
    )
    RETURNING 
        id AS product_id,
        name AS product_name,
        description AS product_description,
        price AS product_price,
        image_urls AS product_image_urls,
        affiliate_link AS product_affiliate_link,
        created_at;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.products TO postgres;
GRANT ALL ON public.products TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_test_product TO authenticated;
