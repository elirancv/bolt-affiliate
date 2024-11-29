import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MousePointerClick, TrendingUp, TrendingDown } from 'lucide-react';
import type { Product } from '../../types';

interface TopProductsProps {
  products: Product[];
  loading?: boolean;
}

export default function TopProducts({ products, loading = false }: TopProductsProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-gray-50 p-4 rounded-lg animate-pulse"
          >
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {products.map((product) => (
        <div
          key={product.id}
          className="group bg-white border border-gray-100 rounded-lg hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          <div className="relative aspect-square">
            <img
              src={product.image_urls?.[0] || '/placeholder.png'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            {product.period_clicks > 0 && (
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm">
                  <MousePointerClick className="w-3 h-3 mr-1" />
                  {product.period_clicks}
                </span>
                {product.period_clicks > 100 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm">
                    <TrendingUp className="w-3 h-3" />
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="mb-2">
              <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                {product.name}
              </h4>
              {product.stores?.name && (
                <p className="text-sm text-gray-500 mt-1">
                  {product.stores.name}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">
                ${product.price?.toFixed(2)}
              </span>
              <div className="flex items-center text-sm text-gray-500">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                <span>+24%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
