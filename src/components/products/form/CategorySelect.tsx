import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Category } from '../../../types';
import { getCategories } from '../../../lib/api';
import FormField from '../../ui/FormField';

interface CategorySelectProps {
  storeId: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function CategorySelect({ storeId, value, onChange, error }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('Loading categories for store:', storeId);
        setLoading(true);
        setLoadError(undefined);
        const data = await getCategories(storeId);
        console.log('Loaded categories:', data);
        setCategories(data || []);
      } catch (err) {
        console.error('Error loading categories:', err);
        setLoadError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [storeId]);

  return (
    <FormField
      label="Category"
      error={error || loadError}
    >
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`block w-full border rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${loading ? 'bg-gray-100' : ''}`}
          disabled={loading}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </FormField>
  );
}