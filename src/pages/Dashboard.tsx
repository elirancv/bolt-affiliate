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

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Linkxstore';

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
          const normalizedStoreIds = storeIds;

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
              store_ids: normalizedStoreIds,
              start_date: new Date(timeFilter)
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
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md hover:bg-gray-50 transition-colors duration-200"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className={`h-6 w-6 text-gray-600 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`} />
        </button>
        
        {isMobileMenuOpen && (
          <div className="fixed inset-0 flex z-40">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            <div className="relative flex-1 flex flex-col max-w-[180px] w-full bg-white">
              <div className="flex-1 h-0 overflow-y-auto pt-16">
                <nav className="px-2">
                  {/* Navigation items */}
                  <button
                    onClick={() => navigate('/stores')}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors duration-150"
                  >
                    <Store className="mr-2 h-5 w-5" />
                    Stores
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors duration-150"
                  >
                    <LayoutGrid className="mr-2 h-5 w-5" />
                    Products
                  </button>
                  <button
                    onClick={() => navigate('/analytics')}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors duration-150"
                  >
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Analytics
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="lg:pl-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-10">
          {/* Header */}
          <div className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold leading-7 text-gray-900 sm:text-2xl sm:truncate">
                  Dashboard
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Total Stores"
              value={storeCount.toString()}
              icon={Store}
            />
            <StatsCard
              title="Total Products"
              value={productCount.toString()}
              icon={LayoutGrid}
            />
            <StatsCard
              title="Total Visitors"
              value={visitorCount.toString()}
              icon={Users}
            />
            <StatsCard
              title="Total Clicks"
              value={totalClicks.toString()}
              icon={TrendingUp}
              description={`${conversionRate.toFixed(1)}% conversion`}
            />
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Top Products
              </h3>
              <TopProducts
                products={topProducts}
                loading={loading}
                onProductClick={(product) => navigate(`/products/${product.id}`)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}