-- Drop existing store policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view stores" ON stores;
    DROP POLICY IF EXISTS "Users can manage stores" ON stores;
END $$;

-- Create new store policies
CREATE POLICY "Users can view own stores"
  ON stores FOR SELECT
  USING (
    auth.uid() = user_id OR is_admin(auth.uid())
  );

CREATE POLICY "Users can insert own stores"
  ON stores FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR is_admin(auth.uid())
  );

CREATE POLICY "Users can update own stores"
  ON stores FOR UPDATE
  USING (
    auth.uid() = user_id OR is_admin(auth.uid())
  );

CREATE POLICY "Users can delete own stores"
  ON stores FOR DELETE
  USING (
    auth.uid() = user_id OR is_admin(auth.uid())
  );