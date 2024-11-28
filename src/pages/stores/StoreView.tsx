import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicStore, getPublicProducts, getCategories } from '../../lib/api';
import { useSavedProductsStore } from '../../store/savedProductsStore';
import type { Store, Product, Category } from '../../types';
import { Store as StoreIcon } from 'lucide-react';
import SearchBar from '../../components/ui/SearchBar';
import { ProductCard } from '../../components/products/ProductGrid';
import StoreFooter from '../../components/stores/StoreFooter';
import SocialLinks from '../../components/stores/SocialLinks';

export default function StoreView() {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { storeId } = useParams();
  const { saveProduct, unsaveProduct, isProductSaved } = useSavedProductsStore();

  useEffect(() => {
    if (!storeId) return;

    const loadData = async () => {
      try {
        const [storeData, productsData, categoriesData] = await Promise.all([
          getPublicStore(storeId),
          getPublicProducts(storeId),
          getCategories(storeId)
        ]);
        setStore(storeData);
        setProducts(productsData || []);
        setCategories(categoriesData || []);
        setFilteredProducts(productsData || []);
      } catch (error) {
        console.error('Error loading store:', error);
        setStore(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeId]);

  useEffect(() => {
    const filtered = products.filter(product => {
      const productCategory = categories.find(c => c.id === product.category_id);
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        productCategory?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || productCategory?.id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products, categories]);

  const uniqueCategories = categories.filter(category => 
    products.some(product => product.category_id === category.id)
  );
  const searchSuggestions = products.map(product => product.name);

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
      {/* Promotion Banner */}
      {store?.promotion_settings?.banner_enabled && (
        <div className="bg-blue-600 text-white text-center py-2 px-4">
          {store.promotion_settings.banner_text}
        </div>
      )}

      {/* Store Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        {/* Main header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {store.logo_url ? (
                  <img 
                    src={store.logo_url} 
                    alt={store.name} 
                    className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover shadow-sm"
                  />
                ) : (
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <StoreIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{store.name}</h1>
                  {store.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store.description}</p>
                  )}
                </div>
              </div>
              
              {/* Social Links in Header */}
              {showSocialLinksInHeader && (
                <div className="flex items-center">
                  <div className="h-8 w-px bg-gray-200 mx-4"></div>
                  <SocialLinks 
                    links={store.social_links} 
                    className="flex items-center gap-4"
                    variant="dark" 
                  />
                </div>
              )}
            </div>
            
            {/* Search and Categories */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 max-w-xl">
                <SearchBar
                  onSearch={setSearchQuery}
                  suggestions={searchSuggestions}
                  className="w-full"
                  storeId={storeId}
                />
              </div>

              {uniqueCategories.length > 0 && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                      !selectedCategory
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Products
                  </button>
                  {uniqueCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              storeId={storeId!}
              onSave={handleSaveProduct}
              isSaved={isProductSaved(product.id)}
              categoryName={categories.find(c => c.id === product.category_id)?.name}
            />
          ))}
        </div>
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