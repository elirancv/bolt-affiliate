import { CACHE_CONFIG } from '../constants/config';

interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache: Map<string, CacheItem<any>>;

  constructor() {
    this.cache = new Map();
  }

  set<T>(key: string, value: T, ttl: number = CACHE_CONFIG.STORE_TTL): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Helper methods for specific entity types
  setStore(storeId: string, data: any): void {
    this.set(`store:${storeId}`, data, CACHE_CONFIG.STORE_TTL);
  }

  getStore(storeId: string): any {
    return this.get(`store:${storeId}`);
  }

  setProduct(productId: string, data: any): void {
    this.set(`product:${productId}`, data, CACHE_CONFIG.PRODUCT_TTL);
  }

  getProduct(productId: string): any {
    return this.get(`product:${productId}`);
  }

  setUser(userId: string, data: any): void {
    this.set(`user:${userId}`, data, CACHE_CONFIG.USER_TTL);
  }

  getUser(userId: string): any {
    return this.get(`user:${userId}`);
  }

  // Clear specific entity caches
  clearStoreCache(): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith('store:')) {
        this.cache.delete(key);
      }
    }
  }

  clearProductCache(): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith('product:')) {
        this.cache.delete(key);
      }
    }
  }

  clearUserCache(): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith('user:')) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new Cache();
