-- Create a settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insert or update the admin email setting
INSERT INTO app_settings (key, value)
VALUES ('admin_email', 'eliran2k2@gmail.com')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- Update the policy to use the settings table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    current_email TEXT;
    admin_email TEXT;
BEGIN
    -- Get current user's email
    current_email := auth.email();
    
    -- Get admin email from settings
    SELECT value INTO admin_email
    FROM app_settings 
    WHERE key = 'admin_email';

    -- Debug output
    RAISE NOTICE 'Current user email: %, Admin email: %', current_email, admin_email;

    -- Return true if emails match
    RETURN COALESCE(current_email = admin_email, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
