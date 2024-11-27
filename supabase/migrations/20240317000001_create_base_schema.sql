-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing objects safely
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_user_metadata_updated_at ON user_metadata;
    DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    DROP FUNCTION IF EXISTS get_admin_email CASCADE;
    DROP FUNCTION IF EXISTS is_admin CASCADE;
    DROP FUNCTION IF EXISTS handle_new_user CASCADE;
    DROP TABLE IF EXISTS user_metadata CASCADE;
END $$;

-- Create trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_metadata table
CREATE TABLE user_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_subscription_tier CHECK (
    subscription_tier IN ('free', 'starter', 'professional', 'business', 'unlimited')
  ),
  CONSTRAINT unique_user_metadata UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_user_metadata_updated_at
  BEFORE UPDATE ON user_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_user_metadata_user_id ON user_metadata(user_id);