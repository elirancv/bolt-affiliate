-- Drop existing function
DROP FUNCTION IF EXISTS public.get_user_dashboard_summary();

-- Create a new function that properly handles user_id references
CREATE OR REPLACE FUNCTION public.get_user_dashboard_summary()
RETURNS json[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_user_tier text;
    v_stores_limit integer;
    v_products_limit integer;
    v_analytics_days integer;
    v_total_stores integer;
    v_total_products integer;
    v_result json;
BEGIN
    -- Get the authenticated user's ID
    v_user_id := auth.uid();
    
    -- Get the user's subscription tier
    SELECT tier INTO v_user_tier
    FROM user_subscriptions us
    WHERE us.user_id = v_user_id
    AND us.active = true;

    -- Set limits based on tier
    CASE v_user_tier
        WHEN 'free' THEN
            v_stores_limit := 1;
            v_products_limit := 10;
            v_analytics_days := 7;
        WHEN 'pro' THEN
            v_stores_limit := 3;
            v_products_limit := 100;
            v_analytics_days := 30;
        WHEN 'business' THEN
            v_stores_limit := 10;
            v_products_limit := 1000;
            v_analytics_days := 90;
        ELSE
            v_stores_limit := 1;
            v_products_limit := 10;
            v_analytics_days := 7;
    END CASE;

    -- Get current usage with explicit table aliases
    SELECT COUNT(*) INTO v_total_stores
    FROM stores s
    WHERE s.user_id = v_user_id;

    SELECT COUNT(*) INTO v_total_products
    FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE s.user_id = v_user_id;

    -- Build result
    v_result := json_build_object(
        'stores_limit', v_stores_limit,
        'products_limit', v_products_limit,
        'analytics_retention_days', v_analytics_days,
        'total_stores', v_total_stores,
        'total_products', v_total_products,
        'subscription_tier', v_user_tier
    );

    RETURN ARRAY[v_result];
END;
$$;
