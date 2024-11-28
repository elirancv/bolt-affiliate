import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { createProduct, getCategories } from '../../lib/api';
import type { Product, Category } from '../../types';

type ProductFormData = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'store_id'>;

export default function ProductForm() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormData>();

  useEffect(() => {
    if (storeId) {
      getCategories(storeId).then(setCategories).catch(console.error);
    }
  }, [storeId]);

  const onSubmit = async (data: ProductFormData) => {
    if (!storeId) return;

    try {
      console.log('Form data:', data);
      await createProduct({
        ...data,
        store_id: storeId,
        status: 'active'
      });
      navigate(`/stores/${storeId}/products`);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-500 mt-1">Create a new product for your store</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'Product name is required' })}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <input
            type="number"
            id="price"
            step="0.01"
            {...register('price', { 
              valueAsNumber: true,
              min: { value: 0, message: 'Price must be positive' }
            })}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700">
            Sale Price (Optional)
          </label>
          <input
            type="number"
            id="sale_price"
            step="0.01"
            {...register('sale_price', { 
              valueAsNumber: true,
              min: { value: 0, message: 'Sale price must be positive' }
            })}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.sale_price && (
            <p className="mt-1 text-sm text-red-600">{errors.sale_price.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="product_url" className="block text-sm font-medium text-gray-700">
            Product URL
          </label>
          <input
            type="url"
            id="product_url"
            {...register('product_url', { 
              required: 'Product URL is required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Must be a valid URL starting with http:// or https://'
              }
            })}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.product_url && (
            <p className="mt-1 text-sm text-red-600">{errors.product_url.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="affiliate_url" className="block text-sm font-medium text-gray-700">
            Affiliate URL (Optional)
          </label>
          <input
            type="url"
            id="affiliate_url"
            {...register('affiliate_url', {
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Must be a valid URL starting with http:// or https://'
              }
            })}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.affiliate_url && (
            <p className="mt-1 text-sm text-red-600">{errors.affiliate_url.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
            Image URL (Optional)
          </label>
          <input
            type="url"
            id="image_url"
            {...register('image_url', {
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Must be a valid URL starting with http:// or https://'
              }
            })}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.image_url && (
            <p className="mt-1 text-sm text-red-600">{errors.image_url.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category (Optional)
          </label>
          <select
            id="category"
            {...register('category_id')}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/stores/${storeId}/products`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
