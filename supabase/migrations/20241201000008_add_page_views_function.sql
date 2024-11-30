-- Create analytics_page_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics_page_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    view_date date NOT NULL,
    view_count integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, view_date)
);

-- Create function to increment page views
CREATE OR REPLACE FUNCTION increment_page_views(p_date date, p_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add RLS policies
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics are viewable by store owner"
ON analytics_page_views FOR SELECT
TO authenticated
USING (
    store_id IN (
        SELECT id FROM stores
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Analytics are insertable by anyone"
ON analytics_page_views FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Analytics are updatable by anyone"
ON analytics_page_views FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);
