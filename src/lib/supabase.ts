import { createClient } from '@supabase/supabase-js';
import { logger } from '../services/logger';
import { format, subDays } from 'date-fns';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'bolt-affiliate-auth'
  }
});

// Add error logging
let lastSignInTime = 0;
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Prevent duplicate logs within 5 seconds
    const now = Date.now();
    if (now - lastSignInTime > 5000) {
      lastSignInTime = now;
      logger.info('User signed in', { 
        userId: session?.user?.id,
        email: session?.user?.email 
      });
    }
  } else if (event === 'SIGNED_OUT') {
    logger.info('User signed out');
  } else if (event === 'TOKEN_REFRESHED') {
    logger.debug('Auth token refreshed');
  }
});

// Admin status check
export async function checkAdminStatus(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Call the secure function
    const { data, error } = await supabase.rpc('check_admin_status');
    
    if (error) {
      logger.error('Error checking admin status:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    logger.error('Error checking admin status:', error);
    return false;
  }
}

// Get stores
export async function getStores() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        products(count)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching stores:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error getting stores:', error);
    throw error;
  }
}

// Get store products
export async function getStoreProducts(storeId: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching store products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error getting store products:', error);
    throw error;
  }
}

// Create store
export async function createStore(storeData: {
  name: string;
  description?: string;
  theme?: string;
  social_links?: any;
  social_links_position?: string;
  status?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('stores')
      .insert([
        {
          user_id: user.id,
          ...storeData
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error('Error creating store:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error creating store:', error);
    throw error;
  }
}

// Admin stats retrieval
export async function getAdminStats(timeRange: string = '24h'): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_admin_stats', {
      time_range: timeRange
    });

    if (error) {
      logger.error('Error fetching admin stats:', error);
      throw error;
    }

    return {
      totalUsers: data.totalUsers || 0,
      usersByTier: data.usersByTier || {},
      users: data.users || [],
      // Default values for other stats until we implement them
      totalStores: 0,
      totalProducts: 0,
      totalPageViews: 0,
      totalVisitors: 0,
      totalClicks: 0,
      averageStoresPerUser: 0,
      averageProductsPerStore: 0,
      activityByDate: {},
      storePerformance: []
    };
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    throw error;
  }
}