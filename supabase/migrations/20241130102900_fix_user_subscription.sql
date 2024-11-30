-- Update the subscription tier for the user
UPDATE public.user_subscriptions
SET tier = 'pro',
    updated_at = NOW()
WHERE user_id = 'b305df00-94fb-42c5-b7fc-5caf9399b129';

-- Verify the feature limits function returns correct values
CREATE OR REPLACE FUNCTION public.get_user_feature_limits_v2()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
    user_tier text;
    limits json;
BEGIN
    -- Get the authenticated user's ID
    user_id := auth.uid();
    
    -- Get the user's subscription tier
    SELECT tier INTO user_tier
    FROM user_subscriptions
    WHERE user_id = user_id
    AND active = true;

    -- Set default tier if none found
    IF user_tier IS NULL THEN
        user_tier := 'free';
    END IF;

    -- Define limits based on tier
    CASE user_tier
        WHEN 'free' THEN
            limits := json_build_object(
                'max_stores', 1,
                'total_products_limit', 10,
                'analytics_retention_days', 7
            );
        WHEN 'pro' THEN
            limits := json_build_object(
                'max_stores', 3,
                'total_products_limit', 100,
                'analytics_retention_days', 30
            );
        WHEN 'business' THEN
            limits := json_build_object(
                'max_stores', 10,
                'total_products_limit', 1000,
                'analytics_retention_days', 90
            );
        ELSE
            limits := json_build_object(
                'max_stores', 1,
                'total_products_limit', 10,
                'analytics_retention_days', 7
            );
    END CASE;

    RETURN limits;
END;
$$;
