-- Drop test function if it exists
DROP FUNCTION IF EXISTS public.test_function();

-- Create a simple test function
CREATE OR REPLACE FUNCTION public.test_function()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN 'Function is working!';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.test_function() TO authenticated;

-- Verify get_admin_stats exists and permissions
DO $$
BEGIN
    -- Check if get_admin_stats exists
    IF EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'get_admin_stats'
    ) THEN
        RAISE LOG 'get_admin_stats function exists';
    ELSE
        RAISE LOG 'get_admin_stats function does NOT exist';
    END IF;

    -- List all functions in public schema
    RAISE LOG 'Available functions in public schema:';
    FOR r IN (
        SELECT proname, pg_get_function_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        RAISE LOG 'Function: % (%)', r.proname, r.args;
    END LOOP;
END $$;
