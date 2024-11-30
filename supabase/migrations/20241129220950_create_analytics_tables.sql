-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables for tracking product views and clicks
CREATE TABLE IF NOT EXISTS public.product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON public.product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON public.product_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_product_clicks_product_id ON public.product_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_user_id ON public.product_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_clicked_at ON public.product_clicks(clicked_at);

-- Policy for viewing analytics (store owners can view their product analytics)
CREATE POLICY "Store owners can view their product views"
    ON public.product_views
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.stores s ON p.store_id = s.id
            WHERE p.id = product_views.product_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Store owners can view their product clicks"
    ON public.product_clicks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.stores s ON p.store_id = s.id
            WHERE p.id = product_clicks.product_id
            AND s.user_id = auth.uid()
        )
    );

-- Policy for inserting analytics (anyone can track views/clicks)
CREATE POLICY "Anyone can track product views"
    ON public.product_views
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Anyone can track product clicks"
    ON public.product_clicks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
