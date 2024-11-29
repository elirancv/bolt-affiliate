import { supabase } from './supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { format, subDays } from 'date-fns';

// Create a separate admin client with service role key
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function checkAdminStatus(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('Current User:', user)
    console.log('Admin Email:', import.meta.env.VITE_ADMIN_EMAIL)
    
    // Check if user email matches the admin email in environment variable
    const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL
    
    console.log('Is Admin:', isAdmin)
    
    return isAdmin
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function getAdminStats(timeRange: string = '24h') {
  try {
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      throw new Error('Unauthorized');
    }

    // Calculate date range based on timeRange
    const endDate = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '24h':
        startDate = subDays(endDate, 1);
        break;
      case '7d':
        startDate = subDays(endDate, 7);
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        break;
      case '90d':
        startDate = subDays(endDate, 90);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = subDays(endDate, 1); // Default to 24h
    }

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');

    // Get all stores with their products and clicks within the date range
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        created_at,
        products (
          id,
          created_at
        ),
        clicks (
          id,
          created_at,
          product_id
        )
      `)
      .gte('created_at', formattedStartDate)
      .lte('created_at', formattedEndDate);

    if (storesError) throw storesError;

    // Get users using the admin client
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Filter users by date range
    const filteredUsers = users.filter(user => {
      const userCreatedAt = new Date(user.created_at);
      return userCreatedAt >= startDate && userCreatedAt <= endDate;
    });

    // Get user metadata for subscription information
    const { data: userMetadata, error: metadataError } = await supabase
      .from('user_metadata')
      .select('*')
      .gte('created_at', formattedStartDate)
      .lte('created_at', formattedEndDate);

    if (metadataError) throw metadataError;

    // Process clicks data by date
    const activityByDate = stores?.reduce((acc: any, store) => {
      store.clicks?.forEach(click => {
        const date = format(new Date(click.created_at), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = {
            pageViews: 0,
            visitors: 0,
            clicks: 0
          };
        }
        acc[date].clicks++;
        // Since we don't have pageViews and visitors data yet,
        // we'll estimate them based on clicks
        acc[date].pageViews = Math.round(acc[date].clicks * 1.5); // Assuming 1.5 page views per click
        acc[date].visitors = Math.round(acc[date].clicks * 0.8); // Assuming 80% of clicks come from unique visitors
      });
      return acc;
    }, {});

    // Process users with metadata
    const processedUsers = filteredUsers.map(user => {
      const metadata = userMetadata?.find(meta => meta.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        subscription_tier: metadata?.subscription_tier || 'free',
        is_admin: user.email === import.meta.env.VITE_ADMIN_EMAIL
      };
    });

    // Calculate stats
    const totalUsers = processedUsers.length;
    const totalStores = stores?.length || 0;
    const totalProducts = stores?.reduce((sum, store) => sum + (store.products?.length || 0), 0) || 0;
    const totalClicks = stores?.reduce((sum, store) => sum + (store.clicks?.length || 0), 0) || 0;

    // Calculate subscription distribution
    const usersByTier = processedUsers.reduce((acc: Record<string, number>, user) => {
      const tier = user.subscription_tier || 'free';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});

    // Get store performance data
    const storePerformance = stores?.map(store => ({
      id: store.id,
      name: store.name,
      productsCount: store.products?.length || 0,
      totalClicks: store.clicks?.length || 0,
      createdAt: store.created_at
    })).sort((a, b) => b.totalClicks - a.totalClicks);

    return {
      totalUsers,
      usersByTier,
      totalStores,
      totalProducts,
      totalClicks,
      averageStoresPerUser: totalUsers ? totalStores / totalUsers : 0,
      averageProductsPerStore: totalStores ? totalProducts / totalStores : 0,
      users: processedUsers,
      activityByDate,
      storePerformance
    };

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    throw new Error(error.message);
  }
}