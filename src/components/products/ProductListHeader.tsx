import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Grid, List as ListIcon, SlidersHorizontal, Search, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import PageHeader from '../ui/PageHeader';
import type { Store } from '../../types';

interface ProductListHeaderProps {
  stores: Store[];
  storeId?: string;
  viewMode: 'grid' | 'list';
  showFilters: boolean;
  hasActiveFilters: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onToggleFilters: () => void;
}

export function ProductListHeader({
  stores,
  storeId,
  viewMode,
  showFilters,
  hasActiveFilters,
  searchQuery,
  onSearchChange,
  onViewModeChange,
  onToggleFilters,
}: ProductListHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-2 sm:py-4 border-b border-gray-200">
          <PageHeader
            title="Products"
            subtitle="Manage and organize your store products"
            icon="package"
          />
        </div>

        {/* Store Selection & Actions - More compact on mobile */}
        <div className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-row items-center gap-2 sm:gap-4">
            {stores.length > 0 && (
              <Select
                value={storeId || ''}
                onValueChange={(value) => navigate(`/stores/${value}/products`)}
              >
                <SelectTrigger className="w-[180px] sm:w-[240px]">
                  <SelectValue>
                    {storeId ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm sm:text-base">
                          {stores.find(s => s.id === storeId)?.name}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 ml-2">
                          {` (${stores.find(s => s.id === storeId)?.products?.[0]?.count || 0})`}
                        </span>
                      </div>
                    ) : (
                      "Select a store"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm sm:text-base">{store.name}</span>
                        <span className="text-xs sm:text-sm text-gray-500 ml-2">
                          {` (${store.products?.[0]?.count || 0})`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {storeId && (
                <Button
                  onClick={() => navigate(`/stores/${storeId}/products/add`)}
                  className="gap-1 sm:gap-2 px-2 sm:px-3"
                  size="sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filters - More compact on mobile */}
        <div className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex flex-row items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              <div className="bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className={`px-2 ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                  className={`px-2 ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                  aria-label="List view"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleFilters}
                className={`gap-1 sm:gap-2 px-2 sm:px-3 ${showFilters ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : ''}`}
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                aria-expanded={showFilters}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                    •
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
