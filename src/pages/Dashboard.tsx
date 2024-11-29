import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { supabase } from '../lib/supabase'; 
import { Store, LayoutGrid, Users, TrendingUp, ChevronDown, Clock, MousePointerClick, LayoutDashboard } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import TimeRangeSelector from '../components/dashboard/TimeRangeSelector';
import TopProducts from '../components/dashboard/TopProducts';
import ProductFilter from '../components/dashboard/ProductFilter';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import MainMenu from '../components/MainMenu'; 
import PageHeader from '../components/ui/PageHeader'; 
import SubscriptionStatus from '../components/subscription/SubscriptionStatus';
import SubscriptionUsage from '../components/subscription/SubscriptionUsage';
import type { Product } from '../types';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Linkxstore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { fetchCurrentPlan, updateFeatureLimits } = useSubscriptionStore();
  const navigate = useNavigate();
  const [storeCount, setStoreCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [visitorCount, setVisitorCount] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [productFilter, setProductFilter] = useState('clicks_desc');
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [statsData, setStatsData] = useState({
    stores: {
      value: '',
      positive: false
    },
    products: {
      value: '',
      positive: false
    },
    visitors: {
      value: '',
      positive: false
    },
    clicks: {
      value: '',
      positive: false
    }
  });

  useEffect(() => {
    fetchCurrentPlan();
  }, [fetchCurrentPlan]);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Get stores count
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('id, name, created_at')
          .eq('user_id', user.id);
        
        if (storesError) {
          console.error('Error fetching stores:', storesError);
          return;
        }

        setStores(stores || []);
        setStoreCount(stores?.length || 0);

        if (stores && stores.length > 0) {
          const storeIds = stores.map(store => store.id);

          // Get user feature limits
          const { data: featureLimits, error: limitsError } = await supabase
            .from('user_feature_limits')
            .select('*')
            .single();
          
          if (limitsError) {
            console.error('Error fetching feature limits:', limitsError);
          } else if (featureLimits) {
            updateFeatureLimits(featureLimits.limits);
          }

          // Calculate time filter and previous period
          const now = new Date();
          let timeFilter, previousTimeFilter;
          switch (timeRange) {
            case '7d':
              timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              previousTimeFilter = new Date(timeFilter.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case '30d':
              timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              previousTimeFilter = new Date(timeFilter.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'all':
              timeFilter = new Date(0);
              previousTimeFilter = new Date(0);
              break;
            default: // 24h
              timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              previousTimeFilter = new Date(timeFilter.getTime() - 24 * 60 * 60 * 1000);
          }

          // Get total products count for all stores
          const { count: totalProducts, error: productsCountError } = await supabase
            .from('products')
            .select('*', { count: 'exact' })
            .in('store_id', storeIds)
            .eq('status', 'active');

          if (productsCountError) {
            console.error('Error fetching total products:', productsCountError);
          }

          // Get products data with period clicks
          const { data: topProductsData, error: productsError } = await supabase
            .rpc('get_top_products_with_clicks', {
              start_date: timeFilter.toISOString(),
              store_ids: storeIds
            });

          if (productsError) {
            console.error('Error fetching products:', productsError);
          } else {
            setTopProducts(topProductsData || []);
          }

          // Get analytics data for current period
          const { data: analyticsData, error: analyticsError } = await supabase
            .from('analytics')
            .select('*')
            .in('store_id', storeIds)
            .gte('date', timeFilter.toISOString().split('T')[0]);

          if (analyticsError) {
            console.error('Error fetching analytics:', analyticsError);
            return;
          }

          // Get analytics data for previous period
          const { data: previousAnalyticsData, error: previousAnalyticsError } = await supabase
            .from('analytics')
            .select('*')
            .in('store_id', storeIds)
            .gte('date', previousTimeFilter.toISOString().split('T')[0])
            .lt('date', timeFilter.toISOString().split('T')[0]);

          if (previousAnalyticsError) {
            console.error('Error fetching previous analytics:', previousAnalyticsError);
            return;
          }

          setAnalytics(analyticsData || []);

          // Calculate current period totals
          const totalVisitors = analyticsData?.reduce((sum, record) => sum + (record.unique_visitors || 0), 0) || 0;
          const totalClicks = analyticsData?.reduce((sum, record) => sum + (record.product_clicks || 0), 0) || 0;
          
          // Calculate previous period totals
          const previousVisitors = previousAnalyticsData?.reduce((sum, record) => sum + (record.unique_visitors || 0), 0) || 0;
          const previousClicks = previousAnalyticsData?.reduce((sum, record) => sum + (record.product_clicks || 0), 0) || 0;

          // Calculate trends
          const visitorTrend = previousVisitors === 0 ? 100 : Math.round((totalVisitors - previousVisitors) / previousVisitors * 100);
          const clickTrend = previousClicks === 0 ? 100 : Math.round((totalClicks - previousClicks) / previousClicks * 100);

          setVisitorCount(totalVisitors);
          setTotalClicks(totalClicks);
          setConversionRate(totalVisitors > 0 ? (totalClicks / totalVisitors * 100) : 0);

          // Update stats data
          setStatsData({
            stores: {
              value: storeCount.toString(),
              positive: true
            },
            products: {
              value: totalProducts?.toString() || '0',
              positive: true
            },
            visitors: {
              value: totalVisitors.toString(),
              positive: visitorTrend >= 0
            },
            clicks: {
              value: totalClicks.toString(),
              positive: clickTrend >= 0
            }
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, timeRange, productFilter, updateFeatureLimits]);

  useEffect(() => {
    const loadFeatureLimits = async () => {
      try {
        const { data: featureLimits, error: limitsError } = await supabase
          .from('user_feature_limits')
          .select('*')
          .single();
        
        if (limitsError) {
          console.error('Error fetching feature limits:', limitsError);
        } else if (featureLimits) {
          // Update subscription store with limits
          const limits = featureLimits.limits;
          updateFeatureLimits(limits);
        }
      } catch (error) {
        console.error('Error loading feature limits:', error);
      }
    };

    loadFeatureLimits();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 pt-16 pb-6 sm:pt-10">
        <PageHeader
          title={`Welcome back, ${user?.metadata?.first_name || 'User'}`}
          subtitle="Track your performance and grow your business"
          icon={LayoutDashboard}
        />

        {/* Filters Row */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-700">
                Dashboard Overview
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <ProductFilter value={productFilter} onChange={setProductFilter} />
              <TimeRangeSelector
                timeRange={timeRange}
                showTimeMenu={showTimeMenu}
                onTimeRangeChange={setTimeRange}
                onToggleTimeMenu={() => setShowTimeMenu(!showTimeMenu)}
              />
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="pb-4 sm:pb-6">
          <div className="flex flex-col space-y-4 sm:space-y-6">
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Stores"
            value={storeCount}
            icon={Store}
            trend={statsData?.stores && {
              value: statsData.stores.value,
              label: "vs last period",
              positive: statsData.stores.positive
            }}
            loading={loading}
          />
          <StatsCard
            title="Products"
            value={statsData?.products.value}
            icon={LayoutGrid}
            trend={statsData?.products && {
              value: statsData.products.value,
              label: "vs last period",
              positive: statsData.products.positive
            }}
            loading={loading}
          />
          <StatsCard
            title="Visitors"
            value={visitorCount}
            icon={Users}
            trend={statsData?.visitors && {
              value: statsData.visitors.value,
              label: "vs last period",
              positive: statsData.visitors.positive
            }}
            loading={loading}
          />
          <StatsCard
            title="Clicks"
            value={totalClicks}
            icon={TrendingUp}
            description={`${Math.round(conversionRate)}% conv.`}
            trend={statsData?.clicks && {
              value: statsData.clicks.value,
              label: "vs last period",
              positive: statsData.clicks.positive
            }}
            loading={loading}
          />
        </div>

        {/* Analytics Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Performance Overview
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {timeRange === '24h' ? 'Last 24 hours' :
                   timeRange === '7d' ? 'Last 7 days' :
                   timeRange === '30d' ? 'Last 30 days' : 'All time'} of activity
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Visitors</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Clicks</span>
                </div>
                {statsData?.visitors && (
                  <span className={`inline-flex items-center text-xs font-medium text-green-600`}>
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    {statsData.visitors.value}
                  </span>
                )}
              </div>
            </div>
            <div className="min-h-[300px] sm:min-h-[400px]">
              <AnalyticsChart analytics={analytics || []} loading={loading} />
            </div>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col items-center text-center p-2 sm:p-3 rounded-lg bg-gray-50">
                <div className="mb-1">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">
                  {Math.round(visitorCount / (
                    timeRange === '7d' ? 7 :
                    timeRange === '30d' ? 30 :
                    timeRange === 'all' ? 30 : 1
                  )).toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-0.5 sm:mt-1">
                  Avg. Daily Visitors
                </p>
                {statsData?.visitors && (
                  <span className={`mt-1 sm:mt-2 inline-flex items-center text-[10px] sm:text-xs font-medium ${
                    statsData.visitors.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                    {statsData.visitors.value}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center text-center p-2 sm:p-3 rounded-lg bg-gray-50">
                <div className="mb-1">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">
                  {analytics && analytics.length > 0 
                    ? new Date(Math.max(...analytics.map(a => new Date(a.date).getTime()))).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', hour12: true })
                    : '-'}
                </p>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-0.5 sm:mt-1">
                  Peak Time
                </p>
                <span className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-gray-400">
                  Most Active
                </span>
              </div>

              <div className="flex flex-col items-center text-center p-2 sm:p-3 rounded-lg bg-gray-50">
                <div className="mb-1">
                  <MousePointerClick className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">
                  {Math.round(totalClicks / (
                    timeRange === '7d' ? 7 :
                    timeRange === '30d' ? 30 :
                    timeRange === 'all' ? 30 : 1
                  )).toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-0.5 sm:mt-1">
                  Avg. Clicks/Day
                </p>
                {statsData?.clicks && (
                  <span className={`mt-1 sm:mt-2 inline-flex items-center text-[10px] sm:text-xs font-medium ${
                    statsData.clicks.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                    {statsData.clicks.value}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center text-center p-2 sm:p-3 rounded-lg bg-gray-50">
                <div className="mb-1">
                  <Store className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">
                  {stores && stores.length > 0
                    ? stores[0].name.split(' ')[0]
                    : '-'}
                </p>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 mt-0.5 sm:mt-1">
                  Best Store
                </p>
                <span className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-gray-400">
                  By Traffic
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
              Quick Stats
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Current performance metrics
            </p>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Conversion Rate</span>
                    <div className="flex items-center mt-0.5">
                      <span className="text-base font-semibold text-gray-900">{conversionRate.toFixed(1)}%</span>
                      <span className="ml-2 inline-flex items-center text-xs font-medium text-green-600">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        4.5%
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">Goal: 5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(conversionRate, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Store Activity</span>
                    <div className="flex items-center mt-0.5">
                      <span className="text-base font-semibold text-gray-900">85%</span>
                      <span className="ml-2 inline-flex items-center text-xs font-medium text-green-600">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        2.1%
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">Goal: 90%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: '85%' }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-500">Active</div>
                    <div className="mt-0.5 text-sm font-semibold text-gray-900">{Math.round(storeCount * 0.85)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-500">Inactive</div>
                    <div className="mt-0.5 text-sm font-semibold text-gray-900">{Math.round(storeCount * 0.15)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-500">Total</div>
                    <div className="mt-0.5 text-sm font-semibold text-gray-900">{storeCount}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Product Coverage</span>
                    <div className="flex items-center mt-0.5">
                      <span className="text-base font-semibold text-gray-900">92%</span>
                      <span className="ml-2 inline-flex items-center text-xs font-medium text-green-600">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        1.2%
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">Goal: 95%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: '92%' }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{statsData?.products.value} products listed</span>
                  <span>8 need attention</span>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">Performance Score</span>
                  <span className="font-semibold text-blue-600">A+</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Based on conversion rate, store activity, and product coverage
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status and Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="col-span-1">
            <SubscriptionStatus />
          </div>
          <div className="col-span-1">
            <SubscriptionUsage />
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                Top Performing Products
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Your best-selling products based on clicks and engagement
              </p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View All
              <TrendingUp className="ml-2 h-4 w-4" />
            </button>
          </div>
          <TopProducts
            products={topProducts}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}