-- Drop existing function
DROP FUNCTION IF EXISTS public.get_admin_stats(text);

-- Create the function with CTEs to avoid nested aggregates
CREATE OR REPLACE FUNCTION public.get_admin_stats(time_range TEXT DEFAULT '24h')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_date TIMESTAMP;
    v_result json;
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

    WITH user_counts AS (
        SELECT 
            COUNT(*)::INTEGER as total_users,
            COUNT(DISTINCT CASE 
                WHEN COALESCE(last_sign_in_at, created_at) >= v_start_date THEN id 
                END)::INTEGER as active_users
        FROM public.users
    ),
    store_counts AS (
        SELECT 
            COUNT(*)::INTEGER as total_stores,
            COUNT(DISTINCT CASE 
                WHEN updated_at >= v_start_date THEN id 
                END)::INTEGER as active_stores
        FROM public.stores
    ),
    product_counts AS (
        SELECT 
            COUNT(*)::INTEGER as total_products,
            COUNT(DISTINCT CASE 
                WHEN updated_at >= v_start_date THEN id 
                END)::INTEGER as active_products
        FROM public.products
    ),
    view_counts AS (
        SELECT COUNT(*)::INTEGER as total_views
        FROM public.product_views
        WHERE viewed_at >= v_start_date
    ),
    click_counts AS (
        SELECT COUNT(*)::INTEGER as total_clicks
        FROM public.product_clicks
        WHERE clicked_at >= v_start_date
    ),
    tier_counts AS (
        SELECT jsonb_object_agg(
            COALESCE(tier, 'free'),
            count::INTEGER
        ) as tiers
        FROM (
            SELECT 
                COALESCE(subscription_tier, 'free') as tier,
                COUNT(*) as count
            FROM public.users
            GROUP BY COALESCE(subscription_tier, 'free')
        ) t
    )
    SELECT json_build_object(
        'total_users', uc.total_users,
        'active_users', uc.active_users,
        'total_stores', sc.total_stores,
        'active_stores', sc.active_stores,
        'total_products', pc.total_products,
        'active_products', pc.active_products,
        'total_views', vc.total_views,
        'total_clicks', cc.total_clicks,
        'conversion_rate', 
            CASE 
                WHEN vc.total_views > 0 
                THEN ROUND((cc.total_clicks::DECIMAL / vc.total_views::DECIMAL) * 100, 2)
                ELSE 0 
            END,
        'users_by_tier', COALESCE(tc.tiers, '{}'::jsonb)
    ) INTO v_result
    FROM user_counts uc
    CROSS JOIN store_counts sc
    CROSS JOIN product_counts pc
    CROSS JOIN view_counts vc
    CROSS JOIN click_counts cc
    CROSS JOIN tier_counts tc;

    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO service_role;
