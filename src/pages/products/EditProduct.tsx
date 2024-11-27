import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { updateProduct } from '../../lib/api';
import { X, ArrowLeft } from 'lucide-react';
import ProductForm from '../../components/products/ProductForm';
import type { Product } from '../../types';
import { supabase } from '../../lib/supabase';

export default function EditProduct() {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { storeId, productId } = useParams();

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      
      try {
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
      }
    };

    loadProduct();
  }, [productId]);

  if (!storeId || !productId) {
    return <div>Store ID and Product ID are required</div>;
  }

  if (!product) {
    return (
      <div className="min-h-[400px] flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: Omit<Product, 'id' | 'created_at' | 'store_id'>) => {
    setLoading(true);
    setError('');

    try {
      await updateProduct(productId, {
        ...data,
        store_id: storeId,
      });
      navigate(`/stores/${storeId}/products`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 mb-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
                <p className="text-sm text-gray-500">Update your product details and images</p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <ProductForm
          storeId={storeId}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          loading={loading}
          error={error}
          initialData={product}
        />
      </div>
    </div>
  );
}