-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_user_feature_limits_v2();
DROP FUNCTION IF EXISTS public.get_top_products_with_clicks(INTEGER);

-- Create analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_store_id ON public.analytics(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_product_id ON public.analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics(date);

-- Add RLS policies for analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
    ON public.analytics
    FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own analytics"
    ON public.analytics
    FOR INSERT
    WITH CHECK (
        store_id IN (
            SELECT id FROM stores 
            WHERE user_id = auth.uid()
        )
    );

-- Create function to get top products with clicks
CREATE OR REPLACE FUNCTION public.get_top_products_with_clicks(
    p_days INTEGER DEFAULT 7
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
            AND a.date >= CURRENT_DATE - p_days
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

-- Create the get_user_feature_limits_v2 function
CREATE OR REPLACE FUNCTION public.get_user_feature_limits_v2()
RETURNS TABLE (
    max_stores INTEGER,
    max_products_per_store INTEGER,
    total_products_limit INTEGER,
    analytics_retention_days INTEGER,
    can_export_data BOOLEAN,
    subscription_tier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_subscription_tier TEXT;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Get user's subscription tier
    SELECT subscription_tier INTO v_subscription_tier
    FROM users
    WHERE id = v_user_id;
    
    -- Return limits based on subscription tier
    CASE v_subscription_tier
        WHEN 'free' THEN
            RETURN QUERY SELECT 
                1::INTEGER as max_stores,
                10::INTEGER as max_products_per_store,
                10::INTEGER as total_products_limit,
                7::INTEGER as analytics_retention_days,
                FALSE as can_export_data,
                'free'::TEXT as subscription_tier;
        WHEN 'pro' THEN
            RETURN QUERY SELECT 
                5::INTEGER as max_stores,
                50::INTEGER as max_products_per_store,
                250::INTEGER as total_products_limit,
                30::INTEGER as analytics_retention_days,
                TRUE as can_export_data,
                'pro'::TEXT as subscription_tier;
        WHEN 'business' THEN
            RETURN QUERY SELECT 
                20::INTEGER as max_stores,
                200::INTEGER as max_products_per_store,
                4000::INTEGER as total_products_limit,
                90::INTEGER as analytics_retention_days,
                TRUE as can_export_data,
                'business'::TEXT as subscription_tier;
        ELSE
            -- Default to free tier limits
            RETURN QUERY SELECT 
                1::INTEGER as max_stores,
                10::INTEGER as max_products_per_store,
                10::INTEGER as total_products_limit,
                7::INTEGER as analytics_retention_days,
                FALSE as can_export_data,
                'free'::TEXT as subscription_tier;
    END CASE;
END;
$$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_updated_at
    BEFORE UPDATE ON public.analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_analytics_updated_at();
