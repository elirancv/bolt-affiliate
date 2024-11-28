export interface Product {
  id: string;
  store_id: string;
  title: string;
  description?: string;
  price: number;
  sale_price?: number;
  product_url: string;
  affiliate_url: string;
  image_urls: string[];
  category_id?: string;
  category?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

export interface ProductFormData {
  title: string;
  description?: string;
  price: number;
  sale_price?: number;
  product_url: string;
  affiliate_url: string;
  image_urls: string[];
  category_id?: string;
  status: 'active' | 'inactive';
}
