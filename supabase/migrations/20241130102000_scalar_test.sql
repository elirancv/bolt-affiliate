-- Create a simple function that returns a single text value
CREATE OR REPLACE FUNCTION public.scalar_test()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 'Hello World'::text;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.scalar_test() TO authenticated;
GRANT EXECUTE ON FUNCTION public.scalar_test() TO anon;
GRANT EXECUTE ON FUNCTION public.scalar_test() TO service_role;

-- Also create a JSON returning function as alternative
CREATE OR REPLACE FUNCTION public.json_test()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT json_build_object('message', 'Hello World', 'value', 42);
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.json_test() TO authenticated;
GRANT EXECUTE ON FUNCTION public.json_test() TO anon;
GRANT EXECUTE ON FUNCTION public.json_test() TO service_role;
