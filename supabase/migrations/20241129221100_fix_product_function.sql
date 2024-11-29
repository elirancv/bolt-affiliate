-- Drop existing function
DROP FUNCTION IF EXISTS public.create_test_product(UUID, TEXT, TEXT, DECIMAL, TEXT);

-- Create a function to test product creation with fixed column references
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
    product_created_at TIMESTAMPTZ
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
        created_at AS product_created_at;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_test_product(UUID, TEXT, TEXT, DECIMAL, TEXT) TO authenticated;
