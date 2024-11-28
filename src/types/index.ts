export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  subscription_tier: 'free' | 'premium';
};

export interface AffiliateNetwork {
  id: string;
  name: string;
  website?: string;
  api_endpoint?: string;
  created_at: string;
  updated_at: string;
}

export interface PayoutInfo {
  id: string;
  user_id: string;
  payment_method: string;
  payment_details: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialLinks {
  facebook?: string;
  messenger?: string;
  instagram?: string;
  whatsapp?: string;
  google_maps?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  snapchat?: string;
  pinterest?: string;
  discord?: string;
  telegram?: string;
  google_business?: string;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  store_url?: string;
  theme: string;
  social_links: SocialLinks;
  social_links_position: 'header' | 'footer' | 'both';
  affiliate_network_id?: string;
  affiliate_id?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
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
  price?: number;
  sale_price?: number;
  product_url: string;
  affiliate_url?: string;
  image_urls?: string[];
  clicks?: number;
  last_clicked_at?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  id: string;
  store_id: string;
  theme_settings: Record<string, any>;
  custom_domain?: string;
  analytics_settings: Record<string, any>;
  notification_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Click {
  id: string;
  store_id: string;
  product_id: string;
  source?: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  country_code?: string;
  clicked_at: string;
}

export interface Commission {
  id: string;
  store_id: string;
  product_id?: string;
  click_id?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  transaction_id?: string;
  commission_date: string;
  created_at: string;
  updated_at: string;
}

export interface StoreMetrics {
  store_id: string;
  store_name: string;
  product_count: number;
  click_count: number;
  total_commission: number;
  approved_commissions: number;
  last_updated: string;
}