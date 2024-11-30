-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_change();

-- Create improved user sync function
CREATE OR REPLACE FUNCTION public.handle_auth_user_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        created_at, 
        last_sign_in_at,
        is_admin,
        subscription_tier
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.created_at,
        NEW.last_sign_in_at,
        COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false),
        COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'free')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        last_sign_in_at = EXCLUDED.last_sign_in_at,
        is_admin = EXCLUDED.is_admin,
        subscription_tier = EXCLUDED.subscription_tier,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for both INSERT and UPDATE
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_change();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auth_user_change();

-- Improve sync function to handle all user data
CREATE OR REPLACE FUNCTION public.sync_missing_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert or update all users from auth.users into public.users
    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        created_at, 
        last_sign_in_at,
        is_admin,
        subscription_tier
    )
    SELECT 
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'full_name', au.email),
        au.created_at,
        au.last_sign_in_at,
        COALESCE((au.raw_user_meta_data->>'is_admin')::boolean, false),
        COALESCE(au.raw_user_meta_data->>'subscription_tier', 'free')
    FROM auth.users au
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        last_sign_in_at = EXCLUDED.last_sign_in_at,
        is_admin = EXCLUDED.is_admin,
        subscription_tier = EXCLUDED.subscription_tier,
        updated_at = NOW();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_auth_user_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_missing_users() TO authenticated;

-- Run the sync function to fix all users
DO $$ 
BEGIN
    PERFORM public.sync_missing_users();
END $$;
