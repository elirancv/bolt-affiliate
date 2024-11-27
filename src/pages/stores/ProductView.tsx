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
          .select('*')
          .eq('id', productId)
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

  // ... rest of the component code remains the same ...
}