import { supabase } from './supabase';
import type { Store, Product, StoreMetrics, Click, Category } from '../types';
import { format } from 'date-fns';

export async function createStore(store: Omit<Store, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('User not authenticated');
    }

    // Create store with required fields only
    const { data, error } = await supabase
      .from('stores')
      .insert([{
        user_id: store.user_id,
        name: store.name,
        description: store.description,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Store creation error:', error);
      throw new Error('Failed to create store: ' + error.message);
    }
    return data;
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
}

export async function getStores(userId: string) {
  try {
    // Get all stores with their products
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select(`
        *,
        products(id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (storesError) throw storesError;

    // Get product clicks for all products
    const productIds = stores?.flatMap(store => 
      store.products?.map(product => product.id) || []
    ) || [];

    const { data: clicks, error: clicksError } = await supabase
      .from('product_clicks')
      .select('product_id, count')
      .in('product_id', productIds);

    if (clicksError) throw clicksError;

    // Combine store data with metrics
    const storesWithMetrics = stores.map(store => {
      const storeProductIds = store.products?.map(p => p.id) || [];
      const storeClicks = clicks?.filter(click => 
        storeProductIds.includes(click.product_id)
      ) || [];
      const totalClicks = storeClicks.reduce((sum, click) => sum + (click.count || 0), 0);

      return {
        ...store,
        productsCount: store.products?.length || 0,
        totalClicks,
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
    // Get store basic info with products count
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select(`
        *,
        products(count)
      `)
      .eq('id', storeId)
      .single();

    if (storeError) {
      console.error('Store fetch error:', storeError);
      throw storeError;
    }

    // Get product clicks from the view
    const { data: clicksData, error: clicksError } = await supabase
      .from('product_clicks_view')
      .select('*')
      .eq('store_id', storeId);

    if (clicksError) {
      console.error('Clicks fetch error:', clicksError);
    }

    // Get analytics data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (analyticsError) {
      console.error('Analytics fetch error:', analyticsError);
    }

    // Calculate metrics
    const totalClicks = clicksData?.length || 0;
    const totalCommission = analytics?.reduce((sum, record) => sum + (record.commission || 0), 0) || 0;

    return {
      ...store,
      productsCount: store.products?.[0]?.count || 0,
      totalClicks: totalClicks,
      totalCommission: totalCommission,
      approvedCommissions: 0 // This will be implemented later
    };
  } catch (error) {
    console.error('Error getting store:', error);
    throw error;
  }
}

export async function getPublicStore(storeId: string) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching public store:', storeId);
    }
    
    // First, try to get the store without any filters to see if it exists
    const { data: rawStore, error: rawError } = await supabase
      .from('stores')
      .select('id, name, is_active')
      .eq('id', storeId)
      .single()
      .returns<{ id: string; name: string; is_active: boolean } | null>();

    if (rawError) {
      console.error('Error checking store existence:', rawError);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('Raw store data:', rawStore);
    }

    // Now try with the active filter
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .eq('is_active', true)
      .single();

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

    // Get products for this store
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId);

    if (products && products.length > 0) {
      // Get total clicks for all products in this store
      const { data: clicks } = await supabase
        .from('product_clicks')
        .select('count')
        .in('product_id', products.map(p => p.id));

      store.totalClicks = clicks?.reduce((sum, click) => sum + (click.count || 0), 0) || 0;
    } else {
      store.totalClicks = 0;
    }

    if (!store) {
      console.error('Store not found or not active:', storeId);
      if (rawStore) {
        console.log('Store exists but might be inactive. Status:', rawStore.is_active);
      }
      throw new Error('Store not found or not accessible');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Successfully found active store:', store.id, store.name);
    }
    return store;
  } catch (error) {
    console.error('Error getting public store:', error);
    throw error;
  }
}

export async function getPublicProducts(storeId: string) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching public products for store:', storeId);
    }
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

    if (process.env.NODE_ENV === 'development') {
      console.log(`Found ${products?.length || 0} products`);
    }
    return products || [];
  } catch (error) {
    console.error('Error getting public products:', error);
    throw error;
  }
}

export async function getPublicCategories(storeId: string) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching public categories for store:', storeId);
    }
    
    // Get all categories first
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id,
        name
      `)
      .order('name');

    if (error) {
      console.error('Supabase error fetching categories:', error);
      throw error;
    }

    // Check if there are any featured products for this store
    const { data: featuredProducts, error: featuredError } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('is_featured', true)
      .limit(1);

    if (featuredError) {
      console.error('Error checking featured products:', featuredError);
      throw featuredError;
    }

    // Add Best Sellers category if there are featured products
    const allCategories = [...(categories || [])];
    if (featuredProducts && featuredProducts.length > 0) {
      allCategories.push({
        id: 'best-sellers',
        name: 'Best Sellers'
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Found ${allCategories.length} categories`);
    }
    return allCategories;
  } catch (error) {
    console.error('Error getting public categories:', error);
    throw error;
  }
}

export async function updateStore(storeId: string, updates: Partial<Store>) {
  try {
    // Remove computed fields and non-existent fields that shouldn't be updated
    const {
      productsCount,
      totalClicks,
      totalCommission,
      approvedCommissions,
      products,
      metrics,
      social_links,
      promotion_settings,
      ...updateData
    } = updates as any;
    
    // Only keep fields that exist in the stores table
    const validFields = {
      name: updateData.name,
      description: updateData.description,
      is_active: updateData.is_active,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('stores')
      .update(validFields)
      .eq('id', storeId)
      .select('*')
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
    return true;
  } catch (error) {
    console.error('Error deleting store:', error);
    throw error;
  }
}

export async function createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating product with data:', data);
    }
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([{
        ...data,
        status: data.status || 'active',
        is_featured: data.is_featured || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Product created successfully:', newProduct);
    }
    return newProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function getProducts(storeId?: string): Promise<Product[]> {
  try {
    let query = supabase
      .from('product_details')
      .select('*');

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

export async function getCategories(storeId: string): Promise<Category[]> {
  try {
    // Get all categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id,
        name
      `)
      .order('name');

    if (error) throw error;

    // Check if there are any featured products
    const { data: featuredProducts, error: featuredError } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('is_featured', true)
      .limit(1);

    if (featuredError) throw featuredError;

    // Add Best Sellers category if there are featured products
    const allCategories = [...(categories || [])];
    if (featuredProducts && featuredProducts.length > 0) {
      allCategories.push({
        id: 'best-sellers',
        name: 'Best Sellers'
      });
    }

    return allCategories;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
}

export async function createCategory(storeId: string, name: string, description?: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        store_id: storeId,
        name,
        description,
        type: 'custom',
        slug: name.toLowerCase().replace(/\s+/g, '-')
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

export async function updateCategory(categoryId: string, updates: Partial<Category>) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

export async function updateProductCategories(productId: string, categoryIds: string[]) {
  try {
    // First delete existing category relationships
    const { error: deleteError } = await supabase
      .from('products_categories')
      .delete()
      .eq('product_id', productId);

    if (deleteError) {
      console.error('Error deleting product categories:', deleteError);
      throw deleteError;
    }

    // Then insert new category relationships
    if (categoryIds.length > 0) {
      const { error: insertError } = await supabase
        .from('products_categories')
        .insert(
          categoryIds.map(categoryId => ({
            product_id: productId,
            category_id: categoryId
          }))
        );

      if (insertError) {
        console.error('Error inserting product categories:', insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Error updating product categories:', error);
    throw error;
  }
}

export async function updateProduct(productId: string, data: Partial<Product>) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Updating product:', productId, 'with data:', data);
    }
    const { error } = await supabase
      .from('products')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Product updated successfully');
    }
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

    if (process.env.NODE_ENV === 'development') {
      console.log('Schema check result:', data);
    }
    return data;
  } catch (error) {
    console.error('Error checking schema:', error);
    throw error;
  }
}

export async function trackPageView(storeId: string) {
  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    // First try to increment page views
    const { error: analyticsError } = await supabase.rpc(
      'increment_page_views',
      { 
        p_store_id: storeId,
        p_date: today
      }
    );

    // If the function doesn't exist, fall back to direct table insert/update
    if (analyticsError?.message?.includes('Could not find the function')) {
      const { error: insertError } = await supabase
        .from('analytics')
        .upsert({
          store_id: storeId,
          date: today,
          page_views: 1
        }, {
          onConflict: 'store_id,date',
          count: 'exact'
        });

      if (insertError) throw insertError;
    } else if (analyticsError) {
      throw analyticsError;
    }

    // Update store metrics
    const { error: metricsError } = await supabase.rpc(
      'refresh_store_metrics',
      { store_id: storeId }
    );

    if (metricsError) {
      console.error('Error refreshing store metrics:', metricsError);
      // Don't throw here, as this is a secondary operation
    }

    return true;
  } catch (error) {
    console.error('Error tracking page view:', error);
    // Don't throw the error, just return false to indicate failure
    return false;
  }
}

export async function trackProductClick(storeId: string, productId: string) {
  try {
    const { error } = await supabase
      .rpc('increment_product_clicks', {
        p_product_id: productId,
        p_store_id: storeId
      });

    if (error) {
      console.error('Error tracking product click:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error tracking product click:', error);
    throw error;
  }
}

export async function updateProductFeatureStatus(productId: string, isFeature: boolean) {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_featured: isFeature })
      .eq('id', productId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating product feature status:', error);
    throw error;
  }
}