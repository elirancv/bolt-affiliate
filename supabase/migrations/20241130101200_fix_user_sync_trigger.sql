-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Insert the new user into public.users if they don't exist
    INSERT INTO public.users (id, email, created_at, last_sign_in_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.created_at,
        NEW.last_sign_in_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        last_sign_in_at = EXCLUDED.last_sign_in_at;

    -- Log the sync
    RAISE LOG 'Synced user from auth.users to public.users: %', NEW.email;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Sync existing users
INSERT INTO public.users (id, email, created_at, last_sign_in_at)
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    last_sign_in_at = EXCLUDED.last_sign_in_at;
