-- Add unique constraint to analytics table
ALTER TABLE analytics 
ADD CONSTRAINT analytics_store_date_key UNIQUE (store_id, date);

-- Update the increment_page_views function to explicitly specify the constraint
CREATE OR REPLACE FUNCTION public.increment_page_views(p_store_id UUID, p_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update analytics record for the given store and date
    INSERT INTO analytics (store_id, date, page_views)
    VALUES (p_store_id, p_date, 1)
    ON CONFLICT ON CONSTRAINT analytics_store_date_key
    DO UPDATE SET 
        page_views = COALESCE(analytics.page_views, 0) + 1,
        updated_at = NOW();
END;
$$;
