-- Drop the old image_url column
ALTER TABLE products DROP COLUMN IF EXISTS image_url;

-- Add the new image_urls column as an array of text
ALTER TABLE products ADD COLUMN image_urls TEXT[] NOT NULL DEFAULT '{}';
