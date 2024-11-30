-- Create analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, product_id, date)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_store_id ON public.analytics(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_product_id ON public.analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics(date);

-- Add RLS policies
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own analytics
CREATE POLICY "Users can view their own analytics"
    ON public.analytics
    FOR SELECT
    TO authenticated
    USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE user_id = auth.uid()
        )
    );

-- Allow service role full access
CREATE POLICY "Service role has full access to analytics"
    ON public.analytics
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create function to increment page views
CREATE OR REPLACE FUNCTION public.increment_page_views(
    p_store_id uuid,
    p_product_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update analytics record
    INSERT INTO public.analytics (store_id, product_id, views)
    VALUES (p_store_id, p_product_id, 1)
    ON CONFLICT (store_id, product_id, date)
    DO UPDATE SET views = analytics.views + 1;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.analytics TO service_role;
GRANT SELECT ON public.analytics TO authenticated;
