-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.minimal_test();

-- Create a minimal test function that just returns a constant
CREATE OR REPLACE FUNCTION public.minimal_test()
RETURNS TABLE (
    test_value TEXT,
    number_value INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 'test'::TEXT, 1::INTEGER;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.minimal_test() TO authenticated;
GRANT EXECUTE ON FUNCTION public.minimal_test() TO anon;
GRANT EXECUTE ON FUNCTION public.minimal_test() TO service_role;
