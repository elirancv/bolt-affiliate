-- Create type for feature limits
CREATE TYPE public.feature_limits AS (
    max_stores INTEGER,
    max_products_per_store INTEGER,
    max_file_size_mb INTEGER
);

-- Create function to get user feature limits
CREATE OR REPLACE FUNCTION public.get_user_feature_limits_v2()
RETURNS public.feature_limits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription_tier TEXT;
    v_limits public.feature_limits;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO v_subscription_tier
    FROM public.users
    WHERE id = auth.uid();
    
    -- Set limits based on subscription tier
    CASE v_subscription_tier
        WHEN 'free' THEN
            v_limits := (1, 10, 5)::public.feature_limits;
        WHEN 'pro' THEN
            v_limits := (5, 50, 20)::public.feature_limits;
        WHEN 'business' THEN
            v_limits := (20, 200, 50)::public.feature_limits;
        ELSE
            v_limits := (1, 10, 5)::public.feature_limits; -- Default to free tier limits
    END CASE;
    
    RETURN v_limits;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_feature_limits_v2() TO authenticated;
