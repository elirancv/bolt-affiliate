-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for admin" ON user_metadata;
DROP POLICY IF EXISTS "Enable write access for admin" ON user_metadata;

-- Recreate user_metadata policies
CREATE POLICY "Users can view own metadata"
  ON user_metadata FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email = current_setting('app.admin_email', true)
      AND id = auth.uid()
    )
  );

CREATE POLICY "Users can update own metadata"
  ON user_metadata FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email = current_setting('app.admin_email', true)
      AND id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all metadata"
  ON user_metadata FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email = current_setting('app.admin_email', true)
      AND id = auth.uid()
    )
  );

-- Set admin email in database settings
ALTER DATABASE postgres SET "app.admin_email" TO 'eliran2k2@gmail.com';