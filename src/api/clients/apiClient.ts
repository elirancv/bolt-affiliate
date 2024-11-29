import { analytics } from '../../services/analytics';

export interface ApiClientConfig {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ApiClient {
  private baseURL: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };
    this.timeout = config.timeout || 30000;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    
    try {
      const data = await response.json();
      const endTime = performance.now();
      
      // Log performance metrics in development
      if (import.meta.env.DEV) {
        console.log('API Response Time:', {
          url: response.url,
          duration: endTime - startTime,
          status: response.status
        });
      }

      // Track successful API call
      analytics.trackEvent('api_call_success', {
        url: response.url,
        duration: endTime - startTime,
        status: response.status
      });

      return {
        data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      console.error('API Response Parse Error', {
        url: response.url,
        status: response.status,
        error
      });

      throw {
        message: 'Failed to parse API response',
        status: response.status,
        code: 'PARSE_ERROR'
      };
    }
  }

  private async handleError(error: any, url: string): Promise<never> {
    const apiError: ApiError = {
      message: error.message || 'An unknown error occurred',
      status: error.status,
      code: error.code
    };

    // Log error details
    console.error('API Call Failed', {
      url,
      error: apiError
    });

    // Track error in analytics
    analytics.trackError(error, {
      url,
      status: apiError.status,
      code: apiError.code
    });

    throw apiError;
  }

  private getFullUrl(endpoint: string): string {
    return endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          code: 'TIMEOUT'
        };
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
    const url = new URL(this.getFullUrl(endpoint));
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await this.fetchWithTimeout(url.toString(), {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw {
          message: `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error, url.toString());
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(this.getFullUrl(endpoint), {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw {
          message: `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error, this.getFullUrl(endpoint));
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(this.getFullUrl(endpoint), {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw {
          message: `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error, this.getFullUrl(endpoint));
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(this.getFullUrl(endpoint), {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        throw {
          message: `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error, this.getFullUrl(endpoint));
    }
  }
}

// Create and export an instance with default config
export const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});
