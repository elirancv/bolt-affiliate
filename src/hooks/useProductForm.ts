import { useState, useEffect } from 'react';
import { Product } from '../types';
import { useImageUpload } from './useImageUpload';

interface ValidationErrors {
  title?: string;
  price?: string;
  affiliateUrl?: string;
  imageUrl?: string;
  imageFile?: string;
  category?: string;
}

export function useProductForm(initialData?: Product) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price.toString() || '');
  const [affiliateUrl, setAffiliateUrl] = useState(initialData?.affiliate_url || '');
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'Electronics');
  const [customCategory, setCustomCategory] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const {
    imageUrls,
    imageFiles,
    imageUploadError,
    handleFileSelect,
    addImageField,
    removeImageField,
    updateImageUrl,
    setImageUploadError,
    setImageUrls
  } = useImageUpload(initialData?.image_urls || ['']);

  // Set initial custom category if it's not in predefined categories
  useEffect(() => {
    if (initialData?.category && !['Electronics', 'Fashion', 'Home & Garden', 'Books', 'Health & Beauty', 'Sports & Outdoors', 'Toys & Games', 'Automotive', 'Pet Supplies', 'Office Products', 'Food & Beverages', 'Art & Crafts', 'Baby & Kids', 'Tools & Home Improvement'].includes(initialData.category)) {
      setSelectedCategory('Custom');
      setCustomCategory(initialData.category);
    }
  }, [initialData]);

  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    }

    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      errors.price = 'Please enter a valid price';
    }

    if (!affiliateUrl) {
      errors.affiliateUrl = 'Affiliate URL is required';
    } else {
      try {
        new URL(affiliateUrl);
      } catch {
        errors.affiliateUrl = 'Please enter a valid URL';
      }
    }

    if (isUrlMode) {
      const hasValidUrl = imageUrls.some(url => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
      if (!hasValidUrl) {
        errors.imageUrl = 'Please enter at least one valid image URL';
      }
    } else {
      const hasFile = imageFiles.some(file => file !== null);
      if (!hasFile && !imageUrls.some(url => url.trim() !== '')) {
        errors.imageFile = 'Please select at least one image file';
      }
    }

    if (selectedCategory === 'Custom' && !customCategory.trim()) {
      errors.category = 'Please enter a custom category';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return {
    formData: {
      title,
      setTitle,
      description,
      setDescription,
      price,
      setPrice,
      affiliateUrl,
      setAffiliateUrl,
      selectedCategory,
      setSelectedCategory,
      customCategory,
      setCustomCategory,
      isUrlMode,
      setIsUrlMode,
      imageUrls,
      imageFiles,
      imageUploadError
    },
    imageHandlers: {
      handleFileSelect,
      addImageField,
      removeImageField,
      updateImageUrl,
      setImageUploadError
    },
    validation: {
      errors: validationErrors,
      validateForm
    }
  };
}