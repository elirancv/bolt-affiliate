import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types';

interface SavedProductsState {
  savedProducts: Record<string, Product>;
  saveProduct: (product: Product) => void;
  unsaveProduct: (productId: string) => void;
  isProductSaved: (productId: string) => boolean;
}

export const useSavedProductsStore = create<SavedProductsState>()(
  persist(
    (set, get) => ({
      savedProducts: {},
      saveProduct: (product) =>
        set((state) => ({
          savedProducts: { ...state.savedProducts, [product.id]: product },
        })),
      unsaveProduct: (productId) =>
        set((state) => {
          const { [productId]: _, ...rest } = state.savedProducts;
          return { savedProducts: rest };
        }),
      isProductSaved: (productId) => !!get().savedProducts[productId],
    }),
    {
      name: 'saved-products',
    }
  )
);