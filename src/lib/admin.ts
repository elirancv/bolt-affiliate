import { supabase } from './supabase';

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

    // Get users from auth.users using service role
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Get all analytics data
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('analytics')
      .select(`
        store_id,
        page_views,
        unique_visitors,
        product_clicks,
        date
      `);

    if (analyticsError) throw analyticsError;

    // Get stores with products
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select(`
        *,
        products (
          id,
          price,
          affiliate_url,
          created_at
        )
      `);

    if (storesError) throw storesError;

    // Get user metadata
    const { data: userMetadata, error: metadataError } = await supabase
      .from('user_metadata')
      .select('*');

    if (metadataError) throw metadataError;

    // Calculate statistics
    const totalStores = stores?.length || 0;
    const totalProducts = stores?.reduce((sum, store) => sum + (store.products?.length || 0), 0) || 0;
    const totalPageViews = analyticsData?.reduce((sum, record) => sum + record.page_views, 0) || 0;
    const totalVisitors = analyticsData?.reduce((sum, record) => sum + record.unique_visitors, 0) || 0;
    const totalClicks = analyticsData?.reduce((sum, record) => sum + record.product_clicks, 0) || 0;

    // Calculate conversion rate
    const conversionRate = totalVisitors > 0 ? (totalClicks / totalVisitors) * 100 : 0;

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

    // Calculate activity by date
    const activityByDate = analyticsData?.reduce((acc: Record<string, any>, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = {
          pageViews: 0,
          visitors: 0,
          clicks: 0
        };
      }
      acc[date].pageViews += record.page_views;
      acc[date].visitors += record.unique_visitors;
      acc[date].clicks += record.product_clicks;
      return acc;
    }, {});

    // Calculate store performance
    const storePerformance = stores?.map(store => ({
      id: store.id,
      name: store.name,
      productsCount: store.products?.length || 0,
      totalClicks: analyticsData
        ?.filter(record => record.store_id === store.id)
        .reduce((sum, record) => sum + record.product_clicks, 0) || 0,
      createdAt: store.created_at
    }));

    return {
      totalUsers: users?.length || 0,
      usersByTier,
      totalStores,
      totalProducts,
      totalPageViews,
      totalVisitors,
      totalClicks,
      conversionRate,
      averageStoresPerUser: users?.length ? totalStores / users.length : 0,
      averageProductsPerStore: totalStores ? totalProducts / totalStores : 0,
      activityByDate,
      storePerformance,
      users: users?.map(user => {
        const metadata = userMetadata?.find(meta => meta.user_id === user.id);
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          subscription_tier: metadata?.subscription_tier || 'free',
          is_admin: user.email === import.meta.env.VITE_ADMIN_EMAIL,
          stores: stores?.filter(store => store.user_id === user.id).length || 0,
          lastActive: analyticsData
            ?.filter(record => {
              const userStore = stores?.find(store => store.user_id === user.id);
              return userStore && record.store_id === userStore.id;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
        };
      }) || []
    };
  } catch (error) {
    console.error('Error loading admin stats:', error);
    throw error;
  }
}

export async function updateUserSubscription(userId: string, tier: string) {
  try {
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('user_metadata')
      .update({ subscription_tier: tier })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}