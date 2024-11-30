-- Make product_id nullable in clicks table since we track both store and product views
ALTER TABLE clicks 
ALTER COLUMN product_id DROP NOT NULL;
