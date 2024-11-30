-- Verify and fix RPC function permissions
DO $$
DECLARE
    v_function_exists BOOLEAN;
BEGIN
    -- Check if the function exists
    SELECT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'get_admin_stats'
    ) INTO v_function_exists;

    IF v_function_exists THEN
        RAISE LOG 'get_admin_stats function exists';
    ELSE
        RAISE LOG 'get_admin_stats function does NOT exist';
    END IF;

    -- Drop and recreate the function with proper schema qualification
    DROP FUNCTION IF EXISTS public.get_admin_stats(TEXT);

    CREATE OR REPLACE FUNCTION public.get_admin_stats(time_range TEXT DEFAULT '24h')
    RETURNS TABLE (
        total_users INTEGER,
        active_users INTEGER,
        total_stores INTEGER,
        active_stores INTEGER,
        total_products INTEGER,
        active_products INTEGER,
        total_views INTEGER,
        total_clicks INTEGER,
        conversion_rate DECIMAL,
        users_by_tier JSONB,
        users JSONB
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        v_start_date TIMESTAMP;
        v_users_count INTEGER;
        v_stores_count INTEGER;
        v_products_count INTEGER;
        v_views_count INTEGER;
        v_clicks_count INTEGER;
        v_users_array JSONB;
        v_users_by_tier JSONB;
    BEGIN
        -- Debug: Log function start
        RAISE LOG 'get_admin_stats starting with time_range: %', time_range;

        -- Set the start date based on time range
        v_start_date := 
            CASE time_range
                WHEN '24h' THEN NOW() - INTERVAL '24 hours'
                WHEN '7d' THEN NOW() - INTERVAL '7 days'
                WHEN '30d' THEN NOW() - INTERVAL '30 days'
                WHEN '90d' THEN NOW() - INTERVAL '90 days'
                ELSE '1970-01-01'::TIMESTAMP -- 'all' time range
            END;

        -- Debug: Log start date
        RAISE LOG 'Using start date: %', v_start_date;

        -- Get users array with debug logging
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'id', u.id,
                    'email', u.email,
                    'created_at', u.created_at,
                    'subscription_tier', COALESCE(u.subscription_tier, 'free'),
                    'is_admin', COALESCE(u.is_admin, false)
                ) ORDER BY u.created_at DESC
            )
        INTO v_users_array
        FROM public.users u;
        
        RAISE LOG 'Users array: %', v_users_array;

        -- Get user tiers with debug
        WITH tier_counts AS (
            SELECT 
                COALESCE(subscription_tier, 'free') as tier,
                COUNT(*)::INTEGER as count
            FROM public.users
            GROUP BY COALESCE(subscription_tier, 'free')
        )
        SELECT jsonb_object_agg(tier, count) INTO v_users_by_tier
        FROM tier_counts;

        RAISE LOG 'Users by tier: %', v_users_by_tier;

        -- Return the final results with debug logging for each CTE
        RETURN QUERY
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
        debug_stats AS (
            SELECT 
                us.total_users,
                us.active_users,
                ss.total_stores,
                ss.active_stores,
                ps.total_products,
                ps.active_products,
                vs.total_views,
                cs.total_clicks
            FROM user_stats us
            CROSS JOIN store_stats ss
            CROSS JOIN product_stats ps
            CROSS JOIN view_stats vs
            CROSS JOIN click_stats cs
        )
        SELECT 
            ds.*,
            CASE 
                WHEN ds.total_views > 0 THEN 
                    ROUND((ds.total_clicks::DECIMAL / ds.total_views::DECIMAL) * 100, 2)
                ELSE 0 
            END as conversion_rate,
            COALESCE(v_users_by_tier, '{}'::jsonb) as users_by_tier,
            COALESCE(v_users_array, '[]'::jsonb) as users
        FROM debug_stats ds;

        -- Debug: Log function end
        RAISE LOG 'get_admin_stats completed';
    END;
    $$;

    -- Ensure proper permissions are set
    REVOKE ALL ON FUNCTION public.get_admin_stats(TEXT) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO service_role;

    -- Log success
    RAISE LOG 'Successfully recreated and configured get_admin_stats function';
END $$;
