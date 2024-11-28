-- Debug queries to check auth status
SELECT current_setting('request.jwt.claims', true)::json->>'role' as current_role;
SELECT current_setting('request.jwt.claims', true)::json->>'email' as current_email;
SELECT current_setting('request.jwt.claims', true)::json->>'sub' as current_user_id;

-- Grant access to the table first
GRANT ALL ON public.user_metadata TO authenticated;
GRANT ALL ON public.user_metadata TO service_role;

-- Enable RLS on the table if not already enabled
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

-- Create a secure schema for our settings
CREATE SCHEMA IF NOT EXISTS private;

-- Create a settings table in the private schema
CREATE TABLE IF NOT EXISTS private.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insert admin email (this will error if key exists, which is fine)
INSERT INTO private.app_settings (key, value)
VALUES ('admin_email', 'eliran2k2@gmail.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT email = (SELECT value FROM private.app_settings WHERE key = 'admin_email')
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT SELECT ON private.app_settings TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can access all user metadata" ON public.user_metadata;
DROP POLICY IF EXISTS "Users can read their own metadata" ON public.user_metadata;
DROP POLICY IF EXISTS "Admin read access" ON public.user_metadata;
DROP POLICY IF EXISTS "user_metadata_access_policy" ON public.user_metadata;
DROP POLICY IF EXISTS "authenticated_read" ON public.user_metadata;
DROP POLICY IF EXISTS "admin_access_policy" ON public.user_metadata;
DROP POLICY IF EXISTS "user_self_access_policy" ON public.user_metadata;

-- Create admin policy
CREATE POLICY "admin_access_policy"
    ON public.user_metadata
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Create user self-access policy
CREATE POLICY "user_self_access_policy"
    ON public.user_metadata
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Test the policy
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email,
    EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email = 'eliran2k2@gmail.com'
    ) as is_admin;
