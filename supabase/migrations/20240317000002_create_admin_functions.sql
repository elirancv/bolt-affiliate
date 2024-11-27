-- Function to handle admin email configuration
CREATE OR REPLACE FUNCTION get_admin_email()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.admin_email', true),
    'eliran2k2@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  admin_email TEXT;
  user_email TEXT;
BEGIN
  -- Get the admin email
  admin_email := get_admin_email();
  
  -- Get the user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = check_user_id;
  
  -- Check if the user's email matches the admin email
  RETURN user_email = admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_metadata (
    user_id,
    subscription_tier,
    is_admin
  )
  VALUES (
    NEW.id,
    CASE WHEN is_admin(NEW.id) THEN 'unlimited' ELSE 'free' END,
    is_admin(NEW.id)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();