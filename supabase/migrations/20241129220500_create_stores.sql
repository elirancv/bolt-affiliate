-- Create stores table
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT store_name_length CHECK (char_length(name) >= 3)
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own stores" ON public.stores
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stores" ON public.stores
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores" ON public.stores
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores" ON public.stores
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER stores_updated_at
    BEFORE UPDATE ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to check store limits before insert
CREATE OR REPLACE FUNCTION public.check_store_limit()
RETURNS TRIGGER AS $$
DECLARE
    store_count INTEGER;
    store_limit INTEGER;
    user_tier TEXT;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM public.users
    WHERE id = NEW.user_id;

    -- Calculate store limit based on tier
    store_limit := CASE user_tier
        WHEN 'free' THEN 1
        WHEN 'pro' THEN 3
        WHEN 'enterprise' THEN -1  -- unlimited
        ELSE 0
    END;

    -- Count existing stores
    SELECT COUNT(*) INTO store_count
    FROM public.stores
    WHERE user_id = NEW.user_id;

    -- Check if user can create more stores
    IF store_limit != -1 AND store_count >= store_limit THEN
        RAISE EXCEPTION 'Store limit reached for your subscription tier';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to check limits before insert
CREATE TRIGGER check_store_limit
    BEFORE INSERT ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.check_store_limit();

-- Grant permissions
GRANT ALL ON public.stores TO postgres;
GRANT ALL ON public.stores TO authenticated;
