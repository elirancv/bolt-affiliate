export interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'starter' | 'professional' | 'business' | 'unlimited';
}

export interface UserMetadata {
  id: string;
  user_id: string;
  subscription_tier: User['subscription_tier'];
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  description: string;
  logo_url?: string;
  theme: string;
  social_links: SocialLinks;
  social_links_position: 'header' | 'footer' | 'both';
  created_at: string;
}

export interface SocialLinks {
  facebook?: string;
  facebook_messenger?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  snapchat?: string;
  pinterest?: string;
  discord?: string;
  whatsapp?: string;
  telegram?: string;
  google_business?: string;
}

export interface Product {
  id: string;
  store_id: string;
  title: string;
  description: string;
  affiliate_url: string;
  image_urls: string[];
  price: number;
  category: string;
  created_at: string;
}