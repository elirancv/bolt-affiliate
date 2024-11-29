-- Create a function to test product creation
CREATE OR REPLACE FUNCTION public.create_test_product(
    p_store_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_price DECIMAL DEFAULT NULL,
    p_affiliate_link TEXT DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_description TEXT,
    product_price DECIMAL,
    product_affiliate_link TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.products (
        store_id, 
        name, 
        description, 
        price, 
        affiliate_link
    )
    VALUES (
        p_store_id, 
        p_name, 
        p_description, 
        p_price, 
        p_affiliate_link
    )
    RETURNING 
        id AS product_id,
        name AS product_name,
        description AS product_description,
        price AS product_price,
        affiliate_link AS product_affiliate_link,
        created_at;
END;
$$;

-- Create a function to view products in a store
CREATE OR REPLACE FUNCTION public.get_store_products(p_store_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    price DECIMAL,
    image_url TEXT,
    affiliate_link TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.affiliate_link,
        p.is_active,
        p.created_at,
        p.updated_at
    FROM public.products p
    WHERE p.store_id = p_store_id
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_test_product(UUID, TEXT, TEXT, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_products(UUID) TO authenticated;
