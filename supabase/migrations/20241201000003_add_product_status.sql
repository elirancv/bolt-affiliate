-- Create product status enum
CREATE TYPE public.product_status AS ENUM (
    'active',
    'inactive',
    'draft'
);

-- First add the status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'status') THEN
        ALTER TABLE public.products ADD COLUMN status TEXT;
    END IF;
END $$;

-- Set default value for existing rows
UPDATE public.products SET status = 'active' WHERE status IS NULL;

-- Now alter the column type and constraints
ALTER TABLE public.products 
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN status TYPE product_status USING (status::product_status);
