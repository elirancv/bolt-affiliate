-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create restrictive RLS policy that only allows access through our secure functions
DROP POLICY IF EXISTS "Profiles are only accessible through secure functions" ON public.profiles;
CREATE POLICY "Profiles are only accessible through secure functions"
    ON public.profiles
    TO authenticated
    USING (false)
    WITH CHECK (false);

-- Create policy for service role
DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;
CREATE POLICY "Service role has full access to profiles"
    ON public.profiles
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create secure function to get profile
CREATE OR REPLACE FUNCTION public.get_profile()
RETURNS TABLE (
    id uuid,
    first_name text,
    last_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Try to get existing profile
    RETURN QUERY
    SELECT p.id, p.first_name, p.last_name
    FROM profiles p
    WHERE p.id = v_user_id;
    
    -- If no rows returned, create a new profile
    IF NOT FOUND THEN
        INSERT INTO profiles (id, first_name, last_name)
        VALUES (v_user_id, '', '')
        RETURNING id, first_name, last_name;
    END IF;
END;
$$;

-- Create secure function to create/update profile
CREATE OR REPLACE FUNCTION public.upsert_profile(
    p_first_name text DEFAULT NULL,
    p_last_name text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    first_name text,
    last_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO profiles (id, first_name, last_name)
    VALUES (
        auth.uid(),
        COALESCE(p_first_name, ''),
        COALESCE(p_last_name, '')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        first_name = COALESCE(p_first_name, profiles.first_name),
        last_name = COALESCE(p_last_name, profiles.last_name),
        updated_at = timezone('utc'::text, now())
    RETURNING id, first_name, last_name;

    RETURN QUERY
    SELECT p.id, p.first_name, p.last_name
    FROM profiles p
    WHERE p.id = auth.uid();
END;
$$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to create profile on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Insert profiles for existing users
INSERT INTO public.profiles (id, first_name, last_name)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'first_name', ''),
    COALESCE(raw_user_meta_data->>'last_name', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;
