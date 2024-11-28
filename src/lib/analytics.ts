import { format } from 'date-fns';
import { supabase } from './supabase';

export async function trackProductClick(storeId: string, productId: string) {
  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    // Track the click in analytics
    const { error: analyticsError } = await supabase.rpc(
      'increment_product_clicks',
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
    console.error('Error tracking product click:', error);
    throw error;
  }
}

export async function trackPageView(storeId: string) {
  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    // Track the page view in analytics
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
    // Don't throw the error to prevent breaking navigation
    return false;
  }
}

export async function getStoreAnalytics(storeId: string, days: number = 30) {
  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false })
      .limit(days);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

export async function getTopProducts(storeId: string) {
  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId);

    if (productsError) throw productsError;

    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('product_clicks')
      .eq('store_id', storeId);

    if (analyticsError) throw analyticsError;

    const totalClicks = analytics?.reduce((sum, record) => 
      sum + (record.product_clicks || 0), 0) || 0;

    return (products || []).map(product => ({
      ...product,
      clicks: totalClicks
    }));
  } catch (error) {
    console.error('Error fetching top products:', error);
    throw error;
  }
}