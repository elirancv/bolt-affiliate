-- Function to check table data
CREATE OR REPLACE FUNCTION public.debug_table_data()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    auth_users_count INTEGER;
    public_users_count INTEGER;
    stores_count INTEGER;
    products_count INTEGER;
    views_count INTEGER;
    clicks_count INTEGER;
    result TEXT;
BEGIN
    -- Count records in auth.users
    SELECT COUNT(*) INTO auth_users_count FROM auth.users;
    
    -- Count records in public.users
    SELECT COUNT(*) INTO public_users_count FROM public.users;
    
    -- Count records in stores
    SELECT COUNT(*) INTO stores_count FROM public.stores;
    
    -- Count records in products
    SELECT COUNT(*) INTO products_count FROM public.products;
    
    -- Count records in product_views
    SELECT COUNT(*) INTO views_count FROM public.product_views;
    
    -- Count records in product_clicks
    SELECT COUNT(*) INTO clicks_count FROM public.product_clicks;
    
    -- Build result string
    result := format(
        'Table Counts:%s' ||
        'auth.users: %s%s' ||
        'public.users: %s%s' ||
        'stores: %s%s' ||
        'products: %s%s' ||
        'product_views: %s%s' ||
        'product_clicks: %s',
        E'\n',
        auth_users_count, E'\n',
        public_users_count, E'\n',
        stores_count, E'\n',
        products_count, E'\n',
        views_count, E'\n',
        clicks_count
    );
    
    -- Log the counts
    RAISE LOG '%', result;
    
    -- Return the counts
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.debug_table_data() TO authenticated;
