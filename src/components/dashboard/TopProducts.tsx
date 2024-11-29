import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
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

const getProducts = async () => {
  try {
    console.log('Fetching products...');
    const { data, error } = await supabase
      .from('product_clicks_view')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Fetched products:', data);
    
    // Transform the data to match the Product interface
    return data.map(product => ({
      id: product.product_id,
      name: product.product_name,
      description: product.description,
      store_id: product.store_id,
      image_url: product.image_url,
      status: product.status,
      is_featured: product.is_featured,
      created_at: product.created_at,
      updated_at: product.updated_at,
      views: 0, // Views will be implemented later
      clicks: product.click_count || 0
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

const SkeletonCard = () => (
  <div className="bg-white border border-gray-100 rounded-lg p-4 space-y-4">
    <div className="aspect-square bg-gray-200 rounded animate-pulse" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

const TopProducts = () => {
  const navigate = useNavigate();
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  console.log('TopProducts render:', { products, isLoading, error });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-2">Error loading products</div>
        <div className="text-sm text-gray-500">{(error as Error).message}</div>
      </div>
    );
  }

  if (products?.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No active products</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/products/new')}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <span>New Product</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white border border-gray-100 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/products/${product.id}`)}
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
            <div>
              <div className="text-gray-500">Views</div>
              <div className="font-medium">{product.views || 0}</div>
            </div>
            <div>
              <div className="text-gray-500">Clicks</div>
              <div className="font-medium">{product.clicks || 0}</div>
            </div>
            <div>
              <div className="text-gray-500">CTR</div>
              <div className="font-medium">
                {product.views
                  ? `${((product.clicks || 0) / product.views * 100).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopProducts;
