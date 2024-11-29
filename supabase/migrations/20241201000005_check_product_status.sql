-- Check product status
SELECT 
    id,
    name,
    status,
    created_at
FROM products
ORDER BY created_at DESC;
