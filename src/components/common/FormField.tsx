import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  description?: string;
  children: React.ReactNode;
}

export default function FormField({ label, error, description, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {description && (
        <p className="text-sm text-gray-500 mb-2">{description}</p>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
