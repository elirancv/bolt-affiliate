import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { createProduct } from '../../lib/api';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ProductForm } from '../../components/products/ProductForm';

export default function CreateProduct() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { storeId } = useParams();
  const { isWithinLimits, getRemainingLimit } = useSubscriptionStore();

  if (!storeId) {
    return <div>Store ID is required</div>;
  }

  const handleSubmit = async (data: Omit<Product, 'id' | 'created_at' | 'store_id'>) => {
    // Check if user is within product limits
    if (!isWithinLimits('products', 0)) {
      toast.error('You have reached your product limit. Please upgrade your plan to add more products.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createProduct({
        store_id: storeId,
        ...data,
      });
      navigate(`/stores/${storeId}/products`);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to create product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Add New Product</h1>
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        <ProductForm
          storeId={storeId}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
