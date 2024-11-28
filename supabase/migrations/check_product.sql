-- Check if the store exists
SELECT id, name, user_id 
FROM stores 
WHERE id = 'efafc3b6-094d-423e-aa62-9eeb4ab264b8';

-- Check if the product exists
SELECT id, name, store_id, image_urls
FROM products 
WHERE id = 'b9107b1a-d00d-4e7d-9087-d8935a98c132';
