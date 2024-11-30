-- Create a debug function to check user data
CREATE OR REPLACE FUNCTION public.debug_user_data()
RETURNS TABLE (
    auth_uid UUID,
    user_exists BOOLEAN,
    store_count INTEGER,
    product_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as auth_uid,
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid()) as user_exists,
        (SELECT COUNT(*)::INTEGER FROM stores WHERE user_id = auth.uid()) as store_count,
        (SELECT COUNT(*)::INTEGER FROM products p JOIN stores s ON p.store_id = s.id WHERE s.user_id = auth.uid()) as product_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.debug_user_data() TO authenticated;
