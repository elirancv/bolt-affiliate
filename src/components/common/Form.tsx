import React from 'react';
import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePerformance } from '../../hooks/usePerformance';
import { logger } from '../../services/logger';
import { analytics } from '../../services/analytics';

interface FormProps<T extends FieldValues> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  schema: z.ZodType<T>;
  onSubmit: (data: T) => Promise<void> | void;
  defaultValues?: UseFormProps<T>['defaultValues'];
  children: React.ReactNode;
}

export function Form<T extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  children,
  ...props
}: FormProps<T>) {
  const performance = usePerformance({
    name: 'form_submission',
    threshold: 1000,
    onThresholdExceeded: (duration) => {
      logger.warn('Form submission took longer than expected', { duration });
    }
  });

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  });

  const handleSubmit = async (data: T) => {
    try {
      await performance.measureOperation(
        async () => {
          await onSubmit(data);
        },
        'form_submit'
      );

      analytics.trackEvent('form_submit_success', {
        formId: props.id,
        fields: Object.keys(data)
      });
    } catch (error) {
      logger.error('Form submission failed', {
        error,
        formId: props.id,
        fields: Object.keys(data)
      });

      analytics.trackError(error as Error, {
        type: 'form_submit_error',
        formId: props.id
      });

      throw error;
    }
  };

  return (
    <form {...props} onSubmit={form.handleSubmit(handleSubmit)}>
      {typeof children === 'function' ? children(form) : children}
    </form>
  );
}

export function FormField({
  name,
  label,
  error,
  children,
  ...props
}: {
  name: string;
  label?: string;
  error?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormInput({
  type = 'text',
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
}) {
  return (
    <input
      type={type}
      className={`
        block w-full px-3 py-2 border rounded-md shadow-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${error ? 'border-red-300' : 'border-gray-300'}
        ${error ? 'focus:border-red-500' : 'focus:border-blue-500'}
      `}
      {...props}
    />
  );
}

export function FormButton({
  type = 'submit',
  variant = 'primary',
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
  };

  return (
    <button
      type={type}
      className={`
        px-4 py-2 rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          Loading...
        </div>
      ) : children}
    </button>
  );
}
