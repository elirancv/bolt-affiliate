import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Package, PlusCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProductCard } from './ProductCard';
import { cn } from '../../lib/utils';
import type { Product } from '../../types';

interface ProductListContentProps {
  loading: boolean;
  storeId?: string;
  stores: any[];
  products: Product[];
  filteredProducts: Product[];
  viewMode: 'grid' | 'list';
  onDelete: (productId: string) => void;
}

export function ProductListContent({
  loading,
  storeId,
  stores,
  products,
  filteredProducts,
  viewMode,
  onDelete,
}: ProductListContentProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg border border-gray-200">
        <div className="bg-blue-50 p-3 rounded-full">
          <Package className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No stores found</h3>
        <p className="mt-2 text-sm text-gray-500 text-center max-w-sm">
          Get started by creating your first store to manage your products.
        </p>
        <Button
          className="mt-4"
          onClick={() => navigate('/stores/new')}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Store
        </Button>
      </div>
    );
  }

  if (stores.length > 0 && filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg border border-gray-200">
        <div className="bg-blue-50 p-3 rounded-full">
          <Package className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
        <p className="mt-2 text-sm text-gray-500 text-center max-w-sm">
          {products.length === 0
            ? "Get started by adding your first product to this store"
            : "Try adjusting your filters or search terms"}
        </p>
        {products.length === 0 && storeId && (
          <Button
            className="mt-4"
            onClick={() => navigate(`/stores/${storeId}/products/new`)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 sm:px-6 py-3 border-b border-gray-200">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'product' : 'products'}
          {filteredProducts.length !== products.length && (
            <> out of <span className="font-medium text-gray-900">{products.length}</span> total</>
          )}
        </div>
      </div>
      <div className={cn(
        "p-4 sm:p-6",
        viewMode === 'grid'
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6"
          : "space-y-4"
      )}>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            viewMode={viewMode}
            storeId={storeId}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
