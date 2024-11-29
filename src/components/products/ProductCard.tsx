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
} from "../ui/tooltip";

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

  const handleShare = async () => {
    try {
      const url = product.affiliate_url || product.product_url;
      if (!url) {
        toast.error('No product URL available');
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: product.title || product.name,
          text: product.description,
          url: url
        });
        toast.success('Product shared successfully');
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Product URL copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing product:', error);
      toast.error('Failed to share product');
    }
  };

  const handleVisitProduct = () => {
    const url = product.affiliate_url || product.product_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Product URL not available');
    }
  };

  // Common action buttons in consistent order
  const actionButtons = [
    {
      icon: <Edit className="h-4 w-4" />,
      tooltip: "Edit Product",
      onClick: () => storeId && navigate(`/stores/${storeId}/products/${product.id}/edit`)
    },
    {
      icon: <ExternalLink className="h-4 w-4" />,
      tooltip: "Visit Product",
      onClick: handleVisitProduct
    },
    {
      icon: <Share2 className="h-4 w-4" />,
      tooltip: "Share Product",
      onClick: handleShare
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      tooltip: "Delete Product",
      onClick: handleDelete
    }
  ];

  const renderActionButtons = () => (
    <div className={cn(
      "flex items-center gap-1",
      viewMode === 'grid' ? "justify-center mt-3 pt-3 border-t border-gray-100" : "mt-2"
    )}>
      {actionButtons.map((button, index) => (
        <ActionButton
          key={index}
          icon={button.icon}
          tooltip={button.tooltip}
          onClick={button.onClick}
        />
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-lg overflow-hidden group",
        viewMode === 'list' 
          ? "p-4" 
          : "h-full flex flex-col"
      )}
    >
      {viewMode === 'list' ? (
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <img
              src={product.image_urls?.[0] || '/placeholder-product.png'}
              alt={product.title || product.name}
              className="w-16 h-16 object-contain bg-gray-100"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/placeholder-product.png';
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate">
                  {product.title || product.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {product.description || "No description available"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-blue-600">
                    {formatPrice(product.price)}
                  </span>
                  {product.sale_price && product.sale_price < product.price && (
                    <span className="text-xs text-gray-500 line-through">
                      {formatPrice(product.sale_price)}
                    </span>
                  )}
                </div>
                <div className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  product.status === 'active'
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-50 text-gray-700"
                )}>
                  {product.status}
                </div>
              </div>
            </div>

            {/* Actions */}
            {renderActionButtons()}
          </div>
        </div>
      ) : (
        <>
          {/* Image Container */}
          <div className="aspect-square relative bg-gray-100">
            {product.image_urls?.[0] ? (
              <img
                src={product.image_urls[0]}
                alt={product.title || product.name}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = '/placeholder-product.png';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col p-3 justify-between min-h-[120px]">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
                {product.title || product.name}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                {product.description || "No description available"}
              </p>
              
              {/* Price and Status */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-blue-600">
                    {formatPrice(product.price)}
                  </span>
                  {product.sale_price && product.sale_price < product.price && (
                    <span className="text-xs text-gray-500 line-through">
                      {formatPrice(product.sale_price)}
                    </span>
                  )}
                </div>
                <div className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  product.status === 'active'
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-50 text-gray-700"
                )}>
                  {product.status}
                </div>
              </div>
            </div>

            {/* Actions */}
            {renderActionButtons()}
          </div>
        </>
      )}
    </div>
  );
}
