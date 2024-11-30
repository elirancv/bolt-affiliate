-- Create clicks table if it doesn't exist
CREATE TABLE IF NOT EXISTS clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL,
    product_id uuid,
    clicks integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Make product_id nullable in clicks table since we track both store and product views
ALTER TABLE clicks 
ALTER COLUMN product_id DROP NOT NULL;
