-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_top_products_with_clicks(INTEGER);

-- Create the updated function with start_date parameter
CREATE OR REPLACE FUNCTION public.get_top_products_with_clicks(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '7 days'),
    store_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    store_id UUID,
    store_name TEXT,
    total_views INTEGER,
    total_clicks INTEGER,
    conversion_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH product_stats AS (
        SELECT 
            a.product_id,
            p.name as product_name,
            s.id as store_id,
            s.name as store_name,
            SUM(a.views) as total_views,
            SUM(a.clicks) as total_clicks
        FROM analytics a
        JOIN products p ON a.product_id = p.id
        JOIN stores s ON p.store_id = s.id
        WHERE 
            s.user_id = auth.uid()
            AND a.date >= start_date::DATE
            AND (store_ids IS NULL OR s.id = ANY(store_ids))
        GROUP BY 
            a.product_id,
            p.name,
            s.id,
            s.name
    )
    SELECT 
        ps.product_id,
        ps.product_name,
        ps.store_id,
        ps.store_name,
        ps.total_views,
        ps.total_clicks,
        CASE 
            WHEN ps.total_views > 0 
            THEN ROUND((ps.total_clicks::DECIMAL / ps.total_views * 100)::DECIMAL, 2)
            ELSE 0::DECIMAL 
        END as conversion_rate
    FROM product_stats ps
    ORDER BY ps.total_clicks DESC, ps.total_views DESC
    LIMIT 10;
END;
$$;

-- Drop and recreate analytics policies
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.analytics;

-- Add updated RLS policies for analytics
CREATE POLICY "Users can view their own analytics"
    ON public.analytics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM stores s
            WHERE s.id = analytics.store_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own analytics"
    ON public.analytics
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores s
            WHERE s.id = analytics.store_id
            AND s.user_id = auth.uid()
        )
    );

-- Add policy for updating analytics
CREATE POLICY "Users can update their own analytics"
    ON public.analytics
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM stores s
            WHERE s.id = analytics.store_id
            AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores s
            WHERE s.id = analytics.store_id
            AND s.user_id = auth.uid()
        )
    );

-- Add policy for deleting analytics
CREATE POLICY "Users can delete their own analytics"
    ON public.analytics
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM stores s
            WHERE s.id = analytics.store_id
            AND s.user_id = auth.uid()
        )
    );
