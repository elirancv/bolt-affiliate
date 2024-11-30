import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  className = '', 
  error, 
  leftIcon,
  rightIcon,
  containerClassName = '',
  ...props 
}, ref) => {
  return (
    <div className={containerClassName}>
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${leftIcon ? 'pl-10' : 'px-4'} ${rightIcon ? 'pr-10' : 'pr-4'} py-2 ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
