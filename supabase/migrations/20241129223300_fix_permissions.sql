-- Grant execute permission for get_user_feature_limits_v2
GRANT EXECUTE ON FUNCTION public.get_user_feature_limits_v2() TO authenticated;

-- Drop and recreate analytics policies with better array handling
DROP POLICY IF EXISTS "Analytics access policy" ON public.analytics;

ALTER TABLE public.analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Add updated RLS policies for analytics with array support
CREATE POLICY "Analytics access policy"
    ON public.analytics
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = analytics.store_id 
            AND stores.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = analytics.store_id 
            AND stores.user_id = auth.uid()
        )
    );

-- Grant permissions on analytics table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics TO authenticated;

-- Grant execute permission for get_top_products_with_clicks
GRANT EXECUTE ON FUNCTION public.get_top_products_with_clicks(TIMESTAMP WITH TIME ZONE, UUID[]) TO authenticated;
