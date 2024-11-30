-- Insert default categories if they don't exist
INSERT INTO public.categories (name, slug, type)
VALUES
    ('Electronics', 'electronics', 'product'),
    ('Fashion', 'fashion', 'product'),
    ('Home & Garden', 'home-garden', 'product'),
    ('Books', 'books', 'product'),
    ('Sports & Outdoors', 'sports-outdoors', 'product'),
    ('Health & Beauty', 'health-beauty', 'product'),
    ('Toys & Games', 'toys-games', 'product'),
    ('Automotive', 'automotive', 'product'),
    ('Pet Supplies', 'pet-supplies', 'product'),
    ('Food & Beverages', 'food-beverages', 'product'),
    ('Office Supplies', 'office-supplies', 'product'),
    ('Baby & Kids', 'baby-kids', 'product'),
    ('Jewelry', 'jewelry', 'product'),
    ('Art & Crafts', 'art-crafts', 'product'),
    ('Tools & Home Improvement', 'tools-home-improvement', 'product')
ON CONFLICT (slug) DO NOTHING;
