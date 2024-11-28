import { createClient } from '@supabase/supabase-js';
import type { ApiResponse, ApiError } from '../types/api.types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Generic API wrapper
export async function apiRequest<T>(
  operation: () => Promise<any>
): Promise<ApiResponse<T>> {
  try {
    const response = await operation();
    
    if (response.error) {
      throw response.error;
    }

    return {
      data: response.data,
      error: null,
      status: 200,
    };
  } catch (error) {
    const apiError: ApiError = {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR',
      status: error.status || 500,
    };

    return {
      data: null,
      error: apiError.message,
      status: apiError.status,
    };
  }
}

// Example of a typed API method
export async function fetchData<T>(
  table: string,
  query?: object
): Promise<ApiResponse<T>> {
  return apiRequest<T>(async () => {
    let request = supabase.from(table).select();
    
    if (query) {
      request = request.match(query);
    }
    
    return await request;
  });
}
