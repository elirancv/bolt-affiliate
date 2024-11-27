-- Drop all existing admin-related functions and policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for users and admin" ON user_metadata;
    DROP POLICY IF EXISTS "Enable write access for admin" ON user_metadata;
    DROP POLICY IF EXISTS "Enable read access for users and admin" ON stores;
    DROP POLICY IF EXISTS "Enable write access for users and admin" ON stores;
    DROP POLICY IF EXISTS "Enable read access for users and admin" ON products;
    DROP POLICY IF EXISTS "Enable write access for users and admin" ON products;
    DROP POLICY IF EXISTS "Enable read access for users and admin" ON analytics;
    DROP POLICY IF EXISTS "Enable write access for users and admin" ON analytics;
    DROP FUNCTION IF EXISTS is_admin() CASCADE;
    DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
    DROP FUNCTION IF EXISTS get_admin_email() CASCADE;
END $$;

-- Create single admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO current_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check if email matches admin email
  RETURN current_email = 'eliran2k2@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for user_metadata
CREATE POLICY "Enable read for users and admin"
  ON user_metadata FOR SELECT
  USING (
    auth.uid() = user_id OR is_admin()
  );

CREATE POLICY "Enable write for admin"
  ON user_metadata FOR ALL
  USING (is_admin());

-- Create policies for stores
CREATE POLICY "Enable read for users and admin"
  ON stores FOR SELECT
  USING (
    auth.uid() = user_id OR is_admin()
  );

CREATE POLICY "Enable write for users and admin"
  ON stores FOR ALL
  USING (
    auth.uid() = user_id OR is_admin()
  );

-- Create policies for products
CREATE POLICY "Enable read for users and admin"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Enable write for users and admin"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin())
    )
  );

-- Create policies for analytics
CREATE POLICY "Enable read for users and admin"
  ON analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Enable write for users and admin"
  ON analytics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_id
      AND (stores.user_id = auth.uid() OR is_admin())
    )
  );

-- Update handle_new_user function to use new is_admin function
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
    CASE WHEN NEW.email = 'eliran2k2@gmail.com' THEN 'unlimited' ELSE 'free' END,
    NEW.email = 'eliran2k2@gmail.com'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure admin user metadata exists
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'eliran2k2@gmail.com';

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