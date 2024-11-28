import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getStores, getProducts, deleteProduct } from '../../lib/api';
import type { Store, Product } from '../../types';
import { Plus, Package, Store as StoreIcon, ExternalLink, Pencil, Trash2, LayoutGrid, List } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';

type ViewMode = 'grid' | 'list';

export default function ProductList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { storeId } = useParams();

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        if (storeId) {
          const productsData = await getProducts(storeId);
          setProducts(productsData);
        } else {
          const storesData = await getStores(user.id);
          setStores(storesData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, storeId]);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!storeId) {
    if (stores.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <StoreIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
          <p className="text-gray-500 mb-4">Create a store first to manage products</p>
          <button
            onClick={() => navigate('/stores/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Store
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{store.name}</h3>
                  <p className="text-gray-500 text-sm">Manage store products</p>
                </div>
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <button
                onClick={() => navigate(`/stores/${store.id}/products`)}
                className="w-full mt-4 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 inline-flex items-center justify-center"
              >
                View Products
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ViewModeButton = ({ mode, icon: Icon, label }: { mode: ViewMode; icon: any; label: string }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`p-2 rounded-lg flex items-center ${
        viewMode === mode
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  );

  const renderProductsByViewMode = () => {
    if (products.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first product</p>
          <button
            onClick={() => navigate(`/stores/${storeId}/products/add`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </button>
        </div>
      );
    }

    switch (viewMode) {
      case 'grid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200">
                <Link 
                  to={`/preview/${storeId}/products/${product.id}`}
                  className="block"
                >
                  <div className="aspect-w-1 aspect-h-1 relative">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.title}
                        className="w-full h-48 object-contain p-4"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-gray-50">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      {product.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-4 border-t flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Link
                      to={`/stores/${storeId}/products/${product.id}/edit`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <a
                    href={product.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="p-4 flex items-center space-x-4">
                  <Link 
                    to={`/preview/${storeId}/products/${product.id}`}
                    className="w-24 h-24 flex-shrink-0"
                  >
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <Package className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </Link>
                  <Link 
                    to={`/preview/${storeId}/products/${product.id}`}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mt-1">{product.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      {product.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-2">
                      <Link
                        to={`/stores/${storeId}/products/${product.id}/edit`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <a
                        href={product.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div>
      <PageHeader 
        title="Products"
        actions={
          <button
            onClick={() => navigate(`/stores/${storeId}/products/add`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </button>
        }
      />
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-1">
          <ViewModeButton mode="grid" icon={LayoutGrid} label="Grid view" />
          <ViewModeButton mode="list" icon={List} label="List view" />
        </div>
      </div>

      {renderProductsByViewMode()}
    </div>
  );
}