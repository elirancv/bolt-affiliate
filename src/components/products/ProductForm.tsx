import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageIcon, Upload, X, Plus, Trash2 } from 'lucide-react';
import FormField from '../common/FormField';
import CategorySelect from './CategorySelect';
import ImageModal from '../common/ImageModal';
import ImageSlider from '../common/ImageSlider';
import { parseAffiliateUrl } from '../../lib/utils/affiliate-parser';
import { scrapeProduct, isSupportedMarketplace } from '../../lib/utils/product-scraper';
import toast from 'react-hot-toast';
import { ProductStatus } from '../../types';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  sale_price: z.number().min(0, 'Sale price must be positive').optional(),
  product_url: z.string().url('Must be a valid URL'),
  affiliate_url: z.string().url('Must be a valid URL').min(1, 'Affiliate URL is required'),
  category_id: z.string().min(1, 'Category is required'),
  status: z.enum(['active', 'inactive', 'draft'] as const),
  is_featured: z.boolean().optional(),
  image_urls: z.array(z.string().url('Must be a valid URL')).min(1, 'At least one image is required'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  storeId: string;
  onSubmit: (data: ProductFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
  initialData?: Partial<ProductFormData>;
}

export default function ProductForm({ storeId, onSubmit, loading = false, error, initialData }: ProductFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [marketplace, setMarketplace] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      store_id: storeId,
      status: 'active',
      image_urls: initialData?.image_urls || [],
      ...(initialData && {
        ...initialData,
        price: initialData.price?.toString(),
        sale_price: initialData.sale_price?.toString(),
      }),
    },
  });

  // Watch affiliate URL for changes
  const affiliateUrl = watch('affiliate_url');

  // Watch image_urls for changes
  const imageUrls = watch('image_urls');

  // Handle affiliate URL changes
  useEffect(() => {
    if (!affiliateUrl || initialData) return; // Skip if editing an existing product

    const processUrl = async () => {
      try {
        setIsProcessing(true);
        const { marketplace, originalUrl } = parseAffiliateUrl(affiliateUrl);
        setMarketplace(marketplace || null);

        // Set the product URL regardless
        if (originalUrl) {
          setValue('product_url', originalUrl, { shouldValidate: true });
          clearErrors('product_url');

          // Only attempt to scrape if it's a supported marketplace
          if (marketplace && isSupportedMarketplace(originalUrl)) {
            const productData = await scrapeProduct(originalUrl, marketplace);

            // Populate form with scraped data if available, but not images
            if (productData.name) {
              setValue('name', productData.name, { shouldValidate: true });
            }
            if (productData.description) {
              setValue('description', productData.description, { shouldValidate: true });
            }
            if (productData.price) {
              setValue('price', productData.price, { shouldValidate: true });
            }
            if (productData.sale_price) {
              setValue('sale_price', productData.sale_price, { shouldValidate: true });
            }
            
            toast.success('Product details loaded successfully');
          }
        }
      } catch (err) {
        console.error('Error processing affiliate URL:', err);
        toast.error('Failed to load product details');
      } finally {
        setIsProcessing(false);
      }
    };

    processUrl();
  }, [affiliateUrl, initialData]);

  const handleAffiliateUrlChange = async (url: string) => {
    if (initialData) return; // Skip if editing an existing product
    
    setIsLoading(true);
    try {
      const { marketplace, originalUrl } = parseAffiliateUrl(url);
      if (!marketplace || !originalUrl) {
        toast.error('Invalid affiliate URL');
        return;
      }
      
      // Fetch product details
      const productDetails = await scrapeProduct(originalUrl, marketplace);
      
      // Update form with scraped details
      if (productDetails.title) setValue('name', productDetails.title);
      if (productDetails.description) setValue('description', productDetails.description);
      if (productDetails.price) setValue('price', productDetails.price.toString());
      if (productDetails.sale_price) setValue('sale_price', productDetails.sale_price.toString());
      if (productDetails.images?.length) {
        // Only set images if there are no existing images during initial load
        const currentImages = watch('image_urls') || [];
        if (currentImages.length === 0) {
          setValue('image_urls', productDetails.images);
        }
      }
      
      toast.success('Product details loaded successfully');
    } catch (error) {
      console.error('Error processing affiliate URL:', error);
      toast.error('Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (index: number, url: string) => {
    const newImages = [...(imageUrls || [])];
    newImages[index] = url;
    setValue('image_urls', newImages, { shouldValidate: true });
  };

  // Handle add image
  const handleAddImage = () => {
    if (newImageUrl) {
      const updatedImages = [...(imageUrls || []), newImageUrl];
      setValue('image_urls', updatedImages, { shouldValidate: true });
      setNewImageUrl('');
      setIsAddingImage(false);
    }
  };

  // Handle remove image
  const handleRemoveImage = (index: number) => {
    const updatedImages = imageUrls.filter((_, i) => i !== index);
    setValue('image_urls', updatedImages, { shouldValidate: true });
    if (currentImageIndex >= updatedImages.length) {
      setCurrentImageIndex(Math.max(0, updatedImages.length - 1));
    }
  };

  // Handle reorder images
  const handleReorderImages = (reorderedImages: string[]) => {
    setValue('image_urls', reorderedImages, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      // Filter out any empty image URLs
      const filteredImageUrls = imageUrls.filter(Boolean);
      
      // Update the data with filtered image URLs
      const updatedData = {
        ...data,
        image_urls: filteredImageUrls,
        price: data.price ? parseFloat(data.price) : null,
        sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
      };

      await onSubmit(updatedData);
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  const handleSyncWithAmazon = async () => {
    const currentAffiliateUrl = watch('affiliate_url');
    if (!currentAffiliateUrl) {
      toast.error('No affiliate URL found');
      return;
    }

    try {
      setIsProcessing(true);
      const { marketplace, originalUrl } = parseAffiliateUrl(currentAffiliateUrl);
      
      if (!marketplace || !originalUrl || !isSupportedMarketplace(originalUrl)) {
        toast.error('Invalid or unsupported marketplace URL');
        return;
      }

      const productData = await scrapeProduct(originalUrl, marketplace);
      
      // Update form with scraped data
      if (productData.name) {
        setValue('name', productData.name, { shouldValidate: true });
      }
      if (productData.description) {
        setValue('description', productData.description, { shouldValidate: true });
      }
      if (productData.price) {
        setValue('price', productData.price, { shouldValidate: true });
      }
      if (productData.sale_price) {
        setValue('sale_price', productData.sale_price, { shouldValidate: true });
      }
      // Always update images during manual sync
      if (productData.image_urls?.length) {
        setValue('image_urls', productData.image_urls, { shouldValidate: true });
      }
      
      toast.success('Product details updated from Amazon');
    } catch (error) {
      console.error('Error syncing with Amazon:', error);
      toast.error('Failed to sync with Amazon');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Status and Featured Fields */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
              {errors.status && (
                <p className="mt-2 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="is_featured"
                type="checkbox"
                {...register('is_featured')}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                Featured Product
              </label>
            </div>
          </div>

          {/* Affiliate URL */}
          <FormField
            label="Affiliate URL"
            error={errors.affiliate_url?.message}
            description={
              isProcessing
                ? "Processing URL..."
                : marketplace
                  ? `Detected marketplace: ${marketplace}`
                  : "Paste your affiliate link from Amazon, AliExpress, etc."
            }
          >
            <div className="relative">
              <input
                {...register('affiliate_url')}
                type="url"
                placeholder="https://example.com/product?affiliate=your-id"
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
              />
              {isProcessing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                </div>
              )}
            </div>
          </FormField>

          {/* Product Name */}
          <FormField
            label="Product Name"
            type="text"
            {...register('name')}
            error={errors.name?.message}
          />

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <div className="mt-1">
              <textarea
                {...register('description')}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {errors.description && (
              <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Pricing & Details Grid */}
          <div className="space-y-4">
            {/* Pricing Section */}
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
              <h3 className="text-base font-medium text-gray-900 mb-4">Pricing</h3>
              <div className="space-y-4">
                <FormField label="Price" error={errors.price?.message}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      {...register('price', { valueAsNumber: true })}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </FormField>

                <FormField label="Sale Price" error={errors.sale_price?.message}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      {...register('sale_price', { valueAsNumber: true })}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </FormField>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
              <h3 className="text-base font-medium text-gray-900 mb-4">Product Details</h3>
              <div className="space-y-4">
                <FormField label="Product URL" error={errors.product_url?.message}>
                  <input
                    type="url"
                    {...register('product_url')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow text-sm"
                    placeholder="https://"
                  />
                </FormField>

                <FormField label="Category" error={errors.category_id?.message} description="Select a category for your product">
                  <CategorySelect
                    storeId={storeId}
                    value={watch('category_id')}
                    onChange={(value) => setValue('category_id', value, { shouldValidate: true })}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Status"
                    error={errors.status?.message}
                  >
                    <select
                      {...register('status')}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </FormField>

                  <FormField
                    label="Featured Product"
                    error={errors.is_featured?.message}
                  >
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        {...register('is_featured')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        Mark as featured product
                      </span>
                    </div>
                  </FormField>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
            <h3 className="text-base font-medium text-gray-900 mb-4">Product Images</h3>
            <div className="space-y-4">
              <ImageSlider
                images={imageUrls || []}
                onImageClick={(index) => setCurrentImageIndex(index)}
                onRemoveImage={handleRemoveImage}
                onAddImage={() => setIsAddingImage(true)}
                onReorderImages={handleReorderImages}
              />
              {/* New Image URL Input */}
              {isAddingImage && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter image URL"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewImageUrl('');
                      setIsAddingImage(false);
                    }}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}