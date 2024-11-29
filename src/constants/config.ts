// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  API: 'yyyy-MM-dd',
  TIME: 'HH:mm:ss',
} as const;

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  TRACKING_ENABLED: true,
  TRACK_PAGE_VIEWS: true,
  TRACK_CLICKS: true,
  TRACK_ERRORS: true,
} as const;

// Product Configuration
export const PRODUCT_CONFIG = {
  MAX_IMAGES: 5,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Store Configuration
export const STORE_CONFIG = {
  MAX_PRODUCTS: 1000,
  MAX_CATEGORIES: 50,
  MAX_STORE_NAME_LENGTH: 50,
  MAX_STORE_DESCRIPTION_LENGTH: 200,
  SUPPORTED_SOCIAL_PLATFORMS: ['facebook', 'twitter', 'instagram', 'pinterest'],
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  STORE_TTL: 5 * 60 * 1000, // 5 minutes
  PRODUCT_TTL: 5 * 60 * 1000, // 5 minutes
  USER_TTL: 30 * 60 * 1000, // 30 minutes
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// Route Configuration
export const ROUTE_CONFIG = {
  PUBLIC_ROUTES: ['/login', '/register', '/forgot-password', '/reset-password'],
  DEFAULT_AUTHENTICATED_ROUTE: '/dashboard',
  DEFAULT_UNAUTHENTICATED_ROUTE: '/login',
} as const;
