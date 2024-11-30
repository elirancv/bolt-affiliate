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
  is_active: boolean;
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

export type CategoryType = 'custom' | 'predefined';

export interface Category {
  id: string;
  store_id?: string;
  name: string;
  description?: string;
  type: CategoryType;
  slug: string;
  productCount?: number;
  products?: Array<{
    product: {
      id: string;
      name: string;
    };
  }>;
}

export interface ProductCategory {
  product_id: string;
  category_id: string;
  created_at: string;
}

export type ProductStatus = 'active' | 'inactive' | 'draft';

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  price?: number | null;
  sale_price?: number | null;
  product_url?: string;
  affiliate_url: string;
  image_urls?: string[];
  category_id?: string;
  status: ProductStatus;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  total_views?: number;
  total_clicks?: number;
  conversion_rate?: number;
  period_clicks?: number;
  stores?: {
    id: string;
    name: string;
  };
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
