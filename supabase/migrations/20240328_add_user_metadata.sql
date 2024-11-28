-- Create user_metadata table
CREATE TABLE IF NOT EXISTS public.user_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own metadata"
    ON public.user_metadata
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own metadata"
    ON public.user_metadata
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metadata"
    ON public.user_metadata
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metadata"
    ON public.user_metadata
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_metadata_updated_at
    BEFORE UPDATE ON public.user_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
