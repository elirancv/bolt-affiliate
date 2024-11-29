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

  const onToggleProductMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-full sm:w-48">
      <button
        type="button"
        className="w-full bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-200"
        onClick={onToggleProductMenu}
      >
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center space-x-2 min-w-0">
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
            )}
            <span className="block truncate text-gray-700 text-sm">
              {selectedOption?.label || 'Sort Products'}
            </span>
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10 bg-black bg-opacity-5"
            onClick={() => onToggleProductMenu()}
          />
          <div className="absolute right-0 z-20 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-100">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`
                  w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm flex items-center space-x-2
                  ${value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}
                  transition-colors duration-150
                `}
              >
                <option.icon className={`h-4 w-4 flex-shrink-0 ${value === option.value ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
