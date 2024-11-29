-- Create a function to view store details
CREATE OR REPLACE FUNCTION public.get_store_details(store_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
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
        s.id,
        s.name,
        s.description,
        s.logo_url,
        s.website_url,
        s.is_active,
        s.created_at,
        s.updated_at
    FROM public.stores s
    WHERE s.id = store_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_store_details(UUID) TO authenticated;
