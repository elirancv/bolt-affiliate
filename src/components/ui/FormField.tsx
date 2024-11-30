import React from 'react';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, children, className }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-1", className)}>
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {children}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;