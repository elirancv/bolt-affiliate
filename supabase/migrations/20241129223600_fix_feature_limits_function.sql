-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.get_user_feature_limits_v2();

-- Create the function with proper schema and permissions
CREATE OR REPLACE FUNCTION public.get_user_feature_limits_v2()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id uuid;
    user_tier text;
    limits jsonb;
BEGIN
    -- Get the authenticated user's ID
    user_id := auth.uid();
    
    -- Get the user's subscription tier, defaulting to 'free' if not found
    SELECT COALESCE(tier, 'free') INTO user_tier
    FROM public.user_subscriptions
    WHERE id = user_id;

    -- If no subscription found, create one with free tier
    IF user_tier IS NULL THEN
        INSERT INTO public.user_subscriptions (id, tier)
        VALUES (user_id, 'free')
        ON CONFLICT (id) DO NOTHING;
        user_tier := 'free';
    END IF;

    -- Define limits based on tier
    CASE user_tier
        WHEN 'free' THEN
            limits := '{"max_stores": 1, "total_products_limit": 10, "analytics_retention_days": 7}'::jsonb;
        WHEN 'pro' THEN
            limits := '{"max_stores": 3, "total_products_limit": 100, "analytics_retention_days": 30}'::jsonb;
        WHEN 'business' THEN
            limits := '{"max_stores": 10, "total_products_limit": 1000, "analytics_retention_days": 90}'::jsonb;
        ELSE
            limits := '{"max_stores": 1, "total_products_limit": 10, "analytics_retention_days": 7}'::jsonb;
    END CASE;

    RETURN limits;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_feature_limits_v2() TO authenticated;

-- Grant execute permission to anon users (if needed)
GRANT EXECUTE ON FUNCTION public.get_user_feature_limits_v2() TO anon;

-- Ensure the function is accessible via the REST API
COMMENT ON FUNCTION public.get_user_feature_limits_v2() IS 'Get user feature limits based on subscription tier';

-- Insert a default subscription for the current user if not exists
-- INSERT INTO public.user_subscriptions (id, tier)
-- SELECT auth.uid(), 'free'
-- WHERE NOT EXISTS (
--     SELECT 1 FROM public.user_subscriptions WHERE id = auth.uid()
-- );
