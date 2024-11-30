import { useState, useCallback } from 'react';
import { ApiClient, ApiResponse, ApiError } from '../api/clients/apiClient';
import { logger } from '../services/logger';
import { analytics } from '../services/analytics';
import { toast } from 'react-hot-toast';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  showToast?: boolean;
  trackAnalytics?: boolean;
}

interface UseApiState<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
}

export function useApi<T>(apiClient: ApiClient, options: UseApiOptions<T> = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    isLoading: false
  });

  const handleSuccess = useCallback((data: T) => {
    if (options.trackAnalytics) {
      analytics.trackEvent('api_call_success', { data });
    }
    if (options.showToast) {
      toast.success('Operation completed successfully');
    }
    options.onSuccess?.(data);
  }, [options]);

  const handleError = useCallback((error: ApiError) => {
    logger.error('API Call Failed', { error });
    
    if (options.trackAnalytics) {
      analytics.trackError(error);
    }
    if (options.showToast) {
      toast.error(error.message || 'An error occurred');
    }
    options.onError?.(error);
  }, [options]);

  const request = useCallback(async <R = T>(
    operation: () => Promise<ApiResponse<R>>
  ): Promise<R | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await operation();
      setState(prev => ({ ...prev, data: response.data as any, isLoading: false }));
      handleSuccess(response.data as any);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({ ...prev, error: apiError, isLoading: false }));
      handleError(apiError);
      return null;
    }
  }, [handleSuccess, handleError]);

  const get = useCallback(async (
    endpoint: string,
    params?: Record<string, string>
  ) => {
    return request(() => apiClient.get<T>(endpoint, params));
  }, [apiClient, request]);

  const post = useCallback(async (
    endpoint: string,
    data?: any
  ) => {
    return request(() => apiClient.post<T>(endpoint, data));
  }, [apiClient, request]);

  const put = useCallback(async (
    endpoint: string,
    data?: any
  ) => {
    return request(() => apiClient.put<T>(endpoint, data));
  }, [apiClient, request]);

  const del = useCallback(async (
    endpoint: string
  ) => {
    return request(() => apiClient.delete<T>(endpoint));
  }, [apiClient, request]);

  return {
    ...state,
    get,
    post,
    put,
    delete: del
  };
}
