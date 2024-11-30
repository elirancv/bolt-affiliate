-- Drop and recreate the get_admin_stats function with proper RPC configuration
DROP FUNCTION IF EXISTS public.get_admin_stats(TEXT);

CREATE OR REPLACE FUNCTION public.get_admin_stats(time_range TEXT DEFAULT '24h')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_date TIMESTAMP;
    v_result JSON;
BEGIN
    -- Set the start date based on time range
    v_start_date := 
        CASE time_range
            WHEN '24h' THEN NOW() - INTERVAL '24 hours'
            WHEN '7d' THEN NOW() - INTERVAL '7 days'
            WHEN '30d' THEN NOW() - INTERVAL '30 days'
            WHEN '90d' THEN NOW() - INTERVAL '90 days'
            ELSE '1970-01-01'::TIMESTAMP -- 'all' time range
        END;

    -- Get all stats in a single query
    WITH user_stats AS (
        SELECT 
            COUNT(DISTINCT u.id)::INTEGER as total_users,
            COUNT(DISTINCT CASE 
                WHEN COALESCE(u.last_sign_in_at, u.created_at) >= v_start_date THEN u.id 
                ELSE NULL 
            END)::INTEGER as active_users
        FROM public.users u
    ),
    store_stats AS (
        SELECT 
            COUNT(DISTINCT s.id)::INTEGER as total_stores,
            COUNT(DISTINCT CASE 
                WHEN s.updated_at >= v_start_date THEN s.id 
                ELSE NULL 
            END)::INTEGER as active_stores
        FROM public.stores s
    ),
    product_stats AS (
        SELECT 
            COUNT(DISTINCT p.id)::INTEGER as total_products,
            COUNT(DISTINCT CASE 
                WHEN p.updated_at >= v_start_date THEN p.id 
                ELSE NULL 
            END)::INTEGER as active_products
        FROM public.products p
    ),
    view_stats AS (
        SELECT COUNT(*)::INTEGER as total_views
        FROM public.product_views pv
        WHERE pv.viewed_at >= v_start_date
    ),
    click_stats AS (
        SELECT COUNT(*)::INTEGER as total_clicks
        FROM public.product_clicks pc
        WHERE pc.clicked_at >= v_start_date
    ),
    users_array AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'id', u.id,
                    'email', u.email,
                    'created_at', u.created_at,
                    'subscription_tier', COALESCE(u.subscription_tier, 'free'),
                    'is_admin', COALESCE(u.is_admin, false)
                ) ORDER BY u.created_at DESC
            ) as users
        FROM public.users u
    ),
    users_by_tier AS (
        SELECT 
            jsonb_object_agg(
                COALESCE(subscription_tier, 'free'),
                COUNT(*)::INTEGER
            ) as tiers
        FROM public.users
        GROUP BY COALESCE(subscription_tier, 'free')
    )
    SELECT 
        json_build_object(
            'total_users', us.total_users,
            'active_users', us.active_users,
            'total_stores', ss.total_stores,
            'active_stores', ss.active_stores,
            'total_products', ps.total_products,
            'active_products', ps.active_products,
            'total_views', vs.total_views,
            'total_clicks', cs.total_clicks,
            'conversion_rate', 
                CASE 
                    WHEN vs.total_views > 0 THEN 
                        ROUND((cs.total_clicks::DECIMAL / vs.total_views::DECIMAL) * 100, 2)
                    ELSE 0 
                END,
            'users_by_tier', COALESCE(ut.tiers, '{}'::jsonb),
            'users', COALESCE(ua.users, '[]'::jsonb)
        ) INTO v_result
    FROM user_stats us
    CROSS JOIN store_stats ss
    CROSS JOIN product_stats ps
    CROSS JOIN view_stats vs
    CROSS JOIN click_stats cs
    CROSS JOIN users_array ua
    CROSS JOIN users_by_tier ut;

    -- Log the result for debugging
    RAISE LOG 'get_admin_stats result: %', v_result;

    RETURN v_result;
END;
$$;

-- Ensure proper permissions are set
REVOKE ALL ON FUNCTION public.get_admin_stats(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO service_role;

-- Create a test function to verify RPC access
CREATE OR REPLACE FUNCTION public.test_admin_stats()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT public.get_admin_stats('all') INTO v_result;
    RAISE LOG 'Test admin stats result: %', v_result;
    RETURN 'Test completed - check logs for results';
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_admin_stats() TO authenticated;
