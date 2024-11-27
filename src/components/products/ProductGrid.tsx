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
}

function ProductCard({ product, storeId, onSave, isSaved }: ProductCardProps) {
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
    navigate(`/stores/${storeId}/products/${product.id}`);
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
        className="relative aspect-square cursor-pointer overflow-hidden bg-gray-50"
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
              alt={product.title}
              onLoad={handleImageLoad}
              className={cn(
                "w-full h-full object-contain p-4",
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
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-md text-gray-600 hover:text-gray-900 transition-all sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-md text-gray-600 hover:text-gray-900 transition-all sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </>
        )}

        {onSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(product.id);
            }}
            className={cn(
              "absolute top-2 right-2 p-2 rounded-full shadow-md transition-all",
              "sm:opacity-0 sm:group-hover:opacity-100",
              isSaved ? "bg-red-50 text-red-500" : "bg-white/90 text-gray-600 hover:text-gray-900"
            )}
          >
            <Heart className={cn("h-4 w-4 sm:h-5 sm:w-5", isSaved && "fill-current")} />
          </button>
        )}

        {product.image_urls && product.image_urls.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {currentImageIndex + 1}/{product.image_urls.length}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 
          onClick={navigateToProduct}
          className="text-base sm:text-lg font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer"
        >
          {product.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {product.category}
              </span>
            )}
          </div>

          <a
            href={product.affiliate_url}
            onClick={handleBuyNowClick}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Buy Now
            <ExternalLink className="ml-1.5 h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}