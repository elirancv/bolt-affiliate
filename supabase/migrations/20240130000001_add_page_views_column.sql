-- Add page_views column to analytics table
ALTER TABLE analytics 
ADD COLUMN IF NOT EXISTS page_views INTEGER DEFAULT 0;

-- Update the increment_page_views function to handle the new column
CREATE OR REPLACE FUNCTION public.increment_page_views(p_store_id UUID, p_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update analytics record for the given store and date
    INSERT INTO analytics (store_id, date, page_views)
    VALUES (p_store_id, p_date, 1)
    ON CONFLICT (store_id, date) 
    DO UPDATE SET 
        page_views = COALESCE(analytics.page_views, 0) + 1,
        updated_at = NOW();
END;
$$;
