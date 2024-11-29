import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';
import { Edit, ExternalLink, Heart, Share2, Trash2, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
  storeId: string | undefined;
  onDelete: (productId: string) => Promise<void>;
  viewMode: 'grid' | 'list';
}

export function ProductCard({ product, storeId, onDelete, viewMode }: ProductCardProps) {
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await onDelete(product.id);
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(product.affiliate_url || product.product_url);
      toast.success('Product URL copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy URL');
    }
  };

  const handleLike = () => {
    // TODO: Implement like functionality
    toast('Like functionality coming soon!');
  };

  const handleVisitProduct = () => {
    const url = product.affiliate_url || product.product_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Product URL not available');
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md border border-gray-100",
        viewMode === 'list' 
          ? "flex items-center min-h-[80px] px-4 gap-6" 
          : "flex flex-col h-[420px]"
      )}
    >
      {/* Image Container */}
      <div
        className={cn(
          "relative group overflow-hidden bg-gray-50",
          viewMode === 'list' ? "w-16 h-16 flex-shrink-0" : "w-full h-48"
        )}
      >
        {product.image_urls?.[0] ? (
          <img
            src={product.image_urls[0]}
            alt={product.title || product.name}
            className={cn(
              "object-contain transition-transform duration-300 group-hover:scale-105",
              viewMode === 'list' ? "w-16 h-16 rounded p-2" : "w-full h-full p-4"
            )}
            onError={(e) => {
              console.error('Failed to load image:', product.image_urls?.[0]);
              e.currentTarget.src = '/placeholder-product.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
            <Package className={cn(
              viewMode === 'list' ? "h-8 w-8" : "h-12 w-12",
              "text-gray-400"
            )} />
          </div>
        )}
        
        {/* Hover Actions - Only show in grid view */}
        {viewMode !== 'list' && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-black/20"
              onClick={handleLike}
            >
              <Heart className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-black/20"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn(
        viewMode === 'list'
          ? "flex-1 flex items-center gap-6"
          : "flex-1 flex flex-col p-4"
      )}>
        {/* Title and Description */}
        <div className={cn(
          "flex-1",
          viewMode === 'list' ? "flex items-center gap-6" : "min-h-[120px] flex flex-col"
        )}>
          <div className={cn(
            viewMode === 'list' ? "flex-1" : "flex-1 flex flex-col"
          )}>
            <h3 className={cn(
              "font-medium text-gray-900 line-clamp-2",
              viewMode === 'list' ? "text-sm" : "text-base"
            )}>
              {product.title || product.name}
            </h3>
            {viewMode !== 'list' && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                {product.description || "No description available"}
              </p>
            )}
          </div>

          {/* Price and Status */}
          <div className={cn(
            "flex items-center gap-4",
            viewMode === 'list' ? "w-48" : "mt-auto pt-4"
          )}>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                {product.sale_price ? (
                  <>
                    <div className="font-medium text-blue-600">
                      {formatPrice(product.sale_price)}
                    </div>
                    <div className="text-sm text-gray-500 line-through">
                      {formatPrice(product.price)}
                    </div>
                  </>
                ) : (
                  <div className="font-medium text-blue-600">
                    {formatPrice(product.price)}
                  </div>
                )}
              </div>
              <div className={cn(
                "text-xs px-2 py-1 rounded-full w-fit mt-1",
                product.status === 'active'
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-700"
              )}>
                {product.status}
              </div>
            </div>

            {/* Actions */}
            <div className={cn(
              "flex gap-2",
              viewMode === 'list' ? "" : "border-t border-gray-100 pt-4"
            )}>
              {viewMode === 'list' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={handleLike}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => storeId && navigate(`/stores/${storeId}/products/${product.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={handleVisitProduct}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
