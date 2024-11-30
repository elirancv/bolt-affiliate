-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free',
    active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    billing_period_start TIMESTAMPTZ DEFAULT NOW(),
    billing_period_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 month',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
    ON public.user_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
    ON public.user_subscriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
    ON public.user_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Function to ensure user has a default subscription
CREATE OR REPLACE FUNCTION public.ensure_default_subscription()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user already has an active subscription
    IF NOT EXISTS (
        SELECT 1 
        FROM user_subscriptions 
        WHERE user_id = auth.uid() 
        AND active = true
    ) THEN
        -- Create a default free subscription
        INSERT INTO user_subscriptions (
            user_id,
            tier,
            active,
            start_date,
            billing_period_start,
            billing_period_end
        ) VALUES (
            auth.uid(),
            'free',
            true,
            NOW(),
            NOW(),
            NOW() + INTERVAL '1 month'
        );
    END IF;
END;
$$;

-- Create trigger to ensure default subscription on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create default subscription for new user
    INSERT INTO user_subscriptions (
        user_id,
        tier,
        active,
        start_date,
        billing_period_start,
        billing_period_end
    ) VALUES (
        NEW.id,
        'free',
        true,
        NOW(),
        NOW(),
        NOW() + INTERVAL '1 month'
    );
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.ensure_default_subscription() TO authenticated;

-- Create default subscription for existing users
DO $$
BEGIN
    INSERT INTO user_subscriptions (
        user_id,
        tier,
        active,
        start_date,
        billing_period_start,
        billing_period_end
    )
    SELECT 
        u.id,
        'free',
        true,
        NOW(),
        NOW(),
        NOW() + INTERVAL '1 month'
    FROM auth.users u
    WHERE NOT EXISTS (
        SELECT 1 
        FROM user_subscriptions s 
        WHERE s.user_id = u.id 
        AND s.active = true
    );
END;
$$;
