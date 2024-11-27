export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Books',
  'Health & Beauty',
  'Sports & Outdoors',
  'Toys & Games',
  'Automotive',
  'Pet Supplies',
  'Office Products',
  'Food & Beverages',
  'Art & Crafts',
  'Baby & Kids',
  'Tools & Home Improvement',
  'Custom'
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];