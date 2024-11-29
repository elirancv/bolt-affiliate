-- Create or replace the get_user_feature_limits_v2 function
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
    WHERE id = user_id;

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
