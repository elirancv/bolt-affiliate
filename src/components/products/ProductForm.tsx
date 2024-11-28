import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageIcon, Upload, X, Plus } from 'lucide-react';
import FormField from '../common/FormField';
import CategorySelect from './CategorySelect';
import { parseAffiliateUrl } from '../../lib/utils/affiliate-parser';
import { scrapeProduct, isSupportedMarketplace } from '../../lib/utils/product-scraper';
import toast from 'react-hot-toast';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  sale_price: z.number().min(0, 'Sale price must be positive').optional(),
  product_url: z.string().url('Must be a valid URL'),
  affiliate_url: z.string().url('Must be a valid URL').min(1, 'Affiliate URL is required'),
  category_id: z.string().min(1, 'Category is required'),
  status: z.enum(['active', 'inactive', 'out_of_stock']),
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
  const [images, setImages] = useState<string[]>(initialData?.image_urls || ['']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [marketplace, setMarketplace] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'active',
      ...initialData,
    },
  });

  // Watch affiliate URL for changes
  const affiliateUrl = watch('affiliate_url');

  // Handle affiliate URL changes
  useEffect(() => {
    if (!affiliateUrl) return;

    const processUrl = async () => {
      try {
        setIsProcessing(true);
        console.log('Processing URL:', affiliateUrl);
        
        const { marketplace, originalUrl } = parseAffiliateUrl(affiliateUrl);
        console.log('Parsed URL:', { marketplace, originalUrl });
        setMarketplace(marketplace || null);

        // Set the product URL regardless
        if (originalUrl) {
          console.log('Setting product URL:', originalUrl);
          setValue('product_url', originalUrl, { shouldValidate: true });
          clearErrors('product_url');

          // Only attempt to scrape if it's a supported marketplace
          if (marketplace && isSupportedMarketplace(originalUrl)) {
            console.log('Scraping product data...');
            const productData = await scrapeProduct(originalUrl, marketplace);
            console.log('Scraped product data:', productData);

            // Populate form with scraped data if available
            if (productData.name) {
              console.log('Setting name:', productData.name);
              setValue('name', productData.name, { shouldValidate: true });
            }
            if (productData.description) {
              console.log('Setting description:', productData.description);
              setValue('description', productData.description, { shouldValidate: true });
            }
            if (productData.price) {
              console.log('Setting price:', productData.price);
              setValue('price', productData.price, { shouldValidate: true });
            }
            if (productData.sale_price) {
              console.log('Setting sale price:', productData.sale_price);
              setValue('sale_price', productData.sale_price, { shouldValidate: true });
            }
            if (productData.image_urls?.length) {
              console.log('Setting images:', productData.image_urls);
              setImages(productData.image_urls);
              setValue('image_urls', productData.image_urls, { shouldValidate: true });
            }
            toast.success('Product details loaded successfully');
          } else {
            console.log('Not a supported marketplace or no original URL');
          }
        } else {
          console.log('No original URL found');
        }
      } catch (err) {
        console.error('Error processing affiliate URL:', err);
        toast.error('Failed to load product details');
      } finally {
        setIsProcessing(false);
      }
    };

    processUrl();
  }, [affiliateUrl]);

  const handleAffiliateUrlChange = async (url: string) => {
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
        setImages(productDetails.images);
        setValue('image_urls', productDetails.images);
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
    const newImages = [...images];
    newImages[index] = url;
    setImages(newImages);
    setValue('image_urls', newImages.filter(Boolean));
  };

  const addImageField = () => {
    setImages([...images, '']);
  };

  const removeImageField = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setValue('image_urls', newImages.filter(Boolean));
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit({
        ...data,
        image_urls: images.filter(Boolean),
      });
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Quick Input Section */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Quick Add Product</h3>
        <div className="space-y-4">
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
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {isProcessing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                </div>
              )}
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                </div>
              )}
            </div>
          </FormField>
        </div>
      </div>

      <FormField
        label="Product Name"
        error={errors.name?.message}
      >
        <input
          {...register('name')}
          type="text"
          placeholder="Enter product name"
          className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <CategorySelect
        storeId={storeId}
        value={watch('category_id') || ''}
        onChange={(value) => setValue('category_id', value)}
        error={errors.category_id?.message}
      />

      <FormField
        label="Description"
        error={errors.description?.message}
      >
        <textarea
          {...register('description')}
          placeholder="Enter product description"
          rows={4}
          className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-6">
        <FormField
          label="Price"
          error={errors.price?.message}
        >
          <input
            {...register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="Enter price"
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField
          label="Sale Price (Optional)"
          error={errors.sale_price?.message}
        >
          <input
            {...register('sale_price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="Enter sale price"
            className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>
      </div>

      <FormField
        label="Product URL (Original product page URL)"
        error={errors.product_url?.message}
        description="The URL of the original product page"
      >
        <input
          {...register('product_url')}
          type="url"
          placeholder="https://example.com/product"
          className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Product Images</h3>
          <button
            type="button"
            onClick={addImageField}
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Image
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative">
              <div className="aspect-square bg-gray-50 rounded-lg p-4 mb-2">
                {url ? (
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeImageField(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <FormField
        label="Status"
        error={errors.status?.message}
      >
        <select
          {...register('status')}
          className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </FormField>

      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
}