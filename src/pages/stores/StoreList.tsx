import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getStores } from '../../lib/api';
import { trackPageView } from '../../lib/analytics';
import type { Store } from '../../types';
import { 
  Plus, 
  Store as StoreIcon, 
  ExternalLink, 
  Settings, 
  Eye,
  BarChart2,
  Package,
  Search,
  Grid,
  List as ListIcon,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../components/ui/Tooltip';
import PageHeader from '../../components/ui/PageHeader';

interface StoreWithStats extends Store {
  productsCount?: number;
  totalClicks?: number;
  lastUpdated?: string;
}

export default function StoreList() {
  const [stores, setStores] = useState<StoreWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const netlifyUrl = import.meta.env.VITE_NETLIFY_URL;

  useEffect(() => {
    if (!user) return;

    const loadStores = async () => {
      try {
        const storesWithStats = await getStores(user.id);
        setStores(storesWithStats);
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
    window.open(`${netlifyUrl}/user/${storeId}`, '_blank');
  };

  const handleStoreClick = async (storeId: string) => {
    try {
      await trackPageView(storeId);
      navigate(`/stores/${storeId}/products`);
    } catch (error) {
      console.error('Error tracking store view:', error);
      // Still navigate even if tracking fails
      navigate(`/stores/${storeId}/products`);
    }
  };

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <TooltipProvider>
        {/* Header Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
          <PageHeader
            title="Your Stores"
            subtitle="Manage and monitor your affiliate stores"
            icon={StoreIcon}
            actions={
              <button
                onClick={() => navigate('/stores/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Store
              </button>
            }
          />
        </div>

        {stores.length > 0 && (
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <ListIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : stores.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <StoreIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create your first store</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Get started by creating your first affiliate store. You can add products, customize the design, and start earning commissions.
              </p>
              <button
                onClick={() => navigate('/stores/create')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2 shadow-sm"
              >
                <Plus className="h-5 w-5" />
                <span>Create Store</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredStores.map((store) => (
                <div key={store.id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="bg-blue-50 rounded-lg p-2 flex-shrink-0">
                          <StoreIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{store.name}</h3>
                          <p className="text-sm text-gray-500 mt-1 truncate">{store.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/stores/${store.id}/settings`)}
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50 rounded-lg flex-shrink-0"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{store.productsCount || 0}</p>
                        <p className="text-xs text-gray-500">Products</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                        <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{store.totalClicks || 0}</p>
                        <p className="text-xs text-gray-500">Clicks</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          {new Date(store.lastUpdated || store.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500">Updated</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <button
                        onClick={() => handleStoreClick(store.id)}
                        className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium inline-flex items-center"
                      >
                        Manage Store
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </button>
                      {netlifyUrl && (
                        <button
                          onClick={() => handlePreviewClick(store.id)}
                          className="text-gray-500 hover:text-gray-600 text-xs sm:text-sm font-medium inline-flex items-center"
                        >
                          Preview
                          <Eye className="h-4 w-4 ml-1" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Clicks</th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                      <th className="px-4 sm:px-6 py-3 text-right sm:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStores.map((store) => (
                      <tr key={store.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-50 rounded-lg p-2 flex-shrink-0">
                              <StoreIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{store.name}</p>
                              <div className="flex sm:hidden items-center space-x-4 mt-1">
                                <span className="text-xs text-gray-500">{store.productsCount || 0} products</span>
                                <span className="text-xs text-gray-500">{store.totalClicks || 0} clicks</span>
                              </div>
                              <p className="hidden sm:block text-sm text-gray-500 truncate">{store.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {store.productsCount || 0}
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {store.totalClicks || 0}
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(store.lastUpdated || store.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center justify-end sm:justify-start space-x-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleStoreClick(store.id)}
                                  className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  <Package className="h-5 w-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Manage Store</TooltipContent>
                            </Tooltip>

                            {netlifyUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handlePreviewClick(store.id)}
                                    className="text-gray-600 hover:text-blue-600 transition-colors"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Preview Store</TooltipContent>
                              </Tooltip>
                            )}

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => navigate(`/stores/${store.id}/settings`)}
                                  className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  <Settings className="h-5 w-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Store Settings</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}