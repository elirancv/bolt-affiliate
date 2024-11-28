import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { trackProductClick } from '../lib/api';
import { Store, LayoutGrid, Users, MousePointerClick, TrendingUp, Clock, ShoppingBag, ChevronRight, ChevronDown, ExternalLink, Edit2 } from 'lucide-react';
import type { Store as StoreType } from '../types';

export default function Dashboard() {
  const { user } = useAuthStore();
  console.log('Dashboard user:', user);
  const navigate = useNavigate();
  const [storeCount, setStoreCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [visitorCount, setVisitorCount] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [showTimeMenu, setShowTimeMenu] = useState(false);

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

          // Calculate time filter first
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

            setTopProducts(productsWithData);
          } else {
            setTopProducts([]);
          }

          // Get analytics data for the selected time range
          const { data: analytics } = await supabase
            .from('analytics')
            .select('*')
            .in('store_id', normalizedStoreIds)
            .gte('date', timeFilter.split('T')[0]);

          // Calculate total visitors and clicks
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
  }, [user, timeRange]);

  useEffect(() => {
    async function fetchStores() {
      try {
        let timeFilter;
        switch (timeRange) {
          case '7d':
            timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case '30d':
            timeFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'all':
            timeFilter = new Date(0).toISOString(); // Beginning of time
            break;
          default: // 24h
            timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        }

        const { data: storesData, error } = await supabase
          .from('stores')
          .select('*')
          .gte('created_at', timeFilter)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setStores(storesData || []);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, [timeRange]);

  const handleProductClick = async (storeId: string, productId: string, url: string) => {
    try {
      // Track the click first
      await trackProductClick(storeId, productId);
      
      // Update the local state
      setTopProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, clicks: (product.clicks || 0) + 1 }
            : product
        ).sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      );

      // Open the product URL
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error tracking product click:', error);
    }
  };

  const stats = [
    { 
      label: 'Active Stores', 
      value: storeCount.toString(), 
      icon: Store,
      loading 
    },
    { 
      label: 'Total Products', 
      value: productCount.toString(), 
      icon: LayoutGrid,
      loading 
    },
    { 
      label: 'Total Visitors', 
      value: visitorCount.toString(), 
      icon: Users,
      loading 
    },
    { 
      label: 'Total Clicks', 
      value: totalClicks.toString(), 
      icon: MousePointerClick,
      loading 
    },
    { 
      label: 'Conversion Rate', 
      value: `${conversionRate.toFixed(1)}%`, 
      icon: TrendingUp,
      loading 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 pb-6 -mt-2 space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  Welcome back, {user?.metadata?.first_name || user?.email}
                </h1>
                <p className="text-sm text-gray-600">Here's what's happening with your stores today.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/products')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>View Products</span>
              </button>
              <button 
                onClick={() => navigate('/stores/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Store className="h-5 w-5" />
                <span>Create Store</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview Block */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-100">
            {stats.map((stat) => (
              <div key={stat.label} className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <stat.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
                {stat.loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-semibold">{stat.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-semibold">Recent Activity</h2>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowTimeMenu(!showTimeMenu)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  <span>
                    {timeRange === '24h' && 'Last 24 hours'}
                    {timeRange === '7d' && 'Last 7 days'}
                    {timeRange === '30d' && 'Last 30 days'}
                    {timeRange === 'all' && 'All time'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showTimeMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 py-1">
                    <button
                      onClick={() => {
                        setTimeRange('24h');
                        setShowTimeMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last 24 hours
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange('7d');
                        setShowTimeMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last 7 days
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange('30d');
                        setShowTimeMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Last 30 days
                    </button>
                    <button
                      onClick={() => {
                        setTimeRange('all');
                        setShowTimeMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      All time
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stores && stores.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Stats Cards */}
                <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Page Views</p>
                      <p className="text-lg font-bold text-blue-900">{visitorCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MousePointerClick className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Total Clicks</p>
                      <p className="text-lg font-bold text-green-900">{totalClicks}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Store Updates */}
                {stores.slice(0, 2).map((store: any) => (
                  <div 
                    key={store.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-lg">
                        <Store className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{store.name}</p>
                        <p className="text-xs text-gray-500">Created {new Date(store.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Store className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No activity yet</p>
                <p className="text-sm text-gray-500 mb-3">Create your first store to get started</p>
                <button
                  onClick={() => navigate('/stores/create')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 transition-colors"
                >
                  <Store className="w-5 h-5" />
                  Create Store
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Products Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-semibold">Top Performing Products</h2>
            </div>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product: any) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div 
                      className="flex items-center gap-4 min-w-0 w-full max-w-4xl cursor-pointer"
                      onClick={() => handleProductClick(
                        product.store_id, 
                        product.id,
                        product.affiliate_url || product.product_url
                      )}
                    >
                      {product.image_urls && product.image_urls.length > 0 ? (
                        <img 
                          src={product.image_urls[0]} 
                          alt={product.name}
                          className="w-12 h-12 shrink-0 rounded-lg object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-blue-50 rounded-lg">
                          <ShoppingBag className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-sm font-medium text-gray-900 truncate max-w-[500px]" title={product.name}>
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap shrink-0">
                            <MousePointerClick className="h-3 w-3" />
                            <span>{product.period_clicks || 0} clicks</span>
                          </div>
                          <span className="text-xs text-green-600 whitespace-nowrap shrink-0">
                            ${product.price}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {product.stores?.name || 'Store name'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <button
                        onClick={() => window.open(`/preview/${product.store_id}/products/${product.id}`, '_blank')}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View Product"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/stores/${product.store_id}/products/${product.id}/edit`)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ShoppingBag className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No products yet</p>
                <p className="text-sm text-gray-500">Add products to your store to see performance metrics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}