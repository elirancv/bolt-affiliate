import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getStore, getProducts } from '../../lib/api';
import { useSavedProductsStore } from '../../store/savedProductsStore';
import type { Store, Product } from '../../types';
import { Store as StoreIcon } from 'lucide-react';
import SearchBar from '../../components/ui/SearchBar';
import ProductGrid from '../../components/products/ProductGrid';
import StoreFooter from '../../components/stores/StoreFooter';
import SocialLinks from '../../components/stores/SocialLinks';

export default function StoreView() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { storeId } = useParams();
  const { saveProduct, unsaveProduct, isProductSaved } = useSavedProductsStore();

  useEffect(() => {
    if (!storeId) return;

    const loadData = async () => {
      try {
        const [storeData, productsData] = await Promise.all([
          getStore(storeId),
          getProducts(storeId)
        ]);
        setStore(storeData);
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Error loading store:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeId]);

  useEffect(() => {
    const filtered = products.filter(product => {
      const matchesSearch = !searchQuery || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const categories = [...new Set(products.map(product => product.category))].filter(Boolean);
  const searchSuggestions = products.map(product => product.title);

  const handleSaveProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (isProductSaved(productId)) {
      unsaveProduct(productId);
    } else {
      saveProduct(product);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <StoreIcon className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Store not found</h2>
        <p className="text-gray-600 text-center">The store you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const showSocialLinksInHeader = store.social_links_position === 'header' || store.social_links_position === 'both';
  const showSocialLinksInFooter = store.social_links_position === 'footer' || store.social_links_position === 'both';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Rest of the component remains the same */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-center space-x-4">
                {store.logo_url ? (
                  <img 
                    src={store.logo_url} 
                    alt={store.name} 
                    className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <StoreIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">{store.name}</h1>
                  {store.description && (
                    <p className="mt-1 text-sm sm:text-base text-gray-600 max-w-2xl">{store.description}</p>
                  )}
                </div>
              </div>
              {showSocialLinksInHeader && (
                <div className="flex justify-center sm:justify-end">
                  <SocialLinks links={store.social_links} />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <SearchBar
                onSearch={setSearchQuery}
                suggestions={searchSuggestions}
                className="w-full sm:max-w-lg"
                storeId={storeId}
              />

              {categories.length > 0 && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                      !selectedCategory
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
        <ProductGrid
          products={filteredProducts}
          storeId={storeId!}
          onSave={handleSaveProduct}
          savedProductIds={new Set(Object.keys(useSavedProductsStore.getState().savedProducts))}
        />
      </main>

      {/* Footer */}
      <StoreFooter 
        storeName={store.name} 
        socialLinks={store.social_links}
        showSocialLinks={showSocialLinksInFooter}
      />
    </div>
  );
}