import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import ImageIcon, { Upload, X, Plus, Trash2 } from 'lucide-react';
import FormField from '../common/FormField';
import CategorySelect from './CategorySelect';
import ImageModal from '../common/ImageModal';
import ImageSlider from '../common/ImageSlider';
import { parseAffiliateUrl } from '../../lib/utils/affiliate-parser';
import { scrapeProduct, isSupportedMarketplace } from '../../lib/utils/product-scraper';
import { toast } from 'sonner';
import { ProductStatus } from '../../types';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  sale_price: z.coerce.number().min(0, 'Sale price must be positive').optional().nullable(),
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

  useEffect(() => {
    if (!affiliateUrl || initialData) return; // Skip if editing an existing product

    const processUrl = async (url: string) => {
      try {
        setIsProcessing(true);
        const { marketplace, originalUrl } = parseAffiliateUrl(url);
        
        if (!marketplace || !isSupportedMarketplace(marketplace)) {
          toast.error('Unsupported marketplace. Currently we only support Amazon.');
          setIsProcessing(false);
          return;
        }

        // Set the product URL immediately after parsing
        setValue('product_url', originalUrl);
        setValue('affiliate_url', url);

        const productData = await scrapeProduct(originalUrl, marketplace);
        
        if (productData.error) {
          if (productData.error === '429') {
            toast.error(
              'RapidAPI rate limit exceeded',
              {
                description: 'Your API usage limit has been reached. Please check your RapidAPI subscription or try again later.',
                duration: 5000,
              }
            );
          } else {
            toast.error('Failed to fetch product details', {
              description: 'Please try again or enter details manually.',
              duration: 3000,
            });
          }
          setIsProcessing(false);
          return;
        }

        // Update other form fields with scraped data
        if (productData.name) {
          setValue('name', productData.name);
          setValue('description', productData.description || '');
          // Convert prices to numbers
          setValue('price', productData.price ? Number(productData.price) : 0);
          if (productData.sale_price) {
            setValue('sale_price', Number(productData.sale_price));
          }
          if (productData.image_urls?.length > 0) {
            setValue('image_urls', productData.image_urls);
          }
          
          toast.success('Product details fetched successfully!');
        }
      } catch (error: any) {
        console.error('Error processing URL:', error);
        toast.error('Failed to process URL', {
          description: 'Please check the URL and try again.',
          duration: 3000,
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processUrl(affiliateUrl);
  }, [affiliateUrl, initialData]);

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
    <div>
      <div className="max-w-3xl mx-auto p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          {/* Affiliate URL */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Product Source</h3>
              <p className="text-sm text-gray-500">Enter your affiliate link to automatically fetch product details</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliate_url">Affiliate URL</Label>
              <Input
                id="affiliate_url"
                {...register('affiliate_url')}
                placeholder="https://example.com/product?affiliate=your-id"
                className="w-full"
              />
              {errors.affiliate_url && (
                <p className="text-sm text-red-500">{errors.affiliate_url.message}</p>
              )}
            </div>
            {isProcessing && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <p className="text-sm text-gray-500">Enter the main details of your product</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter product name"
                  className="w-full"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  placeholder="Enter product description"
                  className="block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[100px]"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Pricing & Details</h3>
              <p className="text-sm text-gray-500">Set your product's pricing and additional details</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pricing Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Pricing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      {...register('price')}
                      placeholder="Enter product price"
                      className="w-full"
                    />
                    {errors.price && (
                      <p className="text-sm text-red-500">{errors.price.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Sale Price</Label>
                    <Input
                      id="sale_price"
                      {...register('sale_price')}
                      placeholder="Enter sale price"
                      className="w-full"
                    />
                    {errors.sale_price && (
                      <p className="text-sm text-red-500">{errors.sale_price.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Product Details</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_url">Product URL</Label>
                    <Input
                      id="product_url"
                      {...register('product_url')}
                      placeholder="https://"
                      className="w-full"
                    />
                    {errors.product_url && (
                      <p className="text-sm text-red-500">{errors.product_url.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category_id">Category</Label>
                    <CategorySelect
                      storeId={storeId}
                      value={watch('category_id')}
                      onChange={(value) => setValue('category_id', value, { shouldValidate: true })}
                    />
                    {errors.category_id && (
                      <p className="text-sm text-red-500">{errors.category_id.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        {...register('status')}
                        className="block w-full rounded-lg border-gray-200 shadow-sm focus:ring-0 focus:border-blue-400 sm:text-sm transition-colors"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                      </select>
                      {errors.status && (
                        <p className="text-sm text-red-500">{errors.status.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="is_featured">Featured</Label>
                      <div className="flex items-center h-9">
                        <input
                          id="is_featured"
                          type="checkbox"
                          {...register('is_featured')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">Featured product</span>
                      </div>
                      {errors.is_featured && (
                        <p className="text-sm text-red-500">{errors.is_featured.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
              <p className="text-sm text-gray-500">Add images to showcase your product</p>
            </div>

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
                    <Input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Enter image URL"
                      className="w-full"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddImage}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setNewImageUrl('');
                      setIsAddingImage(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="fixed bottom-0 left-0 right-0 border-t bg-white py-4 px-6 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Product'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
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