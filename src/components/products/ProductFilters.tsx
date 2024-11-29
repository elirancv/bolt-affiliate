import React from 'react';
import { X } from 'lucide-react';
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
  filters,
  onFiltersChange,
  onClose
}: ProductFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({
      status: [],
      category: [],
      minPrice: '',
      maxPrice: ''
    });
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value === 'all' ? [] : [value];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleCategoryChange = (value: string) => {
    const newCategory = value === 'all' ? [] : [value];
    onFiltersChange({ ...filters, category: newCategory });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
          >
            Clear All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Category
          </label>
          <Select
            value={filters.category[0] || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Status
          </label>
          <Select
            value={filters.status[0] || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Min Price
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.minPrice}
            onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
            placeholder="Min Price"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Max Price
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.maxPrice}
            onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
            placeholder="Max Price"
          />
        </div>
      </div>

      {/* Active Filters */}
      <div className="flex flex-wrap gap-2 pt-4">
        {filters.category.length > 0 && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
            Category: {categories.find(c => c.id === filters.category[0])?.name}
            <button
              onClick={() => onFiltersChange({ ...filters, category: [] })}
              className="ml-1 hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {filters.status.length > 0 && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
            Status: {filters.status[0]}
            <button
              onClick={() => onFiltersChange({ ...filters, status: [] })}
              className="ml-1 hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {filters.minPrice && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
            Min Price: ${filters.minPrice}
            <button
              onClick={() => onFiltersChange({ ...filters, minPrice: '' })}
              className="ml-1 hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {filters.maxPrice && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">
            Max Price: ${filters.maxPrice}
            <button
              onClick={() => onFiltersChange({ ...filters, maxPrice: '' })}
              className="ml-1 hover:text-blue-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
