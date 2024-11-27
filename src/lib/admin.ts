import { supabase } from './supabase';
import { format, subDays } from 'date-fns';

export async function checkAdminStatus() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('Admin email not configured');
      return false;
    }

    return session.user.email === adminEmail;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getAdminStats() {
  try {
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      throw new Error('Unauthorized');
    }

    // Get last 30 days date range
    const endDate = new Date();
    const startDate = subDays(endDate, 30);

    // Get all stores with their products
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        created_at,
        products (
          id,
          price,
          created_at
        )
      `);

    if (storesError) throw storesError;

    // Get all analytics data for the last 30 days
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'));

    if (analyticsError) throw analyticsError;

    // Get user metadata
    const { data: userMetadata, error: metadataError } = await supabase
      .from('user_metadata')
      .select('*');

    if (metadataError) throw metadataError;

    // Get all users
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // Calculate statistics
    const totalStores = stores?.length || 0;
    const totalProducts = stores?.reduce((sum, store) => 
      sum + (store.products?.length || 0), 0) || 0;

    // Calculate analytics totals
    const analyticsTotals = analytics?.reduce((acc, record) => ({
      pageViews: acc.pageViews + (record.page_views || 0),
      visitors: acc.visitors + (record.unique_visitors || 0),
      clicks: acc.clicks + (record.product_clicks || 0)
    }), { pageViews: 0, visitors: 0, clicks: 0 });

    // Calculate subscription tiers
    const usersByTier = {
      free: 0,
      starter: 0,
      professional: 0,
      business: 0,
      unlimited: 0
    };

    userMetadata?.forEach(meta => {
      const tier = meta.subscription_tier.toLowerCase();
      if (tier in usersByTier) {
        usersByTier[tier as keyof typeof usersByTier]++;
      }
    });

    // Fill in activity data for all dates in range
    const activityByDate: Record<string, any> = {};
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayAnalytics = analytics?.filter(a => a.date === dateStr) || [];
      
      activityByDate[dateStr] = {
        pageViews: dayAnalytics.reduce((sum, record) => sum + (record.page_views || 0), 0),
        visitors: dayAnalytics.reduce((sum, record) => sum + (record.unique_visitors || 0), 0),
        clicks: dayAnalytics.reduce((sum, record) => sum + (record.product_clicks || 0), 0)
      };
      
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    // Calculate store performance
    const storePerformance = stores?.map(store => {
      const storeAnalytics = analytics?.filter(a => a.store_id === store.id) || [];
      const totalClicks = storeAnalytics.reduce((sum, record) => 
        sum + (record.product_clicks || 0), 0);

      return {
        id: store.id,
        name: store.name,
        productsCount: store.products?.length || 0,
        totalClicks,
        createdAt: store.created_at
      };
    });

    // Process users with metadata
    const processedUsers = authUsers.map(user => {
      const metadata = userMetadata?.find(meta => meta.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        subscription_tier: metadata?.subscription_tier || 'free',
        is_admin: user.email === import.meta.env.VITE_ADMIN_EMAIL
      };
    });

    return {
      totalUsers: processedUsers.length,
      usersByTier,
      totalStores,
      totalProducts,
      totalPageViews: analyticsTotals?.pageViews || 0,
      totalVisitors: analyticsTotals?.visitors || 0,
      totalClicks: analyticsTotals?.clicks || 0,
      averageStoresPerUser: totalStores / (processedUsers.length || 1),
      averageProductsPerStore: totalProducts / (totalStores || 1),
      activityByDate,
      storePerformance: storePerformance || [],
      users: processedUsers
    };
  } catch (error) {
    console.error('Error loading admin stats:', error);
    throw error;
  }
}