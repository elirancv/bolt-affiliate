-- Create a function to test store creation
CREATE OR REPLACE FUNCTION public.create_test_store(
    p_user_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.stores (user_id, name, description)
    VALUES (p_user_id, p_name, p_description)
    RETURNING id, name, description, created_at;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_test_store(UUID, TEXT, TEXT) TO authenticated;
