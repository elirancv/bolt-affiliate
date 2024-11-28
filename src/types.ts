export interface Store {
  id: string;
  user_id: string;
  name: string;
  description: string;
  logo_url?: string;
  store_url?: string;
  theme?: string;
  social_links: Record<string, string>;
  social_links_position?: 'header' | 'footer' | 'both';
  affiliate_platform?: string;
  affiliate_id?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
  promotion_settings: PromotionSettings;
}

export interface PromotionSettings {
  show_free_shipping_banner: boolean;
  free_shipping_threshold: number;
  banner_text: string;
  banner_enabled: boolean;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  sale_price?: number;
  product_url: string;
  affiliate_url?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Click {
  id: string;
  store_id: string;
  product_id: string;
  source?: string;
  referrer?: string;
  created_at: string;
}

export interface StoreMetrics {
  store_id: string;
  store_name: string;
  product_count: number;
  click_count: number;
  total_commission: number;
}
