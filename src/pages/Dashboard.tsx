import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Store, LayoutGrid, Users } from 'lucide-react';
import type { Store as StoreType } from '../types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [storeCount, setStoreCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [visitorCount, setVisitorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        // Get stores count
        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id);
        
        setStoreCount(stores?.length || 0);

        if (stores && stores.length > 0) {
          // Get total products count across all stores
          const storeIds = stores.map(store => store.id);
          const { count: productsCount } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .in('store_id', storeIds);

          setProductCount(productsCount || 0);

          // Get total visitors count across all stores
          const { data: analytics } = await supabase
            .from('analytics')
            .select('unique_visitors')
            .in('store_id', storeIds);

          const totalVisitors = analytics?.reduce((sum, record) => sum + (record.unique_visitors || 0), 0) || 0;
          setVisitorCount(totalVisitors);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

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
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome back, {user?.email}</h1>
        <button 
          onClick={() => navigate('/stores/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Store className="h-5 w-5" />
          Create New Store
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                {stat.loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-semibold">{stat.value}</p>
                )}
              </div>
              <stat.icon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-600">No recent activity to show.</p>
      </div>
    </div>
  );
}