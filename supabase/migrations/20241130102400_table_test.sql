-- Create a test function that returns data from users table
CREATE OR REPLACE FUNCTION public.test_users()
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.users LIMIT 5;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.test_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_users() TO anon;
GRANT EXECUTE ON FUNCTION public.test_users() TO service_role;

-- Create a count function
CREATE OR REPLACE FUNCTION public.count_users()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*) FROM public.users;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.count_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_users() TO anon;
GRANT EXECUTE ON FUNCTION public.count_users() TO service_role;
