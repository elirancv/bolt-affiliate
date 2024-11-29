-- Function to ensure test user exists
CREATE OR REPLACE FUNCTION public.ensure_test_user(
    p_user_id UUID,
    p_email TEXT,
    p_subscription_tier TEXT DEFAULT 'free'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, subscription_tier)
    VALUES (p_user_id, p_email, p_subscription_tier)
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        subscription_tier = EXCLUDED.subscription_tier,
        updated_at = NOW();
    
    RETURN p_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.ensure_test_user(UUID, TEXT, TEXT) TO authenticated;
