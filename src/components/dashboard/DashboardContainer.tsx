import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import DashboardStats from './DashboardStats';
import DashboardHeader from './DashboardHeader';
import DashboardCharts from './DashboardCharts';
import SubscriptionUsage from '../SubscriptionUsage';
import { Alert } from "../../components/ui/Alert";
import { Loader2 } from 'lucide-react';
import { startOfMonth, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export interface DashboardData {
  stores: number;
  products: number;
  visitors: number;
  clicks: number;
  visitorsDiff: number;
  clicksDiff: number;
}

const DashboardContainer = () => {
  const { user } = useAuthStore();
  const { subscription, featureLimits } = useSubscriptionStore();
  const navigate = useNavigate();

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

        // If there are no products, return early with zeros
        if (productIds.length === 0) {
          return {
            stores: storesCount || 0,
            products: productsCount || 0,
            visitors: 0,
            clicks: 0,
            visitorsDiff: 0,
            clicksDiff: 0
          };
        }

        const currentMonthStart = startOfMonth(new Date());
        const lastMonthStart = startOfMonth(subMonths(new Date(), 1));

        // Get current month's visitors and clicks
        const [currentVisitors, currentClicks, lastVisitors, lastClicks] = await Promise.all([
          supabase
            .from('product_views')
            .select('id')
            .in('product_id', productIds)
            .gte('viewed_at', currentMonthStart.toISOString()),
          supabase
            .from('product_clicks')
            .select('id')
            .in('product_id', productIds)
            .gte('clicked_at', currentMonthStart.toISOString()),
          supabase
            .from('product_views')
            .select('id')
            .in('product_id', productIds)
            .gte('viewed_at', lastMonthStart.toISOString())
            .lt('viewed_at', currentMonthStart.toISOString()),
          supabase
            .from('product_clicks')
            .select('id')
            .in('product_id', productIds)
            .gte('clicked_at', lastMonthStart.toISOString())
            .lt('clicked_at', currentMonthStart.toISOString())
        ]);

        if (currentVisitors.error) throw new Error(`Failed to fetch current visitors: ${currentVisitors.error.message}`);
        if (currentClicks.error) throw new Error(`Failed to fetch current clicks: ${currentClicks.error.message}`);
        if (lastVisitors.error) throw new Error(`Failed to fetch last month visitors: ${lastVisitors.error.message}`);
        if (lastClicks.error) throw new Error(`Failed to fetch last month clicks: ${lastClicks.error.message}`);

        const currentVisitorsCount = currentVisitors.data?.length || 0;
        const currentClicksCount = currentClicks.data?.length || 0;
        const lastVisitorsCount = lastVisitors.data?.length || 0;
        const lastClicksCount = lastClicks.data?.length || 0;

        // Calculate month-over-month difference
        const visitorsDiff = lastVisitorsCount === 0 ? 0 : 
          ((currentVisitorsCount - lastVisitorsCount) / lastVisitorsCount) * 100;
        const clicksDiff = lastClicksCount === 0 ? 0 : 
          ((currentClicksCount - lastClicksCount) / lastClicksCount) * 100;

        return {
          stores: storesCount || 0,
          products: productsCount || 0,
          visitors: currentVisitorsCount,
          clicks: currentClicksCount,
          visitorsDiff,
          clicksDiff
        };
      } catch (err) {
        logger.error('Error fetching dashboard data:', err);
        throw err;
      }
    },
    enabled: !!user?.id
  });

  const renderDiff = (diff: number | undefined) => {
    if (!diff) return null;
    if (diff === 0) return null;
    
    return (
      <div className="mt-2">
        <div className="flex items-center text-sm text-gray-600">
          <span className={diff > 0 ? "text-green-500 mr-1" : "text-red-500 mr-1"}>
            {diff > 0 ? "↑" : "↓"}
          </span>
          <span>{Math.abs(diff).toFixed(1)}% from last month</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <DashboardHeader subscription={subscription} />
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
              {renderDiff(dashboardStats?.visitorsDiff)}
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
              {renderDiff(dashboardStats?.clicksDiff)}
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
    </div>
  );
};

export default DashboardContainer;
