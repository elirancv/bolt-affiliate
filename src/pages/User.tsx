import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Store, LayoutGrid, Users, TrendingUp } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import TimeRangeSelector from '../components/dashboard/TimeRangeSelector';
import type { Product } from '../types';

export default function User() {
  const { storeId, productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [stats, setStats] = useState({
    totalClicks: 0,
    uniqueVisitors: 0,
    conversionRate: 0,
    totalProducts: 0
  });

  useEffect(() => {
    if (!user || !storeId || !productId) return;

    const loadProductData = async () => {
      try {
        setLoading(true);

        // Get product data
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*, stores(*)')
          .eq('id', productId)
          .eq('store_id', storeId)
          .single();

        if (productError) throw productError;
        if (!productData) {
          navigate('/dashboard');
          return;
        }

        setProduct(productData);

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

        // Get analytics data
        const { data: analytics } = await supabase
          .from('analytics')
          .select('*')
          .eq('store_id', storeId)
          .gte('date', timeFilter.split('T')[0]);

        // Calculate totals
        const totalVisitors = analytics?.reduce((sum, record) => sum + (record.unique_visitors || 0), 0) || 0;
        const clicks = analytics?.reduce((sum, record) => sum + (record.product_clicks || 0), 0) || 0;

        // Get total products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('store_id', storeId);

        setStats({
          totalClicks: clicks,
          uniqueVisitors: totalVisitors,
          conversionRate: totalVisitors > 0 ? (clicks / totalVisitors * 100) : 0,
          totalProducts: productsCount || 0
        });

      } catch (error) {
        console.error('Error loading product data:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [user, storeId, productId, timeRange, navigate]);

  if (!product && !loading) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {product?.name || 'Loading...'}
          </h1>
        </div>
        <TimeRangeSelector
          timeRange={timeRange}
          showTimeMenu={showTimeMenu}
          onTimeRangeChange={setTimeRange}
          onToggleTimeMenu={() => setShowTimeMenu(!showTimeMenu)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Store"
          value={product?.stores?.name || '-'}
          icon={Store}
          loading={loading}
        />
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={LayoutGrid}
          loading={loading}
        />
        <StatsCard
          title="Total Visitors"
          value={stats.uniqueVisitors}
          icon={Users}
          loading={loading}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          description={`${stats.totalClicks} clicks`}
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Product Details</h2>
          <p className="mt-1 text-sm text-gray-500">
            Detailed information about your product
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-start space-x-6">
            {product?.image_urls?.[0] ? (
              <img
                src={product.image_urls[0]}
                alt={product.name}
                className="w-32 h-32 rounded-lg object-cover bg-gray-100"
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-blue-50 rounded-lg">
                <Store className="h-12 w-12 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-medium text-gray-900">{product?.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{product?.stores?.name}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-medium">${product?.price}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Product URL:</span>
                  <a
                    href={product?.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Visit Product
                  </a>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Affiliate URL:</span>
                  <a
                    href={product?.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Visit Affiliate Link
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
