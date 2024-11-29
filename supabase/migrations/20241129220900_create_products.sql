-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    image_url TEXT,
    affiliate_link TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT product_name_length CHECK (char_length(name) >= 3)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view products of their stores" ON public.products
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = store_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY "Users can create products in their stores" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = store_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY "Users can update products in their stores" ON public.products
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = store_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete products in their stores" ON public.products
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.id = store_id
        AND s.user_id = auth.uid()
    ));

-- Add updated_at trigger
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

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

-- Grant permissions
GRANT ALL ON public.products TO postgres;
GRANT ALL ON public.products TO authenticated;
