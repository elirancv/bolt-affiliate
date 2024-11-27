-- Drop existing policies
DROP POLICY IF EXISTS "Users can view metadata" ON user_metadata;
DROP POLICY IF EXISTS "Users can update metadata" ON user_metadata;
DROP POLICY IF EXISTS "Admins can insert metadata" ON user_metadata;
DROP POLICY IF EXISTS "Admins can delete metadata" ON user_metadata;

-- Create new policies for user_metadata
CREATE POLICY "Enable read access for admin"
  ON user_metadata FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Enable write access for admin"
  ON user_metadata FOR ALL
  USING (is_admin(auth.uid()));

-- Create policies for stores
CREATE POLICY "Enable read access for admin on stores"
  ON stores FOR SELECT
  USING (is_admin(auth.uid()));

-- Create policies for products
CREATE POLICY "Enable read access for admin on products"
  ON products FOR SELECT
  USING (is_admin(auth.uid()));

-- Create policies for analytics
CREATE POLICY "Enable read access for admin on analytics"
  ON analytics FOR SELECT
  USING (is_admin(auth.uid()));