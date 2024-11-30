-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;

-- Create policies for products table
CREATE POLICY "Users can view own products"
ON public.products
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = store_id
        AND s.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage own products"
ON public.products
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = store_id
        AND s.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = store_id
        AND s.user_id = auth.uid()
    )
);

-- Enable RLS on product_clicks table
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own clicks" ON public.product_clicks;
DROP POLICY IF EXISTS "Users can manage own clicks" ON public.product_clicks;

-- Create policies for product_clicks table
CREATE POLICY "Users can view own clicks"
ON public.product_clicks
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM products p
        JOIN stores s ON s.id = p.store_id
        WHERE p.id = product_id
        AND s.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage own clicks"
ON public.product_clicks
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM products p
        JOIN stores s ON s.id = p.store_id
        WHERE p.id = product_id
        AND s.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM products p
        JOIN stores s ON s.id = p.store_id
        WHERE p.id = product_id
        AND s.user_id = auth.uid()
    )
);

-- Enable RLS on product_views table
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own views" ON public.product_views;
DROP POLICY IF EXISTS "Users can manage own views" ON public.product_views;

-- Create policies for product_views table
CREATE POLICY "Users can view own views"
ON public.product_views
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM products p
        JOIN stores s ON s.id = p.store_id
        WHERE p.id = product_id
        AND s.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage own views"
ON public.product_views
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM products p
        JOIN stores s ON s.id = p.store_id
        WHERE p.id = product_id
        AND s.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM products p
        JOIN stores s ON s.id = p.store_id
        WHERE p.id = product_id
        AND s.user_id = auth.uid()
    )
);

-- Create helper function to get user's product IDs
CREATE OR REPLACE FUNCTION get_user_product_ids(user_uuid UUID)
RETURNS TABLE (product_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id
    FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE s.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
