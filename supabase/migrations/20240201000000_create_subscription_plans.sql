-- Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price decimal(10,2) NOT NULL DEFAULT 0,
    billing_interval text NOT NULL DEFAULT 'month',
    stripe_price_id text UNIQUE,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_billing_interval CHECK (billing_interval IN ('month', 'year')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Create feature_definitions table to store available features
CREATE TABLE IF NOT EXISTS public.feature_definitions (
    code text PRIMARY KEY,
    name text NOT NULL,
    description text,
    value_type text NOT NULL DEFAULT 'numeric',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_value_type CHECK (value_type IN ('numeric', 'boolean', 'text'))
);

-- Create plan_features table to link plans with their features and limits
CREATE TABLE IF NOT EXISTS public.plan_feature_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    feature_code text NOT NULL REFERENCES public.feature_definitions(code) ON DELETE CASCADE,
    limit_value integer NOT NULL DEFAULT -1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (plan_id, feature_code)
);

-- Add RLS policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_feature_limits ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans
CREATE POLICY "Everyone can view active subscription plans"
    ON public.subscription_plans
    FOR SELECT
    USING (status = 'active');

CREATE POLICY "Only service_role can manage subscription plans"
    ON public.subscription_plans
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policies for feature_definitions
CREATE POLICY "Everyone can view feature definitions"
    ON public.feature_definitions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only service_role can manage feature definitions"
    ON public.feature_definitions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policies for plan_feature_limits
CREATE POLICY "Everyone can view plan feature limits"
    ON public.plan_feature_limits
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only service_role can manage plan feature limits"
    ON public.plan_feature_limits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER handle_updated_at_subscription_plans
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_feature_definitions
    BEFORE UPDATE ON public.feature_definitions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_plan_feature_limits
    BEFORE UPDATE ON public.plan_feature_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert default feature definitions
INSERT INTO public.feature_definitions (code, name, description, value_type) 
VALUES 
    ('max_stores', 'Maximum Stores', 'Maximum number of stores allowed', 'numeric'),
    ('total_products_limit', 'Total Products', 'Maximum number of products across all stores', 'numeric'),
    ('analytics_retention_days', 'Analytics Retention', 'Number of days analytics data is retained', 'numeric')
ON CONFLICT (code) DO NOTHING;

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, billing_interval, status) 
VALUES 
    ('Free', 'Basic features for small businesses', 0, 'month', 'active'),
    ('Pro', 'Advanced features for growing businesses', 29.99, 'month', 'active'),
    ('Business', 'Enterprise-grade features for large businesses', 99.99, 'month', 'active')
ON CONFLICT DO NOTHING;

-- Insert default plan feature limits
WITH plans AS (
    SELECT id, name FROM public.subscription_plans
)
INSERT INTO public.plan_feature_limits (plan_id, feature_code, limit_value)
SELECT 
    p.id,
    fd.code,
    CASE 
        WHEN p.name = 'Free' AND fd.code = 'max_stores' THEN 1
        WHEN p.name = 'Free' AND fd.code = 'total_products_limit' THEN 10
        WHEN p.name = 'Free' AND fd.code = 'analytics_retention_days' THEN 7
        WHEN p.name = 'Pro' AND fd.code = 'max_stores' THEN 3
        WHEN p.name = 'Pro' AND fd.code = 'total_products_limit' THEN 100
        WHEN p.name = 'Pro' AND fd.code = 'analytics_retention_days' THEN 30
        WHEN p.name = 'Business' AND fd.code = 'max_stores' THEN 10
        WHEN p.name = 'Business' AND fd.code = 'total_products_limit' THEN 1000
        WHEN p.name = 'Business' AND fd.code = 'analytics_retention_days' THEN 90
    END
FROM plans p
CROSS JOIN public.feature_definitions fd
ON CONFLICT DO NOTHING;

-- Update get_user_subscription_limits function to use the new tables
CREATE OR REPLACE FUNCTION public.get_user_subscription_limits()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
    user_subscription record;
    limits json;
BEGIN
    -- Get the authenticated user's ID
    user_id := auth.uid();
    
    -- Get the user's subscription and associated plan
    SELECT 
        us.tier,
        sp.id as plan_id
    INTO user_subscription
    FROM user_subscriptions us
    LEFT JOIN subscription_plans sp ON sp.name = us.tier
    WHERE us.id = user_id;

    -- Get the feature limits for the user's plan
    SELECT 
        json_object_agg(
            pfl.feature_code,
            json_build_object(
                'limit_value', COALESCE(pfl.limit_value, 
                    CASE 
                        WHEN fd.code = 'max_stores' THEN 1
                        WHEN fd.code = 'total_products_limit' THEN 10
                        WHEN fd.code = 'analytics_retention_days' THEN 7
                        ELSE -1
                    END
                ),
                'name', fd.name,
                'description', fd.description
            )
        )
    INTO limits
    FROM feature_definitions fd
    LEFT JOIN plan_feature_limits pfl ON 
        pfl.feature_code = fd.code AND 
        pfl.plan_id = user_subscription.plan_id;

    RETURN limits;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.subscription_plans TO service_role;
GRANT ALL ON public.feature_definitions TO service_role;
GRANT ALL ON public.plan_feature_limits TO service_role;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.feature_definitions TO authenticated;
GRANT SELECT ON public.plan_feature_limits TO authenticated;
