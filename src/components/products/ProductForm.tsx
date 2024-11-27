import React from 'react';
import { Upload, Save } from 'lucide-react';
import FormField from '../ui/FormField';
import { Product } from '../../types';
import { uploadProductImage } from '../../lib/storage';
import ImageUploadSection from './form/ImageUploadSection';
import CategorySelect from './form/CategorySelect';
import PriceInput from './form/PriceInput';
import { useProductForm } from '../../hooks/useProductForm';

interface ProductFormProps {
  onSubmit: (data: Omit<Product, 'id' | 'created_at' | 'store_id'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  storeId: string;
  initialData?: Product;
}

export default function ProductForm({ 
  onSubmit, 
  onCancel, 
  loading, 
  error, 
  storeId,
  initialData 
}: ProductFormProps) {
  const {
    formData,
    imageHandlers,
    validation
  } = useProductForm(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.validateForm()) return;

    const finalCategory = formData.selectedCategory === 'Custom' ? formData.customCategory : formData.selectedCategory;

    try {
      let finalImageUrls: string[] = [];
      
      if (formData.isUrlMode) {
        finalImageUrls = formData.imageUrls.filter(url => url.trim() !== '');
      } else {
        finalImageUrls = await Promise.all(
          formData.imageFiles.map(async (file, index) => {
            if (file) {
              return await uploadProductImage(file, storeId);
            }
            return formData.imageUrls[index];
          })
        );
      }

      await onSubmit({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        affiliate_url: formData.affiliateUrl,
        image_urls: finalImageUrls.filter(Boolean) as string[],
        category: finalCategory,
      });
    } catch (err: any) {
      imageHandlers.setImageUploadError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500">
          <div className="flex">
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <FormField 
            label="Product Title"
            error={validation.errors.title}
          >
            <input
              type="text"
              value={formData.title}
              onChange={(e) => formData.setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a descriptive title"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => formData.setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your product in detail"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <PriceInput
              price={formData.price}
              setPrice={formData.setPrice}
              error={validation.errors.price}
            />

            <CategorySelect
              selectedCategory={formData.selectedCategory}
              setSelectedCategory={formData.setSelectedCategory}
              customCategory={formData.customCategory}
              setCustomCategory={formData.setCustomCategory}
              error={validation.errors.category}
            />
          </div>
        </div>

        {/* Images */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
          
          <ImageUploadSection
            isUrlMode={formData.isUrlMode}
            setIsUrlMode={formData.setIsUrlMode}
            imageUrls={formData.imageUrls}
            imageFiles={formData.imageFiles}
            updateImageUrl={imageHandlers.updateImageUrl}
            handleFileSelect={imageHandlers.handleFileSelect}
            removeImageField={imageHandlers.removeImageField}
            addImageField={imageHandlers.addImageField}
            error={validation.errors.imageUrl || validation.errors.imageFile || formData.imageUploadError}
          />
        </div>

        {/* Affiliate Link */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Affiliate Link</h3>
          
          <FormField 
            label="Affiliate URL"
            error={validation.errors.affiliateUrl}
          >
            <input
              type="url"
              value={formData.affiliateUrl}
              onChange={(e) => formData.setAffiliateUrl(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your affiliate URL"
            />
          </FormField>
        </div>
      </div>

      {/* Form Actions */}
      <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}