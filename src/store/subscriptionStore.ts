import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface FeatureLimits {
  max_stores: number;
  total_products_limit: number;
  analytics_retention_days: number;
}

interface SubscriptionState {
  currentPlan: any;
  availablePlans: [];
  isLoading: boolean;
  error: string | null;
  featureLimits: FeatureLimits | null;
  tier: string | null;
  fetchCurrentPlan: () => Promise<void>;
  fetchAvailablePlans: () => Promise<void>;
  upgradePlan: (planId: string) => Promise<{ sessionId: string; url: string }>;
  cancelSubscription: () => Promise<void>;
  reactivateSubscription: () => Promise<void>;
  updateFeatureLimits: (limits: FeatureLimits) => void;
  isWithinLimits: (type: 'stores' | 'products', currentCount: number) => boolean;
  getRemainingLimit: (type: 'stores' | 'products', currentCount: number) => number;
  fetchFeatureLimits: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  currentPlan: null,
  availablePlans: [],
  isLoading: false,
  error: null,
  featureLimits: null,
  tier: null,

  fetchCurrentPlan: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        set({ currentPlan: null, isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (error) throw error;

      // If we have a subscription with a Stripe subscription ID, fetch the plan details
      if (data?.stripe_subscription_id) {
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('stripe_price_id', data.stripe_price_id)
          .single();

        if (!planError && planData) {
          data.plan = planData;
        }
      }

      set({ 
        currentPlan: {
          ...data,
          plan: data?.plan || {
            name: data?.tier || 'Free',
            description: 'Free tier',
            price: 0,
            billing_interval: 'month'
          }
        }, 
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchAvailablePlans: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('subscription_plans')
        .select(`
          *,
          features:plan_feature_limits (
            feature_code,
            limit_value
          )
        `)
        .eq('status', 'active')
        .order('price');

      if (error) throw error;
      set({ availablePlans: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  upgradePlan: async (planId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/subscription-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/dashboard?subscription=cancelled`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  cancelSubscription: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/subscription-management', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await get().fetchCurrentPlan();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  reactivateSubscription: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/subscription-management', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ action: 'reactivate' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      await get().fetchCurrentPlan();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateFeatureLimits: (limits: FeatureLimits) => {
    set({ featureLimits: limits });
  },

  fetchFeatureLimits: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('user_feature_limits')
        .select('*')
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('No feature limits found');
      }

      const limits: FeatureLimits = {
        max_stores: data.limits.max_stores,
        total_products_limit: data.limits.total_products_limit,
        analytics_retention_days: data.limits.analytics_retention_days
      };

      set({
        featureLimits: limits,
        tier: data.tier,
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch feature limits', 
        isLoading: false,
        featureLimits: null,
        tier: null
      });
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
  },
}));

export const fetchCurrentPlan = async () => {
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return subscription ? subscription.plan : 'free';
  } catch (error) {
    return 'free';
  }
};
