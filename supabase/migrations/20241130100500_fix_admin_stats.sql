-- Drop existing admin stats function
DROP FUNCTION IF EXISTS public.get_admin_stats(TEXT);

-- Create admin stats function
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
    users_by_tier JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_date TIMESTAMP;
    v_debug_users INTEGER;
    v_debug_stores INTEGER;
    v_debug_auth_users INTEGER;
    v_debug_active_users INTEGER;
    v_debug_products INTEGER;
    v_debug_active_products INTEGER;
    v_debug_views INTEGER;
    v_debug_clicks INTEGER;
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

    -- Debug logging for time range
    RAISE LOG 'Debug - Time range: %, Start date: %, Current time: %', time_range, v_start_date, NOW();

    -- Debug counts from auth and public users
    SELECT COUNT(*) INTO v_debug_auth_users FROM auth.users;
    SELECT COUNT(*) INTO v_debug_users FROM public.users;
    SELECT COUNT(*) INTO v_debug_active_users 
    FROM public.users 
    WHERE COALESCE(last_sign_in_at, created_at) >= v_start_date;
    
    RAISE LOG 'Debug - Users comparison:';
    RAISE LOG '  Total users in auth.users: %', v_debug_auth_users;
    RAISE LOG '  Total users in public.users: %', v_debug_users;
    RAISE LOG '  Active users since %: %', v_start_date, v_debug_active_users;

    -- Debug stores
    SELECT COUNT(*) INTO v_debug_stores FROM public.stores;
    SELECT COUNT(DISTINCT s.id) INTO v_debug_stores 
    FROM public.stores s 
    WHERE s.updated_at >= v_start_date;
    
    RAISE LOG 'Debug - Stores:';
    RAISE LOG '  Total stores: %', v_debug_stores;
    RAISE LOG '  Active stores since %: %', v_start_date, v_debug_stores;

    -- Debug products
    SELECT COUNT(*) INTO v_debug_products FROM public.products;
    SELECT COUNT(*) INTO v_debug_active_products 
    FROM public.products 
    WHERE updated_at >= v_start_date;
    
    RAISE LOG 'Debug - Products:';
    RAISE LOG '  Total products: %', v_debug_products;
    RAISE LOG '  Active products since %: %', v_start_date, v_debug_active_products;

    -- Debug views and clicks
    SELECT COUNT(*) INTO v_debug_views 
    FROM public.product_views 
    WHERE viewed_at >= v_start_date;
    
    SELECT COUNT(*) INTO v_debug_clicks 
    FROM public.product_clicks 
    WHERE clicked_at >= v_start_date;
    
    RAISE LOG 'Debug - Views and Clicks since %:', v_start_date;
    RAISE LOG '  Total views: %', v_debug_views;
    RAISE LOG '  Total clicks: %', v_debug_clicks;
    RAISE LOG '  Conversion rate: %', 
        CASE 
            WHEN v_debug_views > 0 
            THEN ROUND((v_debug_clicks::DECIMAL / v_debug_views::DECIMAL) * 100, 2)
            ELSE 0 
        END;

    -- First get user tiers
    CREATE TEMP TABLE user_tiers AS
    SELECT 
        COALESCE(subscription_tier, 'free') as tier,
        COUNT(*)::INTEGER as count
    FROM public.users
    GROUP BY COALESCE(subscription_tier, 'free');

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
        ts.users_by_tier
    FROM user_stats us
    CROSS JOIN store_stats ss
    CROSS JOIN product_stats ps
    CROSS JOIN view_stats vs
    CROSS JOIN click_stats cs
    CROSS JOIN tier_stats ts;

    -- Clean up
    DROP TABLE IF EXISTS user_tiers;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_stats(TEXT) TO authenticated;

-- Add last_sign_in_at column to public.users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP WITH TIME ZONE;

-- Function to sync missing users
CREATE OR REPLACE FUNCTION public.sync_missing_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert missing users from auth.users into public.users
    INSERT INTO public.users (id, email, full_name, created_at, last_sign_in_at)
    SELECT 
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'full_name', au.email),
        au.created_at,
        au.last_sign_in_at
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL;

    -- Update existing users with latest data
    UPDATE public.users pu
    SET 
        email = au.email,
        full_name = COALESCE(au.raw_user_meta_data->>'full_name', au.email),
        last_sign_in_at = au.last_sign_in_at
    FROM auth.users au
    WHERE pu.id = au.id;
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, created_at, last_sign_in_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.created_at,
        NEW.last_sign_in_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        last_sign_in_at = EXCLUDED.last_sign_in_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.sync_missing_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Run the sync function to fix existing users
DO $$ 
BEGIN
    PERFORM public.sync_missing_users();
END $$;

-- Create debug function to check raw counts
CREATE OR REPLACE FUNCTION public.debug_table_counts()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 'public.users'::TEXT, COUNT(*)::BIGINT FROM public.users
    UNION ALL
    SELECT 'auth.users'::TEXT, COUNT(*)::BIGINT FROM auth.users
    UNION ALL
    SELECT 'public.stores'::TEXT, COUNT(*)::BIGINT FROM public.stores
    UNION ALL
    SELECT 'public.products'::TEXT, COUNT(*)::BIGINT FROM public.products
    UNION ALL
    SELECT 'public.product_views'::TEXT, COUNT(*)::BIGINT FROM public.product_views
    UNION ALL
    SELECT 'public.product_clicks'::TEXT, COUNT(*)::BIGINT FROM public.product_clicks;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.debug_table_counts() TO authenticated;

-- Create function to handle user sign in
CREATE OR REPLACE FUNCTION public.handle_user_sign_in()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET last_sign_in_at = NEW.last_sign_in_at
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user sign in
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_sign_in();

-- Grant necessary permissions
GRANT UPDATE ON public.users TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_sign_in() TO authenticated;
