-- Create or update admin user metadata
DO $$
DECLARE
  admin_email TEXT;
  admin_user_id UUID;
BEGIN
  -- Get admin email
  admin_email := get_admin_email();
  
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- Create or update admin metadata
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_metadata (
      user_id,
      subscription_tier,
      is_admin
    )
    VALUES (
      admin_user_id,
      'unlimited',
      true
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      subscription_tier = 'unlimited',
      is_admin = true,
      updated_at = NOW();
  END IF;
END $$;