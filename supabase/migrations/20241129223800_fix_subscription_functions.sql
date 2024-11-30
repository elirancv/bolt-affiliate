-- Drop dependent objects first
DROP VIEW IF EXISTS public.user_feature_limits CASCADE;

-- Drop all versions of the functions
DROP FUNCTION IF EXISTS public.get_current_subscription();
DROP FUNCTION IF EXISTS public.get_current_subscription(UUID);
DROP FUNCTION IF EXISTS public.get_user_feature_limits();
DROP FUNCTION IF EXISTS public.get_user_feature_limits(UUID);

-- Function to get current subscription
CREATE OR REPLACE FUNCTION public.get_current_subscription()
RETURNS SETOF user_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    RAISE NOTICE 'get_current_subscription - User ID: %', v_user_id;
    
    -- Insert a default subscription if none exists
    INSERT INTO user_subscriptions (user_id, tier, active, status)
    VALUES (v_user_id, 'free', true, 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RAISE NOTICE 'get_current_subscription - Default subscription inserted or exists';

    RETURN QUERY
    SELECT *
    FROM user_subscriptions s
    WHERE s.user_id = v_user_id
    AND s.active = true
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    RAISE NOTICE 'get_current_subscription - Query completed';
END;
$$;

-- Function to get user feature limits
CREATE OR REPLACE FUNCTION public.get_user_feature_limits()
RETURNS TABLE (
    max_stores INTEGER,
    total_products_limit INTEGER,
    analytics_retention_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_tier text;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    RAISE NOTICE 'get_user_feature_limits - User ID: %', v_user_id;
    
    -- Get the user's current subscription tier
    SELECT s.tier INTO v_tier
    FROM user_subscriptions s
    WHERE s.user_id = v_user_id
    AND s.active = true
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    RAISE NOTICE 'get_user_feature_limits - Retrieved tier: %', v_tier;

    -- Set default tier if none found
    IF v_tier IS NULL THEN
        v_tier := 'free';
        RAISE NOTICE 'get_user_feature_limits - Using default tier: %', v_tier;
    END IF;

    -- Return feature limits based on tier
    RETURN QUERY
    SELECT 
        CASE 
            WHEN v_tier = 'free' THEN 1
            WHEN v_tier = 'pro' THEN 3
            WHEN v_tier = 'business' THEN 10
            ELSE 1
        END as max_stores,
        CASE 
            WHEN v_tier = 'free' THEN 10
            WHEN v_tier = 'pro' THEN 100
            WHEN v_tier = 'business' THEN 1000
            ELSE 10
        END as total_products_limit,
        CASE 
            WHEN v_tier = 'free' THEN 30
            WHEN v_tier = 'pro' THEN 90
            WHEN v_tier = 'business' THEN 365
            ELSE 30
        END as analytics_retention_days;
        
    RAISE NOTICE 'get_user_feature_limits - Limits generated for tier: %', v_tier;
END;
$$;

-- Create base materialized view for feature limits
DROP MATERIALIZED VIEW IF EXISTS public.user_feature_limits_base CASCADE;
CREATE MATERIALIZED VIEW public.user_feature_limits_base AS
SELECT 
    s.user_id,
    CASE 
        WHEN s.tier = 'free' THEN 1
        WHEN s.tier = 'pro' THEN 3
        WHEN s.tier = 'business' THEN 10
        ELSE 1
    END as max_stores,
    CASE 
        WHEN s.tier = 'free' THEN 10
        WHEN s.tier = 'pro' THEN 100
        WHEN s.tier = 'business' THEN 1000
        ELSE 10
    END as total_products_limit,
    CASE 
        WHEN s.tier = 'free' THEN 30
        WHEN s.tier = 'pro' THEN 90
        WHEN s.tier = 'business' THEN 365
        ELSE 30
    END as analytics_retention_days
FROM user_subscriptions s
WHERE s.active = true;

-- Create unique index for faster lookups
CREATE UNIQUE INDEX user_feature_limits_base_user_id_idx ON public.user_feature_limits_base (user_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_user_feature_limits()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_feature_limits_base;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh view when subscriptions change
DROP TRIGGER IF EXISTS refresh_user_feature_limits_trigger ON public.user_subscriptions;
CREATE TRIGGER refresh_user_feature_limits_trigger
    AFTER INSERT OR UPDATE OR DELETE
    ON public.user_subscriptions
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_user_feature_limits();

-- Create secure view on top of materialized view
DROP VIEW IF EXISTS public.user_feature_limits CASCADE;
CREATE VIEW public.user_feature_limits AS
SELECT 
    user_id,
    max_stores,
    total_products_limit,
    analytics_retention_days
FROM public.user_feature_limits_base
WHERE user_id = auth.uid();

-- Grant permissions
GRANT SELECT ON public.user_feature_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feature_limits() TO authenticated;

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW public.user_feature_limits_base;
