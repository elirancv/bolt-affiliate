import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Store, Settings, Package, BarChart2, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Store as StoreType } from '../../types';
import PageHeader from '../../components/ui/PageHeader'; 

export default function StoreDetails() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStore() {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single();

        if (error) throw error;
        setStore(data);
      } catch (error) {
        console.error('Error fetching store:', error);
        // Handle error appropriately
      } finally {
        setLoading(false);
      }
    }

    fetchStore();
  }, [storeId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-6 text-center">
        <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Store Not Found</h3>
        <p className="text-gray-500 mb-4">The store you're looking for doesn't exist or you don't have access to it.</p>
        <button
          onClick={() => navigate('/stores')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Stores
        </button>
      </div>
    );
  }

  const menuItems = [
    { icon: Package, label: 'Products', path: `products`, subtitle: 'Manage and track your affiliate products' },
    { icon: BarChart2, label: 'Analytics', path: `analytics` },
    { icon: FileText, label: 'Pages', path: `pages` },
    { icon: Settings, label: 'Settings', path: `settings` },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={store.name}
        subtitle="Manage your store's products, analytics, and settings"
        icon={Store}
        showBackButton
        onBack={() => navigate('/stores')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">{item.label}</span>
              </div>
              {item.subtitle && (
                <p className="text-sm text-gray-500 ml-11">{item.subtitle}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
