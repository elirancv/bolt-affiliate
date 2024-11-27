import { supabase } from './supabase';

export async function trackProductClick(storeId: string, productId: string) {
  const today = new Date().toISOString().split('T')[0];

  try {
    // First, try to update existing record for today
    const { data, error: selectError } = await supabase
      .from('analytics')
      .select('*')
      .eq('store_id', storeId)
      .eq('date', today)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    if (data) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('analytics')
        .update({ 
          product_clicks: data.product_clicks + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (updateError) throw updateError;
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('analytics')
        .insert([{
          store_id: storeId,
          date: today,
          product_clicks: 1,
          page_views: 0,
          unique_visitors: 0
        }]);

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    console.error('Error tracking product click:', error);
    throw error;
  }
}

export async function trackPageView(storeId: string) {
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data, error: selectError } = await supabase
      .from('analytics')
      .select('*')
      .eq('store_id', storeId)
      .eq('date', today)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    if (data) {
      const { error: updateError } = await supabase
        .from('analytics')
        .update({ 
          page_views: data.page_views + 1,
          unique_visitors: data.unique_visitors + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('analytics')
        .insert([{
          store_id: storeId,
          date: today,
          page_views: 1,
          unique_visitors: 1,
          product_clicks: 0
        }]);

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    console.error('Error tracking page view:', error);
    throw error;
  }
}