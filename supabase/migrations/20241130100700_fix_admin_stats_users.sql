-- Drop existing admin stats function
DROP FUNCTION IF EXISTS public.get_admin_stats(TEXT);

-- Create admin stats function with users array
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
    users JSONB -- Added users array
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_date TIMESTAMP;
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

    -- First get user tiers
    CREATE TEMP TABLE user_tiers AS
    SELECT 
        COALESCE(subscription_tier, 'free') as tier,
        COUNT(*)::INTEGER as count
    FROM public.users
    GROUP BY COALESCE(subscription_tier, 'free');

    -- Get users list
    CREATE TEMP TABLE users_list AS
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'id', u.id,
                'email', u.email,
                'created_at', u.created_at,
                'subscription_tier', COALESCE(u.subscription_tier, 'free'),
                'is_admin', COALESCE(u.is_admin, false)
            ) ORDER BY u.created_at DESC
        ) as users_array
    FROM public.users u;

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
    tier_stats AS (
        SELECT jsonb_object_agg(tier, count::INTEGER) as users_by_tier
        FROM user_tiers
    )
    SELECT 
        us.total_users,
        us.active_users,
        ss.total_stores,
        ss.active_stores,
        ps.total_products,
        ps.active_products,
        vs.total_views,
        cs.total_clicks,
        CASE 
            WHEN vs.total_views > 0 THEN 
                ROUND((cs.total_clicks::DECIMAL / vs.total_views::DECIMAL) * 100, 2)
            ELSE 0 
        END as conversion_rate,
        ts.users_by_tier,
        COALESCE(ul.users_array, '[]'::jsonb) as users
    FROM user_stats us
    CROSS JOIN store_stats ss
    CROSS JOIN product_stats ps
    CROSS JOIN view_stats vs
    CROSS JOIN click_stats cs
    CROSS JOIN tier_stats ts
    CROSS JOIN users_list ul;

    -- Clean up
    DROP TABLE IF EXISTS user_tiers;
    DROP TABLE IF EXISTS users_list;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO authenticated;
