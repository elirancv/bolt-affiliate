import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

export const subscriptionFeatures = {
  free: {
    products: 10,
    customDomain: false,
    analytics: false,
    aiFeatures: false,
    support: 'email',
  },
  starter: {
    products: 50,
    customDomain: true,
    analytics: false,
    aiFeatures: false,
    support: 'email',
  },
  professional: {
    products: 200,
    customDomain: true,
    analytics: true,
    aiFeatures: true,
    support: 'priority',
  },
  business: {
    products: 1000,
    customDomain: true,
    analytics: true,
    aiFeatures: true,
    support: '24/7',
  },
  unlimited: {
    products: Infinity,
    customDomain: true,
    analytics: true,
    aiFeatures: true,
    support: 'dedicated',
  },
};