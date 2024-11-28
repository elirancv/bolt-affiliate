import { useState } from 'react';
import { Product } from '../types';
import { useImageUpload } from './useImageUpload';

interface ValidationErrors {
  name?: string;
  price?: string;
  affiliate_url?: string;
  image_url?: string;
  category_id?: string;
}

export function useProductForm(initialData?: Product) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [salePrice, setSalePrice] = useState(initialData?.sale_price?.toString() || '');
  const [affiliateUrl, setAffiliateUrl] = useState(initialData?.affiliate_url || '');
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category_id || '');
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

  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (!name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      errors.price = 'Please enter a valid price';
    }

    if (salePrice && (!isNaN(Number(salePrice)) && Number(salePrice) >= Number(price))) {
      errors.price = 'Sale price must be lower than regular price';
    }

    if (affiliateUrl) {
      try {
        new URL(affiliateUrl);
      } catch {
        errors.affiliate_url = 'Please enter a valid URL';
      }
    }

    if (!selectedCategory) {
      errors.category_id = 'Please select a category';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return {
    formData: {
      name,
      setName,
      description,
      setDescription,
      price,
      setPrice,
      salePrice,
      setSalePrice,
      affiliateUrl,
      setAffiliateUrl,
      selectedCategory,
      setSelectedCategory,
      imageUrls,
      imageFiles
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
      validateForm,
      imageUploadError
    }
  };
}