-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.direct_query();

-- Create a function that runs a direct SELECT
CREATE OR REPLACE FUNCTION public.direct_query()
RETURNS TABLE (
    schema_name text,
    table_name text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        table_schema::text as schema_name,
        table_name::text
    FROM information_schema.tables 
    WHERE table_schema IN ('public', 'auth')
    ORDER BY table_schema, table_name;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.direct_query() TO authenticated;
GRANT EXECUTE ON FUNCTION public.direct_query() TO anon;
GRANT EXECUTE ON FUNCTION public.direct_query() TO service_role;

-- Also create a simpler version that just selects from pg_tables
CREATE OR REPLACE FUNCTION public.list_tables()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result text;
BEGIN
    SELECT string_agg(schemaname || '.' || tablename, ', ')
    INTO result
    FROM pg_tables
    WHERE schemaname IN ('public', 'auth');
    
    RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.list_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_tables() TO anon;
GRANT EXECUTE ON FUNCTION public.list_tables() TO service_role;
