-- Drop existing function if it exists
DROP FUNCTION IF EXISTS increment_page_views(date, uuid);

-- Create function to increment page views with proper schema
CREATE OR REPLACE FUNCTION public.increment_page_views(p_date date, p_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO analytics_page_views (store_id, view_date, view_count)
    VALUES (p_store_id, p_date, 1)
    ON CONFLICT (store_id, view_date)
    DO UPDATE SET 
        view_count = analytics_page_views.view_count + 1,
        updated_at = NOW();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.increment_page_views(date, uuid) TO authenticated, anon;
