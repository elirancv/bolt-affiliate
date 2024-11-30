import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

interface ProductFiltersProps {
  categories: { id: string; name: string }[];
  filters: {
    status: string[];
    category: string[];
    minPrice: string;
    maxPrice: string;
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export function ProductFilters({
  categories,
  filters: initialFilters,
  onFiltersChange,
  onClose
}: ProductFiltersProps) {
  const [filters, setFilters] = useState(initialFilters);

  const handleClearFilters = () => {
    setFilters({
      status: [],
      category: [],
      minPrice: '',
      maxPrice: ''
    });
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value === 'all' ? [] : [value];
    setFilters({ ...filters, status: newStatus });
  };

  const handleCategoryChange = (value: string) => {
    const newCategory = value === 'all' ? [] : [value];
    setFilters({ ...filters, category: newCategory });
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    setFilters({
      ...filters,
      [type === 'min' ? 'minPrice' : 'maxPrice']: value,
    });
  };

  const hasActiveFilters = filters.category.length > 0 || filters.status.length > 0 || filters.minPrice || filters.maxPrice;

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 h-auto"
            >
              Clear all
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1 h-auto"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Filter Groups */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Category Filter */}
        <div>
          <Select
            value={filters.category[0] || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <Select
            value={filters.status[0] || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <span className="text-gray-500 text-xs">$</span>
            </div>
            <input
              type="number"
              className="w-full pl-5 pr-2 h-8 text-xs border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.minPrice}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              placeholder="Min"
            />
          </div>
          <span className="text-gray-400 text-xs">to</span>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <span className="text-gray-500 text-xs">$</span>
            </div>
            <input
              type="number"
              className="w-full pl-5 pr-2 h-8 text-xs border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.maxPrice}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {filters.category.length > 0 && (
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100">
              <span className="text-xs text-blue-700">
                {categories.find(c => c.id === filters.category[0])?.name}
              </span>
              <button
                onClick={() => setFilters({ ...filters, category: [] })}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.status.length > 0 && (
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100">
              <span className="text-xs text-blue-700">
                {filters.status[0].charAt(0).toUpperCase() + filters.status[0].slice(1)}
              </span>
              <button
                onClick={() => setFilters({ ...filters, status: [] })}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100">
              <span className="text-xs text-blue-700">
                {filters.minPrice && filters.maxPrice
                  ? `$${filters.minPrice} - $${filters.maxPrice}`
                  : filters.minPrice
                  ? `Min $${filters.minPrice}`
                  : `Max $${filters.maxPrice}`}
              </span>
              <button
                onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
