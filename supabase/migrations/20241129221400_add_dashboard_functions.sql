-- Create type for store statistics
CREATE TYPE public.store_stats AS (
    total_products INTEGER,
    active_products INTEGER,
    total_views INTEGER,
    total_clicks INTEGER
);

-- Create views table to track product views
CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    viewer_ip TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT
);

-- Create clicks table to track affiliate link clicks
CREATE TABLE IF NOT EXISTS public.product_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    clicker_ip TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT
);

-- Add RLS policies for views and clicks
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- Allow insert for everyone (tracking should work for non-authenticated users)
CREATE POLICY "Enable insert for everyone" ON public.product_views
    FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY "Enable insert for everyone" ON public.product_clicks
    FOR INSERT TO public
    WITH CHECK (true);

-- Allow store owners to view their analytics
CREATE POLICY "Enable select for store owners" ON public.product_views
    FOR SELECT TO authenticated
    USING (
        product_id IN (
            SELECT p.id 
            FROM public.products p 
            JOIN public.stores s ON p.store_id = s.id 
            WHERE s.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable select for store owners" ON public.product_clicks
    FOR SELECT TO authenticated
    USING (
        product_id IN (
            SELECT p.id 
            FROM public.products p 
            JOIN public.stores s ON p.store_id = s.id 
            WHERE s.user_id = auth.uid()
        )
    );

-- Function to get user's stores with stats
CREATE OR REPLACE FUNCTION public.get_user_stores_with_stats()
RETURNS TABLE (
    store_id UUID,
    store_name TEXT,
    store_description TEXT,
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    total_products INTEGER,
    active_products INTEGER,
    total_views INTEGER,
    total_clicks INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id AS store_id,
        s.name AS store_name,
        s.description AS store_description,
        s.logo_url,
        s.website_url,
        s.is_active,
        s.created_at,
        COUNT(DISTINCT p.id)::INTEGER AS total_products,
        COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END)::INTEGER AS active_products,
        COUNT(DISTINCT pv.id)::INTEGER AS total_views,
        COUNT(DISTINCT pc.id)::INTEGER AS total_clicks
    FROM stores s
    LEFT JOIN products p ON s.id = p.store_id
    LEFT JOIN product_views pv ON p.id = pv.product_id
    LEFT JOIN product_clicks pc ON p.id = pc.product_id
    WHERE s.user_id = auth.uid()
    GROUP BY s.id, s.name, s.description, s.logo_url, s.website_url, s.is_active, s.created_at;
END;
$$;

-- Function to get store statistics
CREATE OR REPLACE FUNCTION public.get_store_stats(p_store_id UUID)
RETURNS public.store_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stats public.store_stats;
BEGIN
    -- Check if user owns the store
    IF NOT EXISTS (
        SELECT 1 FROM stores 
        WHERE id = p_store_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Store not found or access denied';
    END IF;

    SELECT 
        COUNT(DISTINCT p.id)::INTEGER AS total_products,
        COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END)::INTEGER AS active_products,
        COUNT(DISTINCT pv.id)::INTEGER AS total_views,
        COUNT(DISTINCT pc.id)::INTEGER AS total_clicks
    INTO v_stats
    FROM stores s
    LEFT JOIN products p ON s.id = p.store_id
    LEFT JOIN product_views pv ON p.id = pv.product_id
    LEFT JOIN product_clicks pc ON p.id = pc.product_id
    WHERE s.id = p_store_id;

    RETURN v_stats;
END;
$$;

-- Function to track product view
CREATE OR REPLACE FUNCTION public.track_product_view(
    p_product_id UUID,
    p_viewer_ip TEXT,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO product_views (product_id, viewer_ip, user_agent)
    VALUES (p_product_id, p_viewer_ip, p_user_agent);
END;
$$;

-- Function to track product click
CREATE OR REPLACE FUNCTION public.track_product_click(
    p_product_id UUID,
    p_clicker_ip TEXT,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO product_clicks (product_id, clicker_ip, user_agent)
    VALUES (p_product_id, p_clicker_ip, p_user_agent);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_stores_with_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_product_view(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_product_click(UUID, TEXT, TEXT) TO anon, authenticated;
