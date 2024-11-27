import React from 'react';
import FormField from '../../ui/FormField';

interface PriceInputProps {
  price: string;
  setPrice: (price: string) => void;
  error?: string;
}

export default function PriceInput({ price, setPrice, error }: PriceInputProps) {
  return (
    <FormField 
      label="Price"
      error={error}
    >
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          step="0.01"
          min="0"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-8 pr-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="0.00"
        />
      </div>
    </FormField>
  );
}