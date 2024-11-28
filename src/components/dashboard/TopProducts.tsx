import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MousePointerClick, Eye, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import type { Product } from '../../types';

interface TopProductsProps {
  products: Product[];
  loading?: boolean;
}

export default function TopProducts({ products, loading = false }: TopProductsProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg shadow-sm animate-pulse"
          >
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Add products to your store to see performance metrics and track their success
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => navigate(`/user/${product.store_id}/products/${product.id}`)}
        >
          <div className="relative aspect-square mb-4">
            <img
              src={product.image_urls?.[0] || '/placeholder.png'}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
            {product.period_clicks > 0 && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                {product.period_clicks} clicks
              </div>
            )}
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 line-clamp-2">
              {product.name}
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                ${product.price?.toFixed(2)}
              </span>
              <span className="text-xs text-gray-500">
                {product.stores?.name}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
