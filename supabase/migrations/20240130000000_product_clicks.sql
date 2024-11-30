-- Drop existing function and view
DROP FUNCTION IF EXISTS increment_product_clicks;
DROP VIEW IF EXISTS product_clicks_view;

-- Add required columns and constraints
DO $$ 
BEGIN
    -- Add count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_clicks' 
        AND column_name = 'count'
    ) THEN
        ALTER TABLE product_clicks ADD COLUMN count INTEGER DEFAULT 1;
    END IF;

    -- Add clicked_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_clicks' 
        AND column_name = 'clicked_at'
    ) THEN
        ALTER TABLE product_clicks ADD COLUMN clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'product_clicks_product_id_key'
    ) THEN
        ALTER TABLE product_clicks ADD CONSTRAINT product_clicks_product_id_key UNIQUE (product_id);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for all users" ON product_clicks;
CREATE POLICY "Enable read access for all users" 
    ON product_clicks
    FOR SELECT 
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON product_clicks;
CREATE POLICY "Enable insert for authenticated users" 
    ON product_clicks
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON product_clicks;
CREATE POLICY "Enable update for authenticated users" 
    ON product_clicks
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create function to increment product clicks
CREATE OR REPLACE FUNCTION increment_product_clicks(p_product_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO product_clicks (product_id, clicked_at)
    VALUES (p_product_id, CURRENT_TIMESTAMP)
    ON CONFLICT ON CONSTRAINT product_clicks_product_id_key
    DO UPDATE SET 
        count = COALESCE(product_clicks.count, 0) + 1,
        clicked_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON product_clicks TO authenticated;
GRANT EXECUTE ON FUNCTION increment_product_clicks TO authenticated;

-- Recreate the view
CREATE OR REPLACE VIEW product_clicks_view AS
SELECT pc.*, p.name as product_name
FROM product_clicks pc
LEFT JOIN products p ON pc.product_id = p.id;
