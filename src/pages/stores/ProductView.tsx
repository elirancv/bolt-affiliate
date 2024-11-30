import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useSavedProductsStore } from '../../store/savedProductsStore';
import ShareModal from '../../components/products/ShareModal';
import { trackProductClick, trackPageView } from '../../lib/analytics';
import type { Product } from '../../types';

export default function ProductView() {
  const { storeId, productId } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const { saveProduct, unsaveProduct, isProductSaved } = useSavedProductsStore();
  const [imageLoaded, setImageLoaded] = React.useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId || !storeId) return;
      
      try {
        // Track page view
        await trackPageView(storeId);

        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            store:stores (
              id,
              name
            )
          `)
          .eq('id', productId)
          .eq('store_id', storeId)
          .single();

        if (error) throw error;
        if (data) setProduct(data);
      } catch (err: any) {
        console.error('Error loading product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, storeId]);

  const handleBuyNowClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!product || !storeId) return;

    try {
      await trackProductClick(storeId, product.id);
      window.open(product.affiliate_url, '_blank');
    } catch (error) {
      console.error('Error tracking product click:', error);
      // Still open the link even if tracking fails
      window.open(product.affiliate_url, '_blank');
    }
  };

  const handleNextImage = () => {
    if (!product?.image_urls) return;
    setCurrentImageIndex((prev) => (prev + 1) % product.image_urls.length);
  };

  const handlePrevImage = () => {
    if (!product?.image_urls) return;
    setCurrentImageIndex((prev) => (prev - 1 + product.image_urls.length) % product.image_urls.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 mb-4">Product not found</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.image_urls && product.image_urls.length > 0 ? (
              <>
                <img
                  src={product.image_urls[currentImageIndex]}
                  alt={product.name}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
                {product.image_urls.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-4">
                    <button
                      onClick={handlePrevImage}
                      className="p-2 bg-white/80 rounded-full hover:bg-white"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="p-2 bg-white/80 rounded-full hover:bg-white"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <div className="flex items-center space-x-4 mb-6">
              <p className="text-2xl font-bold text-gray-900">
                ${product.sale_price || product.price}
              </p>
              {product.sale_price && (
                <p className="text-lg text-gray-500 line-through">${product.price}</p>
              )}
            </div>

            <p className="text-gray-600 mb-8">{product.description}</p>

            <div className="flex items-center space-x-4 mb-8">
              <a
                href="#"
                onClick={handleBuyNowClick}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg text-center hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Buy Now</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => isProductSaved(product.id) ? unsaveProduct(product.id) : saveProduct(product)}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Heart
                  className={cn(
                    "w-6 h-6",
                    isProductSaved(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                  )}
                />
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={product}
      />
    </div>
  );
}