-- Check if we can query tables directly
SELECT * FROM pg_tables WHERE schemaname IN ('public', 'auth');

-- Try to count rows in each table
SELECT 
    schemaname || '.' || tablename as table_full_name,
    (SELECT count(*) FROM (SELECT 1 FROM information_schema.columns 
     WHERE table_schema = t.schemaname AND table_name = t.tablename) c) as column_count
FROM pg_tables t
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- Check RLS policies
SELECT
    schemaname || '.' || tablename as table_name,
    has_table_privilege(current_user, schemaname || '.' || tablename, 'SELECT') as can_select,
    has_table_privilege(current_user, schemaname || '.' || tablename, 'INSERT') as can_insert,
    has_table_privilege(current_user, schemaname || '.' || tablename, 'UPDATE') as can_update,
    has_table_privilege(current_user, schemaname || '.' || tablename, 'DELETE') as can_delete
FROM pg_tables
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;
