import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getStores, getProducts, deleteProduct } from '../../lib/api';
import type { Store, Product } from '../../types';
import { 
  Plus, Package, Store as StoreIcon, ExternalLink, Pencil, 
  Trash2, LayoutGrid, List, Search, Filter, SortAsc, 
  ArrowUpDown, Download, Upload
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Dropdown } from '../../components/ui/Dropdown';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'price' | 'created_at' | 'category';
type SortOrder = 'asc' | 'desc';

interface ProductFilters {
  search: string;
  category: string;
  minPrice: number | null;
  maxPrice: number | null;
  status: 'all' | 'active' | 'inactive';
}

export default function ProductList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'all',
    minPrice: null,
    maxPrice: null,
    status: 'all'
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    categories: 0,
    averagePrice: 0
  });

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
          
          // Extract unique categories
          const uniqueCategories = Array.from(new Set(productsData.map(p => p.category)));
          setCategories(uniqueCategories);
          
          // Calculate stats
          const activeProducts = productsData.filter(p => p.status === 'active');
          const avgPrice = productsData.reduce((acc, p) => acc + p.price, 0) / productsData.length;
          
          setStats({
            total: productsData.length,
            active: activeProducts.length,
            categories: uniqueCategories.length,
            averagePrice: avgPrice
          });
          
          applyFiltersAndSort(productsData);
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

  const applyFiltersAndSort = (productsToFilter: Product[] = products) => {
    let filtered = [...productsToFilter];
    
    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    
    if (filters.minPrice !== null) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!);
    }
    
    if (filters.maxPrice !== null) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!);
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredProducts(filtered);
  };

  useEffect(() => {
    applyFiltersAndSort();
  }, [filters, sortField, sortOrder, products]);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

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
    if (filteredProducts.length === 0) {
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
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200">
                <Link 
                  to={`/user/${storeId}/products/${product.id}`}
                  className="block"
                >
                  <div className="aspect-w-1 aspect-h-1 relative">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.title}
                        className="w-full h-48 object-contain p-4 bg-gray-50"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-gray-50">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    {product.status === 'inactive' && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Inactive
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                        {product.title}
                      </h3>
                      <span className="text-lg font-bold text-gray-900 ml-2 whitespace-nowrap">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {product.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      )}
                      {product.tags?.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                        In Stock
                      </span>
                      {product.created_at && (
                        <span className="ml-4">
                          Added {new Date(product.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="px-4 py-3 border-t flex justify-between items-center bg-gray-50">
                  <div className="flex space-x-2">
                    <Link
                      to={`/stores/${storeId}/products/${product.id}/edit`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="Edit product"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      title="Delete product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      ID: {product.id.slice(0, 8)}
                    </span>
                    <a
                      href={product.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                      title="View affiliate link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'list':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[45%]">
                        Product
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                        Price
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                        Category
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                        Status
                      </th>
                      <th scope="col" className="relative px-4 py-3 w-[10%]">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {product.image_urls && product.image_urls.length > 0 ? (
                                <img
                                  src={product.image_urls[0]}
                                  alt={product.title}
                                  className="h-10 w-10 object-contain rounded-lg bg-gray-50"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-3 min-w-0">
                              <Link 
                                to={`/user/${storeId}/products/${product.id}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600 block truncate"
                              >
                                {product.title}
                              </Link>
                              {product.description && (
                                <div className="relative group">
                                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {product.description}
                                  </p>
                                  <div className="hidden group-hover:block absolute z-10 left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg max-w-xs">
                                    {product.description}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${product.price.toFixed(2)}
                          </div>
                          {product.compare_at_price && (
                            <div className="text-xs text-gray-500 line-through">
                              ${product.compare_at_price.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {product.category ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {product.category}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-1">
                            <Link
                              to={`/stores/${storeId}/products/${product.id}/edit`}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                              title="Edit product"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
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

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and organize your store products
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/stores/${storeId}/products/add`)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
          <Dropdown
            trigger={
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <ArrowUpDown className="h-4 w-4" />
              </button>
            }
            items={[
              { label: 'Import Products', icon: Upload, onClick: () => {} },
              { label: 'Export Products', icon: Download, onClick: () => {} },
            ]}
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Products
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.total}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Active Products
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.active}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Categories
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.categories}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Average Price
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${stats.averagePrice.toFixed(2)}
            </dd>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <div className="flex items-center space-x-3">
              <Dropdown
                trigger={
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Filter className="h-4 w-4 mr-2 text-gray-500" />
                    Category
                  </button>
                }
                items={[
                  { label: 'All Categories', onClick: () => setFilters({ ...filters, category: 'all' }) },
                  ...categories.map(cat => ({
                    label: cat,
                    onClick: () => setFilters({ ...filters, category: cat })
                  }))
                ]}
              />
              <Dropdown
                trigger={
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <SortAsc className="h-4 w-4 mr-2 text-gray-500" />
                    Sort
                  </button>
                }
                items={[
                  { label: 'Name A-Z', onClick: () => { setSortField('title'); setSortOrder('asc'); } },
                  { label: 'Name Z-A', onClick: () => { setSortField('title'); setSortOrder('desc'); } },
                  { label: 'Price Low-High', onClick: () => { setSortField('price'); setSortOrder('asc'); } },
                  { label: 'Price High-Low', onClick: () => { setSortField('price'); setSortOrder('desc'); } },
                  { label: 'Newest First', onClick: () => { setSortField('created_at'); setSortOrder('desc'); } },
                  { label: 'Oldest First', onClick: () => { setSortField('created_at'); setSortOrder('asc'); } },
                ]}
              />
              <div className="flex items-center border border-gray-300 rounded-md shadow-sm divide-x">
                <ViewModeButton mode="grid" icon={LayoutGrid} label="Grid View" />
                <ViewModeButton mode="list" icon={List} label="List View" />
              </div>
            </div>
          </div>
          
          {/* Active Filters */}
          {(filters.category !== 'all' || filters.search || filters.status !== 'all') && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.category !== 'all' && (
                <Badge
                  label={`Category: ${filters.category}`}
                  onRemove={() => setFilters({ ...filters, category: 'all' })}
                />
              )}
              {filters.search && (
                <Badge
                  label={`Search: ${filters.search}`}
                  onRemove={() => setFilters({ ...filters, search: '' })}
                />
              )}
              {filters.status !== 'all' && (
                <Badge
                  label={`Status: ${filters.status}`}
                  onRemove={() => setFilters({ ...filters, status: 'all' })}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products List/Grid */}
      {renderProductsByViewMode()}
    </div>
  );
}