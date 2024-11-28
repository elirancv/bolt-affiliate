import React, { useState } from 'react';
import { ChevronDown, SortAsc, SortDesc, TrendingUp, DollarSign } from 'lucide-react';

interface ProductFilterProps {
  onChange: (filter: string) => void;
  value: string;
}

export default function ProductFilter({ value, onChange }: ProductFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'clicks_desc', label: 'Most Clicks', icon: TrendingUp },
    { value: 'clicks_asc', label: 'Least Clicks', icon: TrendingUp },
    { value: 'price_desc', label: 'Highest Price', icon: DollarSign },
    { value: 'price_asc', label: 'Lowest Price', icon: DollarSign },
    { value: 'name_asc', label: 'Name A-Z', icon: SortAsc },
    { value: 'name_desc', label: 'Name Z-A', icon: SortDesc },
  ];

  const selectedOption = options.find(option => option.value === value);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full sm:w-48">
      <button
        type="button"
        className="w-full bg-white px-3 py-2 text-sm border rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="block truncate">
            {selectedOption?.label || 'Sort Products'}
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
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`
                  w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100
                  ${value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                `}
                onClick={() => handleOptionClick(option.value)}
              >
                <option.icon className="h-4 w-4 mr-2" />
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
