-- First create a type to hold our result
DROP TYPE IF EXISTS public.test_result CASCADE;
CREATE TYPE public.test_result AS (
    message text,
    value integer
);

-- Create a function that returns SETOF our custom type
CREATE OR REPLACE FUNCTION public.single_row_test()
RETURNS SETOF public.test_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN NEXT ROW('Hello from test'::text, 42::integer)::public.test_result;
    RETURN;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.single_row_test() TO authenticated;
GRANT EXECUTE ON FUNCTION public.single_row_test() TO anon;
GRANT EXECUTE ON FUNCTION public.single_row_test() TO service_role;
