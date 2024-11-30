import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { debounce } from 'lodash';
import { logger } from '../lib/logger';

export interface FeatureLimits {
  max_stores: number;
  total_products_limit: number;
  analytics_retention_days: number;
  current_stores?: number;
  current_products?: number;
  current_analytics_days?: number;
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
  setSubscription: (subscription: Subscription | null) => void;
  setFeatureLimits: (limits: FeatureLimits | null) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  featureLimits: null,
  isLoading: false,
  error: null,

  setSubscription: (subscription: Subscription | null) => set({ subscription }),
  setFeatureLimits: (limits: FeatureLimits | null) => set({ featureLimits: limits }),

  fetchCurrentSubscription: async () => {
    try {
      logger.debug('Fetching current subscription');
      const { data, error } = await supabase.rpc('get_current_subscription');
      
      if (error) {
        logger.error('Error fetching subscription:', error);
        set({ error: error as PostgrestError });
        return null;
      }
      
      const subscription = data?.[0] || null;
      logger.debug('Subscription fetched:', { subscription });
      
      set({ subscription, error: null });
      return subscription;
    } catch (error) {
      logger.error('Error in fetchCurrentSubscription:', error);
      set({ error: error as PostgrestError, subscription: null });
      return null;
    }
  },

  fetchFeatureLimits: async () => {
    try {
      set({ isLoading: true });
      logger.debug('Fetching feature limits');

      // Fetch feature limits and usage in one call
      const { data: usageData, error: usageError } = await supabase.rpc('get_user_dashboard_summary');
      
      if (usageError) {
        logger.error('Error fetching usage data:', usageError);
        set({ error: usageError as PostgrestError, isLoading: false });
        return null;
      }

      const usage = usageData?.[0];
      if (!usage) {
        logger.error('No usage data found');
        set({ isLoading: false });
        return null;
      }

      // Create feature limits object from the dashboard summary
      const limits: FeatureLimits = {
        max_stores: usage.stores_limit,
        total_products_limit: usage.products_limit,
        analytics_retention_days: 30, // Default to 30 days for now
        current_stores: usage.total_stores,
        current_products: usage.total_products,
        current_analytics_days: 0 // We'll implement this later
      };
      
      logger.debug('Feature limits and usage fetched:', { limits, usage });
      
      set({ featureLimits: limits, error: null, isLoading: false });
      return limits;
    } catch (error) {
      logger.error('Error in fetchFeatureLimits:', error);
      set({ error: error as PostgrestError, featureLimits: null, isLoading: false });
      return null;
    }
  },

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
  }
}));
