-- Drop existing function
DROP FUNCTION IF EXISTS public.get_admin_stats(text);

-- Create the function returning a single JSON object
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

    -- Get all stats in a single query and return as JSON
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*)::INTEGER FROM public.users),
        'active_users', (
            SELECT COUNT(DISTINCT id)::INTEGER 
            FROM public.users 
            WHERE COALESCE(last_sign_in_at, created_at) >= v_start_date
        ),
        'total_stores', (SELECT COUNT(*)::INTEGER FROM public.stores),
        'active_stores', (
            SELECT COUNT(DISTINCT id)::INTEGER 
            FROM public.stores 
            WHERE updated_at >= v_start_date
        ),
        'total_products', (SELECT COUNT(*)::INTEGER FROM public.products),
        'active_products', (
            SELECT COUNT(DISTINCT id)::INTEGER 
            FROM public.products 
            WHERE updated_at >= v_start_date
        ),
        'total_views', (
            SELECT COUNT(*)::INTEGER 
            FROM public.product_views 
            WHERE viewed_at >= v_start_date
        ),
        'total_clicks', (
            SELECT COUNT(*)::INTEGER 
            FROM public.product_clicks 
            WHERE clicked_at >= v_start_date
        ),
        'users_by_tier', (
            SELECT jsonb_object_agg(
                COALESCE(subscription_tier, 'free'),
                COUNT(*)::INTEGER
            )
            FROM public.users
            GROUP BY COALESCE(subscription_tier, 'free')
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO service_role;
