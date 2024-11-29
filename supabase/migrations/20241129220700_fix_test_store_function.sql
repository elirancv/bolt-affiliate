-- Drop the existing function
DROP FUNCTION IF EXISTS public.create_test_store(UUID, TEXT, TEXT);

-- Fix the ambiguous column reference
CREATE OR REPLACE FUNCTION public.create_test_store(
    p_user_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
    store_id UUID,
    store_name TEXT,
    store_description TEXT,
    store_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.stores (user_id, name, description)
    VALUES (p_user_id, p_name, p_description)
    RETURNING id AS store_id, 
              name AS store_name, 
              description AS store_description, 
              created_at AS store_created_at;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_test_store(UUID, TEXT, TEXT) TO authenticated;
