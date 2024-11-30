import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import { Edit, ExternalLink, Share2, Trash2, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/Tooltip"; // Fix tooltip import path case sensitivity

interface ProductCardProps {
  product: Product;
  storeId: string | undefined;
  onDelete: (productId: string) => Promise<void>;
  viewMode: 'grid' | 'list';
}

interface ActionButtonProps extends Button.ButtonProps {
  icon: React.ReactNode;
  tooltip: string;
}

const ActionButton = ({ icon, tooltip, ...props }: ActionButtonProps) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
          {...props}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={5}>
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

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

  const handleCardClick = () => {
    if (storeId) {
      navigate(`/stores/${storeId}/products/${product.id}/edit`);
    } else {
      navigate(`/products/${product.id}/edit`);
    }
  };

  const handleViewProduct = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (storeId) {
      navigate(`/stores/${storeId}/products/${product.id}`);
    } else {
      navigate(`/products/${product.id}`);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + `/stores/${storeId}/products/${product.id}`);
      toast.success('Product link copied to clipboard');
    } catch (error) {
      console.error('Error sharing product:', error);
      toast.error('Failed to copy product link');
    }
  };

  if (viewMode === 'grid') {
    return (
      <div 
        className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Product Image */}
        <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          {product.image_urls?.[0] ? (
            <img
              src={product.image_urls[0]}
              alt={product.name}
              className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {product.sale_price ? (
                <>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(product.sale_price)}</span>
                  <span className="text-xs text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-gray-900">{formatPrice(product.price)}</span>
              )}
            </div>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              product.status === 'active'
                ? "bg-green-50 text-green-700"
                : "bg-gray-50 text-gray-700"
            )}>
              {product.status}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-1 flex items-center space-x-1">
            <ActionButton
              icon={<ExternalLink className="h-4 w-4" />}
              tooltip="View Product"
              onClick={handleViewProduct}
            />
            <ActionButton
              icon={<Share2 className="h-4 w-4" />}
              tooltip="Share Product"
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
            />
            <ActionButton
              icon={<Edit className="h-4 w-4" />}
              tooltip="Edit Product"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            />
            <ActionButton
              icon={<Trash2 className="h-4 w-4" />}
              tooltip="Delete Product"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div 
      className="group hover:bg-gray-50 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="px-4 py-4 flex items-center space-x-4">
        {/* Product Image */}
        <div className="flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden bg-gray-100">
          {product.image_urls?.[0] ? (
            <img
              src={product.image_urls[0]}
              alt={product.name}
              className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full ml-2",
              product.status === 'active'
                ? "bg-green-50 text-green-700"
                : "bg-gray-50 text-gray-700"
            )}>
              {product.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 line-clamp-1">{product.description}</p>
          <div className="mt-1 flex items-baseline gap-2">
            {product.sale_price ? (
              <>
                <span className="text-sm font-medium text-gray-900">{formatPrice(product.sale_price)}</span>
                <span className="text-xs text-gray-500 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-gray-900">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <ActionButton
            icon={<ExternalLink className="h-4 w-4" />}
            tooltip="View Product"
            onClick={handleViewProduct}
          />
          <ActionButton
            icon={<Share2 className="h-4 w-4" />}
            tooltip="Share Product"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
          />
          <ActionButton
            icon={<Edit className="h-4 w-4" />}
            tooltip="Edit Product"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          />
          <ActionButton
            icon={<Trash2 className="h-4 w-4" />}
            tooltip="Delete Product"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          />
        </div>
      </div>
    </div>
  );
}
