-- Drop all existing functions first
DROP FUNCTION IF EXISTS public.get_user_feature_limits_v2();
DROP FUNCTION IF EXISTS public.get_top_products_with_clicks(TIMESTAMP WITH TIME ZONE, UUID[]);

-- Fix feature limits function
CREATE OR REPLACE FUNCTION public.get_user_feature_limits_v2()
RETURNS TABLE (
    max_stores INTEGER,
    total_products_limit INTEGER,
    max_products_per_store INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_tier TEXT;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO v_subscription_tier
    FROM public.users
    WHERE id = auth.uid();

    -- Return limits based on subscription tier
    CASE v_subscription_tier
        WHEN 'free' THEN
            RETURN QUERY SELECT 1, 10, 5;
        WHEN 'pro' THEN
            RETURN QUERY SELECT 5, 50, 20;
        WHEN 'business' THEN
            RETURN QUERY SELECT 20, 200, 50;
        ELSE
            -- Default to free tier limits
            RETURN QUERY SELECT 1, 10, 5;
    END CASE;
END;
$$;
