import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Share2, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Product } from '../../types';
import { supabase } from '../../lib/supabase';

export default function ProductView() {
  const { productId, storeId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('ProductView - Mounted with params:', { productId, storeId });

  // Add debug log for initial render
  console.log('ProductView - Initial render with:', { productId, storeId, loading, product });

  useEffect(() => {
    console.log('ProductView - useEffect START with:', { productId, storeId });

    // Skip if we're missing required params
    if (!productId || !storeId) {
      console.log('ProductView - Missing required params:', { productId, storeId });
      return;
    }

    // Navigate away if this is an add route - it should be handled by AddProduct component
    if (productId === 'add') {
      console.log('ProductView - Add route detected, navigating away');
      navigate(`/stores/${storeId}/products/add`);
      return;
    }

    const loadProduct = async () => {
      console.log('ProductView - loadProduct START:', { productId, storeId });
      
      try {
        setLoading(true);
        console.log('ProductView - Before Supabase query:', { productId, storeId });
        
        // Get the product directly from the database
        const { data: product, error } = await supabase
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
        
        console.log('ProductView - After Supabase query:', { product, error });

        if (error) {
          console.error('ProductView - Database error:', error);
          toast.error('Error loading product');
          return;
        }

        if (!product) {
          console.log('ProductView - No product found');
          toast.error('Product not found');
          return;
        }
        
        console.log('ProductView - Setting product:', product);
        setProduct(product);
      } catch (error) {
        console.error('ProductView - Error in loadProduct:', error);
        toast.error('Failed to load product');
      } finally {
        console.log('ProductView - loadProduct END');
        setLoading(false);
      }
    };

    // Debug log before calling loadProduct
    console.log('ProductView - About to call loadProduct');
    loadProduct();

    return () => {
      console.log('ProductView - useEffect cleanup');
    };
  }, [productId, storeId]);

  // Debug log for render
  console.log('ProductView - Rendering with state:', { product, loading, productId, storeId });

  const handleShare = async () => {
    if (!product) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href
        });
        toast.success('Product shared successfully!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast.error('Failed to share product');
    }
  };

  if (productId === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(`/stores/${storeId}/products`)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </button>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Product</h1>
              {/* Add your product creation form here */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/stores/${storeId}/products`)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
                {product.category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                    {product.category}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Share product"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                {product.affiliate_url && (
                  <a
                    href={product.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Product
                  </a>
                )}
              </div>
            </div>

            {/* Product Image */}
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-8">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="h-12 w-12" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-lg text-gray-500 line-through">
                    ${product.compare_at_price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {product.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
