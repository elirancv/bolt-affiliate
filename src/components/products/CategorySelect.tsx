import React, { useEffect, useState } from 'react';
import { getCategories } from '../../lib/api';
import FormField from '../common/FormField';

interface Category {
  id: string;
  name: string;
}

interface CategorySelectProps {
  storeId: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function CategorySelect({ storeId, value, onChange, error }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories(storeId);
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [storeId]);

  return (
    <FormField
      label="Category"
      error={error}
      description="Select a category for your product"
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          loading ? 'bg-gray-50' : ''
        }`}
        disabled={loading}
      >
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </FormField>
  );
}
