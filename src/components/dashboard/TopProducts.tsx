import React, { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Package, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  name: string;
  description?: string;
  store_id: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'draft';
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  views?: number;
  clicks?: number;
}

interface Store {
  id: string;
}

const getProducts = async () => {
  try {
    console.debug('Starting getProducts function...');
    
    // Get products with click counts from the view
    const { data: productsWithClicks, error: viewError } = await supabase
      .from('product_clicks_view')
      .select('*');

    console.debug('Raw query result:', {
      hasError: !!viewError,
      dataLength: productsWithClicks?.length || 0,
      error: viewError
    });

    if (viewError) {
      console.error('Error fetching products:', viewError);
      throw viewError;
    }

    if (!productsWithClicks) {
      console.debug('No products found in the view');
      return [];
    }

    // Filter active products
    const activeProducts = productsWithClicks.filter(p => p.status === 'active');
    console.debug('Active products:', {
      total: productsWithClicks.length,
      active: activeProducts.length
    });

    // Transform the data
    const transformedProducts = activeProducts.map(product => ({
      id: product.product_id || product.id,
      name: product.product_name || product.name,
      description: product.description,
      store_id: product.store_id,
      image_url: product.image_urls?.[0], // Get the first image from the array
      status: product.status,
      is_featured: product.is_featured,
      created_at: product.created_at,
      updated_at: product.updated_at,
      views: 0,
      clicks: product.click_count || 0
    }));

    console.debug('Final transformed products:', {
      count: transformedProducts.length,
      products: transformedProducts
    });

    return transformedProducts;
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw error;
  }
};

const getStores = async () => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*');

    if (error) {
      console.error('Error fetching stores:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getStores:', error);
    throw error;
  }
};

const SkeletonCard = React.memo(() => (
  <div className="bg-white border border-gray-100 rounded-lg p-4 space-y-4">
    <div className="aspect-square bg-gray-200 rounded animate-pulse" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={`skeleton-stat-${i}`} className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
));

const ProductCard = React.memo(({ product, onProductClick }: { product: Product; onProductClick: (id: string, storeId: string) => void }) => (
  <div
    className="bg-white border border-gray-100 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
    onClick={() => onProductClick(product.id, product.store_id)}
  >
    {product.image_url ? (
      <img
        src={product.image_url}
        alt={product.name}
        className="aspect-square object-cover rounded mb-4"
      />
    ) : (
      <div className="aspect-square bg-gray-100 rounded mb-4 flex items-center justify-center">
        <ShoppingBag className="w-12 h-12 text-gray-400" />
      </div>
    )}
    <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
      {product.description}
    </p>
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div key={`${product.id}-views`}>
        <div className="text-gray-500">Views</div>
        <div className="font-medium">{product.views || 0}</div>
      </div>
      <div key={`${product.id}-clicks`}>
        <div className="text-gray-500">Clicks</div>
        <div className="font-medium">{product.clicks || 0}</div>
      </div>
      <div key={`${product.id}-ctr`}>
        <div className="text-gray-500">CTR</div>
        <div className="font-medium">
          {product.views
            ? `${((product.clicks || 0) / product.views * 100).toFixed(1)}%`
            : '0%'}
        </div>
      </div>
    </div>
  </div>
));

const TopProducts = () => {
  const navigate = useNavigate();
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
    onSuccess: (data) => {
      console.debug('Products query succeeded:', {
        count: data?.length || 0,
        products: data
      });
    },
    onError: (error) => {
      console.error('Products query failed:', error);
    }
  });

  const { data: stores } = useQuery<Store[]>({
    queryKey: ['stores'],
    queryFn: getStores,
  });

  const handleProductClick = useCallback((id: string, storeId: string) => {
    console.log('TopProducts - handleProductClick:', { id, storeId });
    const path = `/stores/${storeId}/products/${id}`;
    console.log('TopProducts - Navigating to:', path);
    navigate(path);
  }, [navigate]);

  const handleAddProduct = () => {
    // Use the /products/add route which will trigger our ProductRedirect component
    navigate('/products/add');
  };

  // Debug log for render
  console.debug('TopProducts render state:', {
    productsCount: products?.length || 0,
    productsData: products,
    isLoading,
    hasError: !!error
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-red-500 mb-2">Error loading products</div>
            <div className="text-sm text-gray-500">{(error as Error).message}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products?.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="p-3 bg-blue-50 rounded-full mb-4">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
              Add your first product to start generating affiliate links and earning commissions.
            </p>
            <Button
              variant="default"
              onClick={handleAddProduct}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Product
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={handleProductClick}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopProducts;
