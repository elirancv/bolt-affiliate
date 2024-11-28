-- Test increment_page_view function
SELECT increment_page_view('25d871f7-313b-495c-9a3a-d4ea7436ab33', CURRENT_DATE);

-- Check if the page view was recorded
SELECT * FROM analytics 
WHERE store_id = '25d871f7-313b-495c-9a3a-d4ea7436ab33' 
AND date = CURRENT_DATE;

-- Test increment_product_clicks function
SELECT increment_product_clicks('25d871f7-313b-495c-9a3a-d4ea7436ab33', CURRENT_DATE);

-- Check if the product click was recorded
SELECT * FROM analytics 
WHERE store_id = '25d871f7-313b-495c-9a3a-d4ea7436ab33' 
AND date = CURRENT_DATE;

-- Check if the product exists
SELECT id, name, store_id, image_urls, status 
FROM products 
WHERE id = '9ce2211a-04f8-4f21-b97e-daa262787aae';

-- Check if the store exists and is accessible
SELECT id, name, user_id, status 
FROM stores 
WHERE id = '25d871f7-313b-495c-9a3a-d4ea7436ab33';
