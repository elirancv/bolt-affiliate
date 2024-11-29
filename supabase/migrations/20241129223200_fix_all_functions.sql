-- Drop all existing functions first
DROP FUNCTION IF EXISTS public.get_user_feature_limits_v2();
DROP FUNCTION IF EXISTS public.get_top_products_with_clicks(TIMESTAMP WITH TIME ZONE, UUID[]);

-- Recreate get_user_feature_limits_v2 with proper return type
CREATE OR REPLACE FUNCTION public.get_user_feature_limits_v2()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_subscription_tier TEXT;
    v_result JSON;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Get user's subscription tier
    SELECT subscription_tier INTO v_subscription_tier
    FROM users
    WHERE id = v_user_id;
    
    -- Return limits based on subscription tier
    CASE v_subscription_tier
        WHEN 'free' THEN
            v_result := json_build_object(
                'max_stores', 1,
                'max_products_per_store', 10,
                'total_products_limit', 10,
                'analytics_retention_days', 7,
                'can_export_data', false,
                'subscription_tier', 'free'
            );
        WHEN 'pro' THEN
            v_result := json_build_object(
                'max_stores', 5,
                'max_products_per_store', 50,
                'total_products_limit', 250,
                'analytics_retention_days', 30,
                'can_export_data', true,
                'subscription_tier', 'pro'
            );
        WHEN 'business' THEN
            v_result := json_build_object(
                'max_stores', 20,
                'max_products_per_store', 200,
                'total_products_limit', 4000,
                'analytics_retention_days', 90,
                'can_export_data', true,
                'subscription_tier', 'business'
            );
        ELSE
            v_result := json_build_object(
                'max_stores', 1,
                'max_products_per_store', 10,
                'total_products_limit', 10,
                'analytics_retention_days', 7,
                'can_export_data', false,
                'subscription_tier', 'free'
            );
    END CASE;
    
    RETURN v_result;
END;
$$;

-- Recreate get_top_products_with_clicks with proper types
CREATE OR REPLACE FUNCTION public.get_top_products_with_clicks(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '7 days'),
    store_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    store_id UUID,
    store_name TEXT,
    total_views BIGINT,
    total_clicks BIGINT,
    conversion_rate NUMERIC(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH product_stats AS (
        SELECT 
            a.product_id,
            p.name as product_name,
            s.id as store_id,
            s.name as store_name,
            COALESCE(SUM(a.views), 0)::BIGINT as total_views,
            COALESCE(SUM(a.clicks), 0)::BIGINT as total_clicks
        FROM products p
        JOIN stores s ON p.store_id = s.id
        LEFT JOIN analytics a ON p.id = a.product_id
            AND a.date >= start_date::DATE
        WHERE 
            s.user_id = auth.uid()
            AND (store_ids IS NULL OR s.id = ANY(store_ids))
        GROUP BY 
            a.product_id,
            p.name,
            s.id,
            s.name
    )
    SELECT 
        ps.product_id,
        ps.product_name,
        ps.store_id,
        ps.store_name,
        ps.total_views,
        ps.total_clicks,
        CASE 
            WHEN ps.total_views > 0 
            THEN ROUND((ps.total_clicks::NUMERIC / ps.total_views * 100)::NUMERIC, 2)
            ELSE 0::NUMERIC 
        END as conversion_rate
    FROM product_stats ps
    ORDER BY ps.total_clicks DESC, ps.total_views DESC
    LIMIT 10;
END;
$$;

-- Fix analytics table permissions
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can update their own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can delete their own analytics" ON public.analytics;

ALTER TABLE public.analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Add updated RLS policies for analytics
CREATE POLICY "Analytics access policy"
    ON public.analytics
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM stores 
            WHERE user_id = auth.uid()
        )
    );
