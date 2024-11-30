import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import DashboardStats from './DashboardStats';
import DashboardHeader from './DashboardHeader';
import DashboardCharts from './DashboardCharts';
import SubscriptionUsage from '../SubscriptionUsage'; // Import the SubscriptionUsage component
import { Alert } from "../../components/ui/Alert";
import { Loader2 } from 'lucide-react';

export interface DashboardData {
  stores: number;
  products: number;
  visitors: number;
  clicks: number;
}

const DashboardContainer = () => {
  const { user } = useAuthStore();
  const { subscription, featureLimits } = useSubscriptionStore();

  const { data: dashboardStats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      try {
        logger.info('Loading dashboard data...', { userId: user?.id });

        // Get stores count - stores are directly related to user via user_id
        const { count: storesCount, error: storesError } = await supabase
          .from('stores')
          .select('*', { count: 'exact' })
          .eq('user_id', user?.id);

        if (storesError) throw new Error(`Failed to fetch stores: ${storesError.message}`);
        logger.debug('Stores count:', { storesCount });

        // Get all store IDs for this user
        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user?.id);

        if (!stores) throw new Error('Failed to fetch store IDs');
        const storeIds = stores.map(store => store.id);
        logger.debug('Store IDs:', { storeIds });

        // Get products count - products are related to stores
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact' })
          .in('store_id', storeIds);

        if (productsError) throw new Error(`Failed to fetch products: ${productsError.message}`);
        logger.debug('Products count:', { productsCount });

        // First get product IDs for the stores
        const { data: products, error: productIdsError } = await supabase
          .from('products')
          .select('id')
          .in('store_id', storeIds);

        if (productIdsError) throw new Error(`Failed to fetch product IDs: ${productIdsError.message}`);
        
        const productIds = products?.map(product => product.id) || [];
        logger.debug('Product IDs:', { productIds });

        // If there are no products, return early with zeros for views and clicks
        if (productIds.length === 0) {
          const result = {
            stores: storesCount || 0,
            products: productsCount || 0,
            visitors: 0,
            clicks: 0
          };
          logger.debug('No products found, returning zero counts:', result);
          return result;
        }

        // Get visitors count using product IDs
        const { data: visitorsData, error: visitorsError } = await supabase
          .from('product_views')
          .select('id')
          .in('product_id', productIds);

        if (visitorsError) throw new Error(`Failed to fetch visitors: ${visitorsError.message}`);
        logger.debug('Visitors data:', { count: visitorsData?.length });

        // Get clicks count using product IDs
        const { data: clicksData, error: clicksError } = await supabase
          .from('product_clicks')
          .select('id')
          .in('product_id', productIds);

        if (clicksError) throw new Error(`Failed to fetch clicks: ${clicksError.message}`);
        logger.debug('Clicks data:', { count: clicksData?.length });

        const result = {
          stores: storesCount || 0,
          products: productsCount || 0,
          visitors: visitorsData?.length || 0,
          clicks: clicksData?.length || 0
        };
        
        logger.debug('Final dashboard data:', result);
        return result;
      } catch (err) {
        logger.error('Error fetching dashboard data:', err);
        throw err;
      }
    },
    enabled: !!user?.id
  });

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stores</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.stores}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.products}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.visitors}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="text-green-500 mr-1">↑</span>
                <span>12% from last month</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.clicks}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="text-green-500 mr-1">↑</span>
                <span>8% from last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Usage */}
        <div className="grid grid-cols-1 gap-6">
          <SubscriptionUsage />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitors Over Time</h3>
            <DashboardCharts userId={user?.id} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            {dashboardStats?.products === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No products available</p>
                <button 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => navigate('/products/new')}
                >
                  Add Your First Product
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Product list will go here */}
                <p className="text-gray-500 text-center py-8">Loading products...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;
