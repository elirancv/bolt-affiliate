import React from 'react';
import { X } from 'lucide-react';

interface BadgeProps {
  label: string;
  onRemove?: () => void;
  variant?: 'default' | 'blue' | 'gray';
}

export function Badge({ label, onRemove, variant = 'blue' }: BadgeProps) {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {label}
      {onRemove && (
        <button
          type="button"
          className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-gray-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
          onClick={onRemove}
        >
          <span className="sr-only">Remove filter</span>
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
