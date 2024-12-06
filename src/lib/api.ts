import { supabase } from './supabase';
import type { Store, Product, StoreMetrics, Click, Category } from '../types';
import { format } from 'date-fns';

export async function createStore(store: Omit<Store, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('stores')
      .insert([{
        ...store,
        user_id: session.session.user.id,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
}

export async function getStores(userId: string) {
  try {
    // Get all stores with their products count
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select(`
        *,
        products:products(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (storesError) throw storesError;

    // Get analytics data for all stores
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .in('store_id', stores?.map(store => store.id) || [])
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (analyticsError) throw analyticsError;

    // Combine store data with metrics
    const storesWithMetrics = stores.map(store => {
      const storeAnalytics = analytics?.filter(a => a.store_id === store.id) || [];
      const totalClicks = storeAnalytics.reduce((sum, record) => sum + (record.product_clicks || 0), 0);

      return {
        ...store,
        productsCount: store.products[0].count,
        totalClicks,
        totalCommission: 0, // This will be implemented later
        approvedCommissions: 0, // This will be implemented later
        lastUpdated: store.updated_at
      };
    });

    return storesWithMetrics;
  } catch (error) {
    console.error('Error getting stores:', error);
    throw error;
  }
}

export async function getStore(storeId: string) {
  try {
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError) throw storeError;

    // Get store metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('store_metrics')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (metricsError && metricsError.code !== 'PGRST116') throw metricsError;

    return {
      ...store,
      productsCount: metrics?.product_count || 0,
      totalClicks: metrics?.click_count || 0,
      totalCommission: metrics?.total_commission || 0,
      approvedCommissions: metrics?.approved_commissions || 0
    };
  } catch (error) {
    console.error('Error getting store:', error);
    throw error;
  }
}

export async function getPublicStore(storeId: string) {
  try {
    console.log('Fetching public store:', storeId);
    
    // First, try to get the store without any filters to see if it exists
    const { data: rawStore, error: rawError } = await supabase
      .from('stores')
      .select('id, name, status')
      .eq('id', storeId)
      .single()
      .returns<{ id: string; name: string; status: string } | null>();

    if (rawError) {
      console.error('Error checking store existence:', rawError);
    } else {
      console.log('Raw store data:', rawStore);
    }

    // Now try with the active filter
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .eq('status', 'active')
      .single()
      .returns<Store | null>();

    if (storeError) {
      console.error('Supabase error fetching active store:', {
        error: storeError,
        message: storeError.message,
        details: storeError.details,
        hint: storeError.hint,
        code: storeError.code
      });
      throw storeError;
    }

    if (!store) {
      console.error('Store not found or not active:', storeId);
      if (rawStore) {
        console.log('Store exists but might be inactive. Status:', rawStore.status);
      }
      throw new Error('Store not found or not accessible');
    }

    console.log('Successfully found active store:', store.id, store.name);
    return store;
  } catch (error) {
    console.error('Error getting public store:', error);
    throw error;
  }
}

export async function getPublicProducts(storeId: string) {
  try {
    console.log('Fetching public products for store:', storeId);
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'active')
      .returns<Product[]>();

    if (error) {
      console.error('Supabase error fetching products:', error);
      throw error;
    }

    console.log(`Found ${products?.length || 0} products`);
    return products || [];
  } catch (error) {
    console.error('Error getting public products:', error);
    throw error;
  }
}

export async function getPublicCategories(storeId: string) {
  try {
    console.log('Fetching public categories for store:', storeId);
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .returns<Category[]>();

    if (error) {
      console.error('Supabase error fetching categories:', error);
      throw error;
    }

    console.log(`Found ${categories?.length || 0} categories`);
    return categories || [];
  } catch (error) {
    console.error('Error getting public categories:', error);
    throw error;
  }
}

export async function updateStore(storeId: string, updates: Partial<Store>) {
  try {
    // Remove computed fields that shouldn't be updated
    const { productsCount, totalClicks, totalCommission, approvedCommissions, ...updateData } = updates as any;
    
    // Ensure social_links is an object
    if (!updateData.social_links) {
      updateData.social_links = {};
    }

    // Only set promotion_settings if it exists in the update
    if (updateData.promotion_settings) {
      updateData.promotion_settings = {
        ...updateData.promotion_settings
      };
    }

    const { data, error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', storeId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating store:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error updating store:', error);
    throw error;
  }
}

export async function deleteStore(storeId: string) {
  try {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting store:', error);
    throw error;
  }
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
  try {
    // Check if user is authenticated
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('User not authenticated');
    }

    // Check if user has access to the store
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('id', product.store_id)
      .eq('user_id', session.session.user.id)
      .single();

    if (!store) {
      throw new Error('Store not found or user does not have access');
    }

    // Create the product
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...product,
        clicks: 0,
        last_clicked_at: null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function getProducts(storeId?: string): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        store:stores(id, name, logo_url)
      `)
      .order('created_at', { ascending: false });

    if (storeId) {
      query = query.eq('store_id', storeId);
    } else {
      // If no store ID is provided, get products from all stores but only active ones
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

export async function getCategories(storeId: string): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
}

export async function createCategory(storeId: string, name: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        store_id: storeId,
        name
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

export async function updateProduct(productId: string, updates: Partial<Product>) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function trackClick(storeId: string, productId: string, clickData: Partial<Click>) {
  try {
    const { data, error } = await supabase
      .from('clicks')
      .insert([{
        store_id: storeId,
        product_id: productId,
        ...clickData
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error tracking click:', error);
    throw error;
  }
}

export async function refreshMetrics() {
  try {
    const { error } = await supabase.rpc('refresh_materialized_view_store_metrics');
    if (error) throw error;
  } catch (error) {
    console.error('Error refreshing metrics:', error);
    throw error;
  }
}

export async function checkSchema(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .rpc('check_schema', { product });

    if (error) {
      console.error('Schema check error:', error);
      throw error;
    }

    console.log('Schema check result:', data);
    return data;
  } catch (error) {
    console.error('Error checking schema:', error);
    throw error;
  }
}

export async function trackPageView(storeId: string) {
  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    const { error: analyticsError } = await supabase.rpc(
      'increment_page_views',
      { 
        p_store_id: storeId,
        p_date: today
      }
    );

    if (analyticsError) throw analyticsError;

    // Update store metrics
    const { error: metricsError } = await supabase.rpc(
      'refresh_store_metrics',
      { store_id: storeId }
    );

    if (metricsError) throw metricsError;

    return true;
  } catch (error) {
    console.error('Error tracking page view:', error);
    throw error;
  }
}

export async function trackProductClick(storeId: string, productId: string) {
  try {
    // Use the increment_product_clicks function to update both analytics and product clicks
    const { error } = await supabase.rpc('increment_product_clicks', {
      p_store_id: storeId,
      p_product_id: productId
    });

    if (error) {
      console.error('Error in increment_product_clicks:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error tracking product click:', error);
    throw error;
  }
}