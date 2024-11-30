-- Create user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    tier text NOT NULL DEFAULT 'free',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;

-- Create RLS policies
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own subscription"
    ON public.user_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Grant table permissions
GRANT SELECT, INSERT ON public.user_subscriptions TO authenticated;

-- Create or replace the feature limits view
CREATE OR REPLACE VIEW public.user_feature_limits AS
SELECT 
    auth.uid() as user_id,
    COALESCE(us.tier, 'free') as tier,
    CASE COALESCE(us.tier, 'free')
        WHEN 'free' THEN 
            jsonb_build_object(
                'max_stores', 1,
                'total_products_limit', 10,
                'analytics_retention_days', 7
            )
        WHEN 'pro' THEN 
            jsonb_build_object(
                'max_stores', 3,
                'total_products_limit', 100,
                'analytics_retention_days', 30
            )
        WHEN 'business' THEN 
            jsonb_build_object(
                'max_stores', 10,
                'total_products_limit', 1000,
                'analytics_retention_days', 90
            )
        ELSE 
            jsonb_build_object(
                'max_stores', 1,
                'total_products_limit', 10,
                'analytics_retention_days', 7
            )
    END as limits
FROM (SELECT auth.uid()) u
LEFT JOIN public.user_subscriptions us ON us.id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.user_feature_limits TO authenticated;
GRANT SELECT ON public.user_feature_limits TO anon;
