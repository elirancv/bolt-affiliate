-- Create a basic test function that just returns counts
CREATE OR REPLACE FUNCTION public.basic_test()
RETURNS TABLE (
    table_name TEXT,
    record_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 'auth.users'::TEXT, COUNT(*)::BIGINT FROM auth.users
    UNION ALL
    SELECT 'public.users'::TEXT, COUNT(*)::BIGINT FROM public.users
    UNION ALL
    SELECT 'public.stores'::TEXT, COUNT(*)::BIGINT FROM public.stores
    UNION ALL
    SELECT 'public.products'::TEXT, COUNT(*)::BIGINT FROM public.products;

    -- Also log the results
    FOR table_name, record_count IN
        SELECT t.table_name, t.record_count
        FROM (
            SELECT 'auth.users'::TEXT as table_name, COUNT(*)::BIGINT as record_count FROM auth.users
            UNION ALL
            SELECT 'public.users'::TEXT, COUNT(*)::BIGINT FROM public.users
            UNION ALL
            SELECT 'public.stores'::TEXT, COUNT(*)::BIGINT FROM public.stores
            UNION ALL
            SELECT 'public.products'::TEXT, COUNT(*)::BIGINT FROM public.products
        ) t
    LOOP
        RAISE LOG '% has % records', table_name, record_count;
    END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.basic_test() TO authenticated;
