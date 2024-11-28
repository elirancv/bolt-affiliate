import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ExternalLink, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import type { Product } from '../../types';
import { cn } from '../../lib/utils';
import { trackProductClick } from '../../lib/analytics';

interface ProductGridProps {
  products: Product[];
  storeId: string;
  onSave?: (productId: string) => void;
  savedProductIds?: Set<string>;
}

export default function ProductGrid({ products, storeId, onSave, savedProductIds = new Set() }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No products found</h2>
        <p className="text-sm sm:text-base text-gray-600">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          storeId={storeId}
          onSave={onSave}
          isSaved={savedProductIds.has(product.id)}
        />
      ))}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  storeId: string;
  onSave?: (productId: string) => void;
  isSaved: boolean;
  categoryName?: string;
}

export function ProductCard({ product, storeId, onSave, isSaved, categoryName }: ProductCardProps) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.image_urls && product.image_urls.length > 1) {
      setCurrentImageIndex((prev) => 
        (prev - 1 + product.image_urls.length) % product.image_urls.length
      );
      setImageLoaded(false);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.image_urls && product.image_urls.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.image_urls.length);
      setImageLoaded(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const navigateToProduct = () => {
    navigate(`/preview/${storeId}/products/${product.id}`);
  };

  const handleBuyNowClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      await trackProductClick(storeId, product.id);
      window.open(product.affiliate_url, '_blank');
    } catch (error) {
      console.error('Error tracking product click:', error);
      // Still open the link even if tracking fails
      window.open(product.affiliate_url, '_blank');
    }
  };

  return (
    <div
      className="group bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={navigateToProduct}
        className="relative w-full pt-[100%] cursor-pointer overflow-hidden bg-gray-50"
      >
        {product.image_urls && product.image_urls.length > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
              </div>
            )}
            <img
              src={product.image_urls[currentImageIndex]}
              alt={product.name}
              onLoad={handleImageLoad}
              className={cn(
                "absolute inset-0 w-full h-full object-contain p-4",
                "transition-all duration-300 group-hover:scale-105",
                !imageLoaded && "opacity-0"
              )}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
          </div>
        )}

        {product.image_urls && product.image_urls.length > 1 && (isHovered || window.innerWidth < 640) && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 shadow-md text-gray-600 hover:text-gray-900 transition-all sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 shadow-md text-gray-600 hover:text-gray-900 transition-all sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {product.image_urls && product.image_urls.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {currentImageIndex + 1}/{product.image_urls.length}
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 
              onClick={navigateToProduct}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer mb-1"
            >
              {product.name}
            </h3>
            
            <p className="text-xs text-gray-600 line-clamp-2">
              {product.description}
            </p>
          </div>
          {onSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(product.id);
              }}
              className={cn(
                "p-1.5 rounded-full transition-all flex-shrink-0",
                isSaved ? "text-red-500" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
            </button>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-gray-900">
                  ${product.sale_price ? product.sale_price.toFixed(2) : product.price.toFixed(2)}
                </span>
                {product.sale_price && (
                  <span className="text-xs line-through text-gray-500">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
              {product.sale_price && (
                <span className="text-xs text-green-600 font-medium">
                  Save {Math.round((1 - product.sale_price/product.price) * 100)}% off
                </span>
              )}
            </div>
            {categoryName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {categoryName}
              </span>
            )}
          </div>

          <a
            href={product.affiliate_url}
            onClick={handleBuyNowClick}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-3 py-2 border border-transparent rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Buy Now
            <ExternalLink className="ml-1.5 h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}