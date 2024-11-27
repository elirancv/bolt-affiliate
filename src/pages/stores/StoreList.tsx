import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getStores } from '../../lib/api';
import type { Store } from '../../types';
import { Plus, Store as StoreIcon, ExternalLink, Settings, Eye } from 'lucide-react';

export default function StoreList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const netlifyUrl = import.meta.env.VITE_NETLIFY_URL;

  useEffect(() => {
    if (!user) return;

    const loadStores = async () => {
      try {
        const data = await getStores(user.id);
        setStores(data);
      } catch (error) {
        console.error('Error loading stores:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, [user]);

  const handlePreviewClick = (storeId: string) => {
    if (!netlifyUrl) {
      console.error('Netlify URL not configured');
      return;
    }
    window.open(`${netlifyUrl}/stores/${storeId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Stores</h1>
        <button
          onClick={() => navigate('/stores/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Store
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <StoreIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stores yet</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first store</p>
          <button
            onClick={() => navigate('/stores/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{store.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{store.description}</p>
                </div>
                <button
                  onClick={() => navigate(`/stores/${store.id}/settings`)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Settings className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="flex space-x-4">
                  <button
                    onClick={() => navigate(`/stores/${store.id}/products`)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    Manage
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </button>
                  {netlifyUrl && (
                    <button
                      onClick={() => handlePreviewClick(store.id)}
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center"
                    >
                      Preview
                      <Eye className="h-4 w-4 ml-1" />
                    </button>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  Created {new Date(store.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}