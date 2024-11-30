-- Drop the existing view first
DROP VIEW IF EXISTS public.user_feature_limits;

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
