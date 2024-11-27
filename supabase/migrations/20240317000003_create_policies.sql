-- Drop existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own metadata" ON user_metadata;
    DROP POLICY IF EXISTS "Users can update their own metadata" ON user_metadata;
    DROP POLICY IF EXISTS "Admins can manage all metadata" ON user_metadata;
END $$;

-- Create new policies
CREATE POLICY "Users can view metadata"
  ON user_metadata FOR SELECT
  USING (
    auth.uid() = user_id OR is_admin(auth.uid())
  );

CREATE POLICY "Users can update metadata"
  ON user_metadata FOR UPDATE
  USING (
    auth.uid() = user_id OR is_admin(auth.uid())
  );

CREATE POLICY "Admins can insert metadata"
  ON user_metadata FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete metadata"
  ON user_metadata FOR DELETE
  USING (is_admin(auth.uid()));