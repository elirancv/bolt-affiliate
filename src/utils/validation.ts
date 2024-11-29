import { PRODUCT_CONFIG, STORE_CONFIG } from '../constants/config';

export const validation = {
  isValidImage: (file: File): boolean => {
    if (!file) return false;
    
    const isValidType = PRODUCT_CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.type);
    const isValidSize = file.size <= PRODUCT_CONFIG.MAX_IMAGE_SIZE;
    
    return isValidType && isValidSize;
  },

  isValidProductTitle: (title: string): boolean => {
    return title.length > 0 && title.length <= PRODUCT_CONFIG.MAX_TITLE_LENGTH;
  },

  isValidProductDescription: (description: string): boolean => {
    return description.length <= PRODUCT_CONFIG.MAX_DESCRIPTION_LENGTH;
  },

  isValidStoreName: (name: string): boolean => {
    return name.length > 0 && name.length <= STORE_CONFIG.MAX_STORE_NAME_LENGTH;
  },

  isValidStoreDescription: (description: string): boolean => {
    return description.length <= STORE_CONFIG.MAX_STORE_DESCRIPTION_LENGTH;
  },

  isValidSocialPlatform: (platform: string): boolean => {
    return STORE_CONFIG.SUPPORTED_SOCIAL_PLATFORMS.includes(platform.toLowerCase());
  },

  isValidSocialLink: (platform: string, url: string): boolean => {
    if (!url) return true; // Empty links are valid
    if (!this.isValidSocialPlatform(platform)) return false;

    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },

  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPassword: (password: string): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  sanitizeInput: (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, 1000); // Reasonable maximum length
  }
};
