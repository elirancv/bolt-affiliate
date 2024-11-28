import { useState, useEffect } from 'react';
import { Store } from '../types';
import { getStore, updateStore } from '../lib/api';
import { useToasts } from '../components/ui/Toast';

interface UseStoreFormProps {
  storeId: string;
  onSuccess?: () => void;
}

interface FormState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isDirty: boolean;
}

const DEFAULT_PROMOTION_SETTINGS = {
  show_free_shipping_banner: false,
  free_shipping_threshold: 50,
  banner_text: '🎉 Free shipping on orders over $50',
  banner_enabled: false,
};

export function useStoreForm({ storeId, onSuccess }: UseStoreFormProps) {
  const [formData, setFormData] = useState<Store | null>(null);
  const [originalData, setOriginalData] = useState<Store | null>(null);
  const [state, setState] = useState<FormState>({
    isLoading: true,
    isSaving: false,
    error: null,
    isDirty: false,
  });
  const { addToast } = useToasts();

  useEffect(() => {
    loadStore();
  }, [storeId]);

  const loadStore = async () => {
    try {
      const storeData = await getStore(storeId);
      const normalizedData = {
        ...storeData,
        promotion_settings: storeData.promotion_settings || DEFAULT_PROMOTION_SETTINGS,
        social_links: storeData.social_links || {},
        social_links_position: storeData.social_links_position || 'footer',
      };
      setFormData(normalizedData);
      setOriginalData(normalizedData);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load store',
      }));
      addToast({
        title: 'Error',
        description: 'Failed to load store settings',
        variant: 'destructive',
      });
    }
  };

  const updateField = <K extends keyof Store>(
    field: K,
    value: Store[K],
    shouldValidate = true
  ) => {
    setFormData(prev => {
      if (!prev) return prev;
      const newData = { ...prev, [field]: value };
      setState(prev => ({ ...prev, isDirty: true }));
      return newData;
    });
  };

  const updatePromotionSettings = (
    field: keyof Store['promotion_settings'],
    value: any
  ) => {
    setFormData(prev => {
      if (!prev) return prev;
      const newData = {
        ...prev,
        promotion_settings: {
          ...prev.promotion_settings,
          [field]: value,
        },
      };
      setState(prev => ({ ...prev, isDirty: true }));
      return newData;
    });
  };

  const updateSocialLink = (platform: string, value: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      const newData = {
        ...prev,
        social_links: {
          ...prev.social_links,
          [platform]: value,
        },
      };
      setState(prev => ({ ...prev, isDirty: true }));
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (!formData) return;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      await updateStore(storeId, formData);
      setOriginalData(formData);
      setState(prev => ({ ...prev, isDirty: false }));
      addToast({
        title: 'Success',
        description: 'Store settings saved successfully',
      });
      // Add a small delay before navigation to ensure the toast is shown
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to save changes',
      }));
      addToast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const resetForm = () => {
    setFormData(originalData);
    setState(prev => ({ ...prev, isDirty: false, error: null }));
  };

  return {
    formData,
    state,
    updateField,
    updatePromotionSettings,
    updateSocialLink,
    handleSubmit,
    resetForm,
  };
}
