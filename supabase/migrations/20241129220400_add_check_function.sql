-- Create a function to check if user exists
CREATE OR REPLACE FUNCTION public.check_user_exists(user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    subscription_tier TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.full_name, u.subscription_tier, u.created_at, u.updated_at
    FROM public.users u
    WHERE u.id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_user_exists(UUID) TO authenticated;
