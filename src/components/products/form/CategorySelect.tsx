import React from 'react';
import { ChevronDown } from 'lucide-react';
import FormField from '../../ui/FormField';
import { PRODUCT_CATEGORIES } from '../../../lib/constants';

interface CategorySelectProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  customCategory: string;
  setCustomCategory: (category: string) => void;
  error?: string;
}

export default function CategorySelect({
  selectedCategory,
  setSelectedCategory,
  customCategory,
  setCustomCategory,
  error
}: CategorySelectProps) {
  return (
    <FormField 
      label="Category" 
      error={error}
    >
      <div className="space-y-2">
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {selectedCategory === 'Custom' && (
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter custom category"
          />
        )}
      </div>
    </FormField>
  );
}