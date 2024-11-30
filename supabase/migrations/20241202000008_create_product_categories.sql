-- Create the products_categories junction table
CREATE TABLE IF NOT EXISTS products_categories (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, category_id)
);

-- Add RLS policies for products_categories
ALTER TABLE products_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product categories from their own stores"
    ON products_categories FOR SELECT
    USING (product_id IN (
        SELECT id FROM products WHERE store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert product categories for their own stores"
    ON products_categories FOR INSERT
    WITH CHECK (product_id IN (
        SELECT id FROM products WHERE store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete product categories from their own stores"
    ON products_categories FOR DELETE
    USING (product_id IN (
        SELECT id FROM products WHERE store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    ));

-- Grant permissions to authenticated users
GRANT ALL ON TABLE products_categories TO authenticated;
