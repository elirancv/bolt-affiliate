-- Test the scalar function
SELECT public.scalar_test();

-- Test the JSON function
SELECT public.json_test();

-- Test the direct query function
SELECT * FROM public.direct_query();

-- Test the list tables function
SELECT public.list_tables();

-- Or try a direct table query to verify permissions
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname IN ('public', 'auth');

-- Check if the functions exist
SELECT proname, prorettype::regtype as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('scalar_test', 'json_test', 'direct_query', 'list_tables');
