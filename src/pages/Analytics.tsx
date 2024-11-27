import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getStoreAnalytics, getTopProducts } from '../lib/analytics';
import { BarChart3, TrendingUp, Users, MousePointerClick } from 'lucide-react';
import AnalyticsOverview from '../components/analytics/AnalyticsOverview';
import VisitorsChart from '../components/analytics/VisitorsChart';
import TopProducts from '../components/analytics/TopProducts';
import ConversionMetrics from '../components/analytics/ConversionMetrics';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { storeId } = useParams();

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!storeId) return;
      
      try {
        const [analytics, products] = await Promise.all([
          getStoreAnalytics(storeId),
          getTopProducts(storeId)
        ]);
        
        setAnalyticsData(analytics);
        setTopProducts(products);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const totalPageViews = analyticsData.reduce((sum, record) => sum + (record.page_views || 0), 0);
  const totalVisitors = analyticsData.reduce((sum, record) => sum + (record.unique_visitors || 0), 0);
  const totalClicks = analyticsData.reduce((sum, record) => sum + (record.product_clicks || 0), 0);
  const conversionRate = totalVisitors > 0 ? (totalClicks / totalVisitors) * 100 : 0;

  const overviewMetrics = [
    { title: 'Total Page Views', value: totalPageViews, icon: BarChart3, color: 'bg-blue-500' },
    { title: 'Unique Visitors', value: totalVisitors, icon: Users, color: 'bg-green-500' },
    { title: 'Product Clicks', value: totalClicks, icon: MousePointerClick, color: 'bg-purple-500' },
    { 
      title: 'Conversion Rate', 
      value: `${conversionRate.toFixed(1)}%`, 
      icon: TrendingUp, 
      color: 'bg-orange-500' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      <AnalyticsOverview metrics={overviewMetrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisitorsChart data={analyticsData} />
        <ConversionMetrics data={analyticsData} />
      </div>

      <TopProducts products={topProducts} />
    </div>
  );
}