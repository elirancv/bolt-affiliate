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
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
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
    <div className="space-y-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all duration-200"
        >
          {/* Product Image */}
          <div className="relative flex-shrink-0">
            {product.image_urls?.[0] ? (
              <img
                src={product.image_urls[0]}
                alt={product.name}
                className="w-20 h-20 rounded-lg object-cover bg-gray-100"
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center bg-blue-50 rounded-lg">
                <ShoppingBag className="h-10 w-10 text-blue-600" />
              </div>
            )}
            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
              {product.period_clicks || 0}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0 mt-4 sm:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h3 className="text-base font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                ${product.price}
              </span>
            </div>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-gray-500 truncate">
                {product.stores?.name || 'Store name'}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <MousePointerClick className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {product.period_clicks || 0} clicks
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {Math.random() > 0.5 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-500">
                    {Math.floor(Math.random() * 100)}% vs last period
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => navigate(`/user/${product.store_id}/products/${product.id}`)}
              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="View Product"
            >
              <Eye className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate(`/stores/${product.store_id}/products/${product.id}/edit`)}
              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Edit Product"
            >
              <Edit2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
