-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their store categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create categories for their stores" ON public.categories;
DROP POLICY IF EXISTS "Users can update their store categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their store categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view their product categories" ON public.products_categories;
DROP POLICY IF EXISTS "Users can manage their product categories" ON public.products_categories;

-- Create updated policies for categories table
CREATE POLICY "Enable read access for authenticated users"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = categories.store_id 
            AND stores.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert access for authenticated users"
    ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = store_id 
            AND stores.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable update access for authenticated users"
    ON public.categories
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = categories.store_id 
            AND stores.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete access for authenticated users"
    ON public.categories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = categories.store_id 
            AND stores.user_id = auth.uid()
        )
    );

-- Create updated policies for products_categories junction table
CREATE POLICY "Enable read access for authenticated users"
    ON public.products_categories
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products
            JOIN stores ON stores.id = products.store_id
            WHERE products.id = products_categories.product_id
            AND stores.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert access for authenticated users"
    ON public.products_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM products
            JOIN stores ON stores.id = products.store_id
            WHERE products.id = product_id
            AND stores.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete access for authenticated users"
    ON public.products_categories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products
            JOIN stores ON stores.id = products.store_id
            WHERE products.id = products_categories.product_id
            AND stores.user_id = auth.uid()
        )
    );

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.products_categories TO authenticated;
