-- Allow service role to bypass RLS
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Create policy for service role
CREATE POLICY "Service role has full access" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
