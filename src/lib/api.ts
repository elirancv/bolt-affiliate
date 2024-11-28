import { supabase } from './supabase';
import type { Store, Product, StoreMetrics, Click } from '../types';
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
    console.log('Creating product with data:', product);
    
    // Check schema first
    await checkSchema(product);
    
    // First check if category_id is provided and exists
    if (product.category_id) {
      console.log('Checking category:', product.category_id);
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', product.category_id)
        .single();

      if (categoryError) {
        console.error('Category error:', categoryError);
        throw new Error('Invalid category_id');
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...product,
        status: product.status || 'active'
      }])
      .select()
      .single();

    if (error) {
      console.error('Product creation error:', error);
      throw error;
    }
    
    console.log('Product created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function getProducts(storeId: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

export async function getCategories(storeId: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .order('name', { ascending: true });

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