-- Grant necessary permissions to authenticated users
GRANT ALL ON TABLE products TO authenticated;
GRANT ALL ON TABLE clicks TO authenticated;

-- Recreate RLS policies for products
DROP POLICY IF EXISTS "Users can view products from their own stores" ON products;
DROP POLICY IF EXISTS "Users can insert products into their own stores" ON products;
DROP POLICY IF EXISTS "Users can update products in their own stores" ON products;
DROP POLICY IF EXISTS "Users can delete products from their own stores" ON products;

CREATE POLICY "Users can view products from their own stores"
    ON products FOR SELECT
    USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert products into their own stores"
    ON products FOR INSERT
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update products in their own stores"
    ON products FOR UPDATE
    USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ))
    WITH CHECK (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete products from their own stores"
    ON products FOR DELETE
    USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));
