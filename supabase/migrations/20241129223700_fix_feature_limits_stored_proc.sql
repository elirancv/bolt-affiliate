-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_feature_limits_v2();

-- Create stored procedure version
CREATE OR REPLACE PROCEDURE public.get_user_feature_limits_v2()
LANGUAGE plpgsql
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

    -- Return the limits as a result
    RAISE NOTICE 'User limits: %', limits;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON PROCEDURE public.get_user_feature_limits_v2() TO authenticated;

-- Grant execute permission to anon users (if needed)
GRANT EXECUTE ON PROCEDURE public.get_user_feature_limits_v2() TO anon;

-- Create a view to expose the limits
CREATE OR REPLACE VIEW public.user_feature_limits AS
SELECT 
    auth.uid() as user_id,
    COALESCE(
        (SELECT tier FROM public.user_subscriptions WHERE id = auth.uid()),
        'free'
    ) as tier,
    CASE 
        WHEN tier = 'pro' THEN 
            jsonb_build_object(
                'max_stores', 3,
                'total_products_limit', 100,
                'analytics_retention_days', 30
            )
        WHEN tier = 'business' THEN 
            jsonb_build_object(
                'max_stores', 10,
                'total_products_limit', 1000,
                'analytics_retention_days', 90
            )
        ELSE 
            jsonb_build_object(
                'max_stores', 1,
                'total_products_limit', 10,
                'analytics_retention_days', 7
            )
    END as limits
FROM (
    SELECT COALESCE(
        (SELECT tier FROM public.user_subscriptions WHERE id = auth.uid()),
        'free'
    ) as tier
) t;

-- Grant select permission on the view
GRANT SELECT ON public.user_feature_limits TO authenticated;
GRANT SELECT ON public.user_feature_limits TO anon;
