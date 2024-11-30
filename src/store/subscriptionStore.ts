import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { debounce } from 'lodash';

export interface FeatureLimits {
  max_stores: number;
  total_products_limit: number;
  analytics_retention_days: number;
}

export interface Subscription {
  user_id: string;
  tier: string;
  active: boolean;
  start_date: string;
  end_date: string;
  billing_period_start: string;
  billing_period_end: string;
  days_remaining: number;
  subscription_status: 'active' | 'expired' | 'inactive' | 'past_due';
}

interface SubscriptionStore {
  subscription: Subscription | null;
  featureLimits: FeatureLimits | null;
  isLoading: boolean;
  error: PostgrestError | null;
  fetchCurrentSubscription: () => Promise<Subscription | null>;
  fetchFeatureLimits: () => Promise<FeatureLimits | null>;
  isWithinLimits: (type: 'stores' | 'products', currentCount: number) => boolean;
  getRemainingLimit: (type: 'stores' | 'products', currentCount: number) => number;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  featureLimits: null,
  isLoading: false,
  error: null,

  fetchCurrentSubscription: debounce(async () => {
    if (get().isLoading) return null; // Prevent concurrent fetches
    
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('get_current_subscription');
      if (error) {
        set({ 
          error: error as PostgrestError, 
          isLoading: false,
          subscription: null 
        });
        return null;
      }
      
      // Data will be an array with one row
      const subscription = data?.[0] || null;
      const currentSub = get().subscription;
      
      // Only update if the subscription has actually changed
      if (JSON.stringify(subscription) !== JSON.stringify(currentSub)) {
        set({ 
          subscription, 
          error: null,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
      
      return subscription;
    } catch (error) {
      set({ 
        error: error as PostgrestError,
        isLoading: false,
        subscription: null 
      });
      return null;
    }
  }, 500),

  fetchFeatureLimits: debounce(async () => {
    if (get().isLoading) return null; // Prevent concurrent fetches
    
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('get_user_feature_limits');
      if (error) {
        set({ 
          error: error as PostgrestError, 
          isLoading: false,
          featureLimits: null 
        });
        return null;
      }
      
      // Data will be an array with one row
      const featureLimits = data?.[0] || null;
      const currentLimits = get().featureLimits;
      
      // Only update if the limits have actually changed
      if (JSON.stringify(featureLimits) !== JSON.stringify(currentLimits)) {
        set({ 
          featureLimits, 
          error: null,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
      
      return featureLimits;
    } catch (error) {
      set({ 
        error: error as PostgrestError,
        isLoading: false,
        featureLimits: null 
      });
      return null;
    }
  }, 500),

  isWithinLimits: (type: 'stores' | 'products', currentCount: number) => {
    const { featureLimits } = get();
    if (!featureLimits) return false;

    switch (type) {
      case 'stores':
        return currentCount < featureLimits.max_stores;
      case 'products':
        return currentCount < featureLimits.total_products_limit;
      default:
        return false;
    }
  },

  getRemainingLimit: (type: 'stores' | 'products', currentCount: number) => {
    const { featureLimits } = get();
    if (!featureLimits) return 0;

    switch (type) {
      case 'stores':
        return Math.max(0, featureLimits.max_stores - currentCount);
      case 'products':
        return Math.max(0, featureLimits.total_products_limit - currentCount);
      default:
        return 0;
    }
  },
}));
