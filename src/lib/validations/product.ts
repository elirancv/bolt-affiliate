import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be a positive number'),
  sale_price: z.number().min(0, 'Sale price must be a positive number').optional(),
  product_url: z.string().url('Please enter a valid product URL'),
  affiliate_url: z.string().url('Please enter a valid affiliate URL'),
  image_urls: z.array(z.string().url('Please enter a valid image URL')).min(1, 'At least one image is required'),
  category_id: z.string().min(1, 'Please select a category'),
  status: z.enum(['active', 'inactive']).default('active')
});

export type ProductFormData = z.infer<typeof productSchema>;
