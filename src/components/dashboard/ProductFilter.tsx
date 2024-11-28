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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <ChevronDown className="-ml-0.5 mr-2 h-4 w-4" /> 
        {currentFilterName}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1" role="menu" aria-orientation="vertical">
              {filters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => {
                      onFilterChange(filter.id);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2 text-sm flex items-center space-x-2
                      ${currentFilter === filter.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                      hover:bg-gray-50
                    `}
                    role="menuitem"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{filter.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
