-- Add default categories to existing stores
DO $$
DECLARE
    store_record RECORD;
BEGIN
    FOR store_record IN SELECT id FROM stores LOOP
        PERFORM insert_default_categories(store_record.id);
    END LOOP;
END $$;
