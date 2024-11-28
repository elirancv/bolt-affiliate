import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Store, LayoutGrid, Users, TrendingUp, ChevronDown, Menu } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import TimeRangeSelector from '../components/dashboard/TimeRangeSelector';
import TopProducts from '../components/dashboard/TopProducts';
import ProductFilter from '../components/dashboard/ProductFilter';
import type { Product } from '../types';

export default function Dashboard() {
  const { user } = useAuthStore();
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [productFilter, setProductFilter] = useState('clicks_desc');

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Get stores count
        const { data: stores } = await supabase
          .from('stores')
          .select('id, name, created_at')
          .eq('user_id', user.id);
        
        setStores(stores || []);
        setStoreCount(stores?.length || 0);

        if (stores && stores.length > 0) {
          const storeIds = stores.map(store => store.id);
          const normalizedStoreIds = storeIds.map(id => String(id));

          // Calculate time filter
          let timeFilter;
          switch (timeRange) {
            case '7d':
              timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
              break;
            case '30d':
              timeFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
              break;
            case 'all':
              timeFilter = new Date(0).toISOString();
              break;
            default: // 24h
              timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          }

          // Get products data with period clicks
          const { data: topProductsData, error: productsError } = await supabase
            .rpc('get_top_products_with_clicks', {
              p_store_ids: normalizedStoreIds,
              p_start_date: timeFilter
            });

          if (productsError) {
            console.error('Error fetching products:', productsError);
          } else if (topProductsData && topProductsData.length > 0) {
            const productStoreIds = [...new Set(topProductsData.map(p => p.product_store_id))];
            
            const { data: storesData } = await supabase
              .from('stores')
              .select('id, name')
              .in('id', productStoreIds);

            const storesMap = new Map(storesData?.map(store => [store.id, store]) || []);
            const productsWithData = topProductsData.map(data => ({
              id: data.product_id,
              name: data.product_name,
              price: data.product_price,
              image_urls: data.product_image_urls,
              store_id: data.product_store_id,
              product_url: data.product_url,
              affiliate_url: data.affiliate_url,
              period_clicks: data.period_clicks,
              stores: storesMap.get(data.product_store_id)
            }));

            // Sort products based on filter
            const sortedProducts = [...productsWithData].sort((a, b) => {
              switch (productFilter) {
                case 'clicks_desc':
                  return (b.period_clicks || 0) - (a.period_clicks || 0);
                case 'clicks_asc':
                  return (a.period_clicks || 0) - (b.period_clicks || 0);
                case 'price_desc':
                  return (b.price || 0) - (a.price || 0);
                case 'price_asc':
                  return (a.price || 0) - (b.price || 0);
                case 'name_asc':
                  return a.name.localeCompare(b.name);
                case 'name_desc':
                  return b.name.localeCompare(a.name);
                default:
                  return (b.period_clicks || 0) - (a.period_clicks || 0);
              }
            });

            setTopProducts(sortedProducts);
          } else {
            setTopProducts([]);
          }

          // Get analytics data
          const { data: analytics } = await supabase
            .from('analytics')
            .select('*')
            .in('store_id', normalizedStoreIds)
            .gte('date', timeFilter.split('T')[0]);

          // Calculate totals
          const totalVisitors = analytics?.reduce((sum, record) => sum + (record.unique_visitors || 0), 0) || 0;
          const clicks = analytics?.reduce((sum, record) => sum + (record.product_clicks || 0), 0) || 0;
          
          setVisitorCount(totalVisitors);
          setTotalClicks(clicks);
          setConversionRate(totalVisitors > 0 ? (clicks / totalVisitors * 100) : 0);

          // Get total products count
          const { count: productsCount } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .in('store_id', normalizedStoreIds);

          setProductCount(productsCount || 0);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, timeRange, productFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="fixed inset-0 flex z-40">
          <div
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-in-out ${
              isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <img
                  className="h-8 w-auto"
                  src="/logo.png"
                  alt="Bolt Affiliate"
                />
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {/* Add mobile navigation items here */}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Dashboard
                </h2>
              </div>
              <div className="flex md:ml-4">
                <TimeRangeSelector
                  timeRange={timeRange}
                  showTimeMenu={showTimeMenu}
                  onTimeRangeChange={setTimeRange}
                  onToggleTimeMenu={() => setShowTimeMenu(!showTimeMenu)}
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
            <StatsCard
              title="Total Stores"
              value={storeCount}
              icon={Store}
              loading={loading}
              trend={{
                value: '+12%',
                label: 'vs. last period',
                positive: true
              }}
            />
            <StatsCard
              title="Total Products"
              value={productCount}
              icon={LayoutGrid}
              loading={loading}
              trend={{
                value: '+5%',
                label: 'vs. last period',
                positive: true
              }}
            />
            <StatsCard
              title="Total Visitors"
              value={visitorCount}
              icon={Users}
              loading={loading}
              trend={{
                value: '+18%',
                label: 'vs. last period',
                positive: true
              }}
            />
            <StatsCard
              title="Conversion Rate"
              value={`${conversionRate.toFixed(1)}%`}
              icon={TrendingUp}
              description={`${totalClicks} clicks`}
              loading={loading}
              trend={{
                value: '+2.5%',
                label: 'vs. last period',
                positive: true
              }}
            />
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-8">
            {/* Top Products */}
            <div className="bg-white rounded-lg shadow-sm xl:col-span-2">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Top Performing Products</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Your best performing products based on click-through rate
                    </p>
                  </div>
                  <ProductFilter
                    currentFilter={productFilter}
                    onFilterChange={setProductFilter}
                  />
                </div>
              </div>
              <div className="p-6">
                <TopProducts products={topProducts} loading={loading} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Latest updates from your stores
                </p>
              </div>
              <div className="flow-root p-6">
                <ul role="list" className="-mb-8">
                  {loading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex space-x-4">
                          <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : topProducts.slice(0, 5).map((product, idx) => (
                    <li key={product.id}>
                      <div className="relative pb-8">
                        {idx < topProducts.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <Menu className="h-4 w-4 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm">
                                <a href="#" className="font-medium text-gray-900">
                                  {product.name}
                                </a>
                              </div>
                              <p className="mt-0.5 text-sm text-gray-500">
                                {product.period_clicks} clicks • ${product.price}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}