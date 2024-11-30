import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getStores, getProducts, deleteProduct, getCategories } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { ProductListHeader } from '../../components/products/ProductListHeader';
import { ProductListStats } from '../../components/products/ProductListStats';
import { ProductListContent } from '../../components/products/ProductListContent';
import { ProductFilters } from '../../components/products/ProductFilters';
import type { Product, Store } from '../../types';
import { cn } from '../../lib/utils';
import { Package, Plus, Search, LayoutGrid, List, Filter, CheckCircle, XCircle } from "lucide-react";
import { Button } from '../../components/ui';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';

export default function ProductList() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const savedViewMode = localStorage.getItem('productViewMode');
    return (savedViewMode === 'list' || savedViewMode === 'grid') ? savedViewMode : 'grid';
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: [],
    category: [],
    minPrice: '',
    maxPrice: '',
  });

  // Fetch stores, products, and categories
  useEffect(() => {
    if (!user?.id) return;
    
    const loadData = async () => {
      try {
        // First load stores
        const storesData = await getStores(user.id);
        setStores(storesData);

        // If no storeId is selected but we have stores, redirect to the first store
        if (!storeId && storesData.length > 0) {
          navigate(`/stores/${storesData[0].id}/products`);
          return;
        }

        // If we have a storeId, load its products and categories
        if (storeId) {
          setLoading(true);
          
          const [productsData, categoriesData] = await Promise.all([
            getProducts(storeId),
            getCategories(storeId)
          ]);
          
          setProducts(productsData);
          setFilteredProducts(productsData);
          
          // Filter categories to only include those that have products
          const categoriesWithProducts = categoriesData.filter(category => {
            if (category.type === 'system' && category.id === 'best-sellers') {
              // Include Best Sellers if there are featured products
              const hasFeaturedProducts = productsData.some(product => product.is_featured);
              return hasFeaturedProducts;
            }
            // For other categories, check if any product has this category
            const hasProducts = productsData.some(product => 
              product.category_id === category.id || 
              (product.category && product.category.id === category.id)
            );
            return hasProducts;
          });
          
          setCategories(categoriesWithProducts);
        }
      } catch (error: any) {
        console.error('Error in loadData:', error);
        toast.error('Error loading data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, storeId]);

  // Apply filters and search
  useEffect(() => {
    if (!products) return;

    let filtered = [...products];
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      
      filtered = filtered.filter(product => {
        // Safely convert values to string and handle null/undefined
        const searchableFields = [
          product?.name,
          product?.description,
          product?.sku,
          product?.category?.name,
          product?.metadata?.keywords,
        ].filter(Boolean).map(field => {
          if (Array.isArray(field)) {
            return field.join(' ').toLowerCase();
          }
          return String(field).toLowerCase();
        });
        
        // Check if any field contains the search query
        return searchableFields.some(field => field.includes(query));
      });
    }

    // Apply status filters
    if (filters.status.length > 0) {
      filtered = filtered.filter(product => filters.status.includes(product.status));
    }
    
    // Apply category filters
    if (filters.category.length > 0) {
      filtered = filtered.filter(product => {
        // Handle Best Sellers category
        if (filters.category.includes('best-sellers')) {
          return product.is_featured === true;
        }
        // Handle regular categories
        return filters.category.some(categoryId => 
          product.category_id === categoryId || 
          (product.category && product.category.id === categoryId)
        );
      });
    }

    // Apply price filters
    if (filters.minPrice || filters.maxPrice) {
      if (filters.minPrice) {
        const minPrice = parseFloat(filters.minPrice);
        filtered = filtered.filter(product => 
          product.price && !isNaN(parseFloat(product.price)) && parseFloat(product.price) >= minPrice
        );
      }
      if (filters.maxPrice) {
        const maxPrice = parseFloat(filters.maxPrice);
        filtered = filtered.filter(product => 
          product.price && !isNaN(parseFloat(product.price)) && parseFloat(product.price) <= maxPrice
        );
      }
    }

    setFilteredProducts(filtered);
  }, [products, filters, searchQuery]);

  // Memoize filtered products
  const statusCounts = useMemo(() => {
    return {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      inactive: products.filter(p => p.status === 'inactive').length
    };
  }, [products]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error: any) {
      toast.error('Error deleting product: ' + error.message);
    }
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('productViewMode', mode);
  };

  const hasActiveFilters = filters.status.length > 0 || 
    filters.category.length > 0 || 
    filters.minPrice !== '' || 
    filters.maxPrice !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and organize your store products
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => navigate('create')} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Store Selector */}
      <div className="flex items-center space-x-4">
        <Select
          value={storeId || ''}
          onValueChange={(value) => {
            navigate(`/stores/${value}/products`);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a store" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Results</h3>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{statusCounts.total}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active</h3>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{statusCounts.active}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-50 rounded-lg">
              <XCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Inactive</h3>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{statusCounts.inactive}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-10 pr-10 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg',
                viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg',
                viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(true)} className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-4">
        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <ProductFilters
              categories={categories}
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Products Grid/List */}
        <div className="flex-1 min-w-0">
          <ProductListContent
            loading={loading}
            storeId={storeId}
            stores={stores}
            products={products}
            filteredProducts={filteredProducts}
            viewMode={viewMode}
            onDelete={handleDeleteProduct}
          />
        </div>
      </div>
    </div>
  );
}