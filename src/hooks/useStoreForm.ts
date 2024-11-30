import { useState, useEffect } from 'react';
import { Store } from '../types';
import { getStore, updateStore } from '../lib/api';
import { toast } from 'sonner';

const DEFAULT_PROMOTION_SETTINGS = {
  banner_enabled: false,
  banner_text: '',
  banner_link: '',
  banner_color: '#000000',
  banner_background: '#ffffff',
};

interface FormState {
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isDirty: boolean;
}

interface UseStoreFormProps {
  storeId: string;
  onSuccess?: () => void;
}

export function useStoreForm({ storeId, onSuccess }: UseStoreFormProps) {
  const [formData, setFormData] = useState<Store | null>(null);
  const [originalData, setOriginalData] = useState<Store | null>(null);
  const [state, setState] = useState<FormState>({
    isLoading: true,
    isSaving: false,
    error: null,
    isDirty: false,
  });

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
      toast.error('Failed to load store settings');
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
      toast.success('Store settings saved successfully');
      // Add a small delay before navigation to ensure the toast is shown
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to save changes',
      }));
      toast.error('Failed to save changes');
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
