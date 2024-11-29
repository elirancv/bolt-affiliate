-- Create user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    tier text NOT NULL DEFAULT 'free',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert own subscription"
    ON public.user_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Grant table permissions
GRANT SELECT, INSERT ON public.user_subscriptions TO authenticated;

-- Create the feature limits function
CREATE OR REPLACE FUNCTION public.get_user_feature_limits_v2()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id uuid;
    user_tier text;
    limits jsonb;
BEGIN
    -- Get the authenticated user's ID
    user_id := auth.uid();
    
    -- Get the user's subscription tier, defaulting to 'free' if not found
    SELECT COALESCE(tier, 'free') INTO user_tier
    FROM public.user_subscriptions
    WHERE id = user_id;

    -- If no subscription found, create one with free tier
    IF user_tier IS NULL THEN
        INSERT INTO public.user_subscriptions (id, tier)
        VALUES (user_id, 'free')
        ON CONFLICT (id) DO NOTHING;
        user_tier := 'free';
    END IF;

    -- Define limits based on tier
    CASE user_tier
        WHEN 'free' THEN
            limits := jsonb_build_object(
                'max_stores', 1,
                'total_products_limit', 10,
                'analytics_retention_days', 7
            );
        WHEN 'pro' THEN
            limits := jsonb_build_object(
                'max_stores', 3,
                'total_products_limit', 100,
                'analytics_retention_days', 30
            );
        WHEN 'business' THEN
            limits := jsonb_build_object(
                'max_stores', 10,
                'total_products_limit', 1000,
                'analytics_retention_days', 90
            );
        ELSE
            limits := jsonb_build_object(
                'max_stores', 1,
                'total_products_limit', 10,
                'analytics_retention_days', 7
            );
    END CASE;

    RETURN limits;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_feature_limits_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_feature_limits_v2() TO anon;
