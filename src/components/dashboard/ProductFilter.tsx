import React, { useState } from 'react';
import { ChevronDown, SortAsc, SortDesc, TrendingUp, DollarSign } from 'lucide-react';

interface ProductFilterProps {
  onFilterChange: (filter: string) => void;
  currentFilter: string;
}

export default function ProductFilter({ onFilterChange, currentFilter }: ProductFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const filters = [
    { id: 'clicks_desc', name: 'Most Clicks', icon: TrendingUp },
    { id: 'clicks_asc', name: 'Least Clicks', icon: TrendingUp },
    { id: 'price_desc', name: 'Highest Price', icon: DollarSign },
    { id: 'price_asc', name: 'Lowest Price', icon: DollarSign },
    { id: 'name_asc', name: 'Name A-Z', icon: SortAsc },
    { id: 'name_desc', name: 'Name Z-A', icon: SortDesc },
  ];

  const currentFilterName = filters.find(f => f.id === currentFilter)?.name || 'Most Clicks';

  return (
    <div className="relative w-full sm:w-48">
      <button
        type="button"
        className="w-full bg-white px-3 py-2 text-sm border rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="block truncate">
            {currentFilterName}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
            {filters.map((filter) => (
              <button
                key={filter.id}
                className={`
                  w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100
                  ${currentFilter === filter.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                `}
                onClick={() => {
                  onFilterChange(filter.id);
                  setIsOpen(false);
                }}
              >
                <filter.icon className="h-4 w-4 mr-2" />
                {filter.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
