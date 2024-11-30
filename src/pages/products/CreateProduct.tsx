import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { createProduct } from '../../lib/api';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import { ProductForm } from '../../components/products/ProductForm';
import PageHeader from '../../components/ui/PageHeader';

export default function CreateProduct() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { storeId } = useParams();
  const { isWithinLimits } = useSubscriptionStore();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            title="Add New Product"
            subtitle="Create a new product to showcase in your store"
            showBackButton
            onBack={() => navigate(-1)}
            icon={Package}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
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
    </div>
  );
}
