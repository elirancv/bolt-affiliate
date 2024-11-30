-- Drop existing function
DROP FUNCTION IF EXISTS public.get_user_dashboard_summary();

-- Create a new function that properly returns feature limits
CREATE OR REPLACE FUNCTION public.get_user_dashboard_summary()
RETURNS json[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id uuid;
    user_tier text;
    stores_limit integer;
    products_limit integer;
    analytics_days integer;
    total_stores integer;
    total_products integer;
    result json;
BEGIN
    -- Get the authenticated user's ID
    user_id := auth.uid();
    
    -- Get the user's subscription tier
    SELECT tier INTO user_tier
    FROM user_subscriptions
    WHERE user_id = user_id
    AND active = true;

    -- Set limits based on tier
    CASE user_tier
        WHEN 'free' THEN
            stores_limit := 1;
            products_limit := 10;
            analytics_days := 7;
        WHEN 'pro' THEN
            stores_limit := 3;
            products_limit := 100;
            analytics_days := 30;
        WHEN 'business' THEN
            stores_limit := 10;
            products_limit := 1000;
            analytics_days := 90;
        ELSE
            stores_limit := 1;
            products_limit := 10;
            analytics_days := 7;
    END CASE;

    -- Get current usage
    SELECT COUNT(*) INTO total_stores
    FROM stores
    WHERE user_id = auth.uid();

    SELECT COUNT(*) INTO total_products
    FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE s.user_id = auth.uid();

    -- Build result
    result := json_build_object(
        'stores_limit', stores_limit,
        'products_limit', products_limit,
        'analytics_retention_days', analytics_days,
        'total_stores', total_stores,
        'total_products', total_products,
        'subscription_tier', user_tier
    );

    RETURN ARRAY[result];
END;
$$;
