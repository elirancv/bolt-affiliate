-- Drop test function if it exists
DROP FUNCTION IF EXISTS public.test_function();

-- Create a simple test function
CREATE OR REPLACE FUNCTION public.test_function()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    func_count INTEGER;
    func_record RECORD;
BEGIN
    -- Check if get_admin_stats exists
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_admin_stats';

    IF func_count > 0 THEN
        RAISE LOG 'get_admin_stats function exists';
    ELSE
        RAISE LOG 'get_admin_stats function does NOT exist';
    END IF;

    -- List all functions in public schema
    RAISE LOG 'Available functions in public schema:';
    FOR func_record IN 
        SELECT proname, pg_get_function_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        RAISE LOG 'Function: % (%)', func_record.proname, func_record.args;
    END LOOP;

    RETURN 'Function check complete - see logs for details';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.test_function() TO authenticated;
