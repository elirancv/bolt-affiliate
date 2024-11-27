import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct } from '../../lib/api';
import { X } from 'lucide-react';
import ProductForm from '../../components/products/ProductForm';
import type { Product } from '../../types';

export default function AddProduct() {
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { storeId } = useParams();

  if (!storeId) {
    return <div>Store ID is required</div>;
  }

  const handleSubmit = async (data: Omit<Product, 'id' | 'created_at' | 'store_id'>) => {
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