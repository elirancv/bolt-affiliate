-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier text NOT NULL DEFAULT 'free',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    status text DEFAULT 'active'::text,
    cancel_at_period_end boolean DEFAULT false,
    cancel_at timestamp with time zone,
    canceled_at timestamp with time zone,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    ended_at timestamp with time zone,
    trial_start timestamp with time zone,
    trial_end timestamp with time zone
);

-- Add RLS policies
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
    ON public.user_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Service role can manage all subscriptions"
    ON public.user_subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert default subscription for existing users
INSERT INTO public.user_subscriptions (id, tier)
SELECT id, 'free'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Update get_user_feature_limits_v2 function to handle null subscriptions
CREATE OR REPLACE FUNCTION public.get_user_feature_limits_v2()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
    user_tier text;
    limits json;
BEGIN
    -- Get the authenticated user's ID
    user_id := auth.uid();
    
    -- Get the user's subscription tier
    SELECT tier INTO user_tier
    FROM user_subscriptions
    WHERE id = user_id;

    -- Set default tier if none found
    IF user_tier IS NULL THEN
        user_tier := 'free';
    END IF;

    -- Define limits based on tier
    CASE user_tier
        WHEN 'free' THEN
            limits := json_build_object(
                'max_stores', 1,
                'total_products_limit', 10,
                'analytics_retention_days', 7
            );
        WHEN 'pro' THEN
            limits := json_build_object(
                'max_stores', 3,
                'total_products_limit', 100,
                'analytics_retention_days', 30
            );
        WHEN 'business' THEN
            limits := json_build_object(
                'max_stores', 10,
                'total_products_limit', 1000,
                'analytics_retention_days', 90
            );
        ELSE
            limits := json_build_object(
                'max_stores', 1,
                'total_products_limit', 10,
                'analytics_retention_days', 7
            );
    END CASE;

    RETURN limits;
END;
$$;