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
import { Package } from "lucide-react";

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
        console.log('Loaded stores:', storesData);
        setStores(storesData);

        // If no storeId is selected but we have stores, redirect to the first store
        if (!storeId && storesData.length > 0) {
          navigate(`/stores/${storesData[0].id}/products`);
          return;
        }

        // If we have a storeId, load its products and categories
        if (storeId) {
          setLoading(true);
          console.log('Loading data for store:', storeId);
          
          const [productsData, categoriesData] = await Promise.all([
            getProducts(storeId),
            getCategories(storeId)
          ]);
          
          console.log('Loaded products:', productsData);
          console.log('Loaded categories:', categoriesData);
          
          setProducts(productsData);
          setFilteredProducts(productsData);
          
          // Filter categories to only include those that have products
          const categoriesWithProducts = categoriesData.filter(category => {
            if (category.type === 'system' && category.id === 'best-sellers') {
              // Include Best Sellers if there are featured products
              return productsData.some(product => product.is_featured);
            }
            // For other categories, check if any product has this category
            return productsData.some(product => 
              product.category_id === category.id || 
              (product.categories && product.categories.id === category.id)
            );
          });
          
          console.log('Categories with products:', categoriesWithProducts);
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
    let filtered = [...products];
    console.log('Starting filter with products:', filtered.length);
    console.log('Current filters:', filters);

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(product => {
        const title = (product.title || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        return title.includes(query) || description.includes(query);
      });
      console.log('After search filter:', filtered.length);
    }

    // Apply filters
    if (filters.status.length > 0) {
      filtered = filtered.filter(product => filters.status.includes(product.status));
      console.log('After status filter:', filtered.length);
    }
    
    if (filters.category.length > 0) {
      console.log('Applying category filters:', filters.category);
      filtered = filtered.filter(product => {
        // Handle Best Sellers category
        if (filters.category.includes('best-sellers')) {
          return product.is_featured === true;
        }
        // Handle regular categories
        return filters.category.some(categoryId => 
          product.category_id === categoryId || 
          (product.categories && product.categories.id === categoryId)
        );
      });
      console.log('After category filter:', filtered.length);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(product => 
        product.price && parseFloat(product.price) >= parseFloat(filters.minPrice)
      );
      console.log('After minPrice filter:', filtered.length);
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(product => 
        product.price && parseFloat(product.price) <= parseFloat(filters.maxPrice)
      );
      console.log('After maxPrice filter:', filtered.length);
    }

    setFilteredProducts(filtered);
  }, [products, filters, searchQuery]);

  // Memoize filtered products
  const activeProducts = useMemo(() => 
    products.filter(product => product.status === 'active'),
    [products]
  );
  
  const inactiveProducts = useMemo(() => 
    products.filter(product => product.status === 'inactive'),
    [products]
  );

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
    <div className="min-h-screen bg-gray-50">
      <ProductListHeader
        stores={stores}
        storeId={storeId}
        viewMode={viewMode}
        showFilters={showFilters}
        hasActiveFilters={hasActiveFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onViewModeChange={handleViewModeChange}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Total Results</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{products.length}</div>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-600">Active</div>
                <div className="mt-1 text-2xl font-semibold text-green-700">{activeProducts.length}</div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-600">Inactive</div>
                <div className="mt-1 text-2xl font-semibold text-orange-700">{inactiveProducts.length}</div>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
            </div>
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
    </div>
  );
}