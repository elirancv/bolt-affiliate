import { format } from 'date-fns';
import { supabase } from './supabase';

export async function trackProductClick(storeId: string, productId: string) {
  try {
    // Track the click using increment_product_clicks function
    const { error } = await supabase.rpc(
      'increment_product_clicks',
      { 
        p_product_id: productId
      }
    );

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

    // Record the view with source information
    const { error: clickError } = await supabase
      .from('clicks')
      .insert({
        store_id: storeId,
        source: window.location.hostname,
        referrer: document.referrer
      });

    if (clickError) throw clickError;

    return true;
  } catch (error) {
    console.error('Error tracking page view:', error);
    return false;
  }
}

export async function getStoreAnalytics(storeId: string) {
  try {
    const { data, error } = await supabase
      .from('store_metrics')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting store analytics:', error);
    return null;
  }
}