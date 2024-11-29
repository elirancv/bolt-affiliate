-- Create function to get feature usage
CREATE OR REPLACE FUNCTION public.get_feature_usage(p_user_id uuid, p_feature_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_count integer;
BEGIN
    CASE p_feature_code
        WHEN 'max_stores' THEN
            SELECT COUNT(*)::integer INTO usage_count
            FROM public.stores
            WHERE user_id = p_user_id;
            
        WHEN 'total_products_limit' THEN
            SELECT COUNT(p.*)::integer INTO usage_count
            FROM public.products p
            JOIN public.stores s ON s.id = p.store_id
            WHERE s.user_id = p_user_id;
            
        ELSE
            usage_count := 0;
    END CASE;

    RETURN COALESCE(usage_count, 0);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_feature_usage(uuid, text) TO authenticated;
