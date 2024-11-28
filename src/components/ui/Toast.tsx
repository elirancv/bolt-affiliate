import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastProps extends Toast {
  onDismiss: (id: string) => void;
}

export function Toast({ id, title, description, variant = 'default', onDismiss }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 3000); // Auto dismiss after 3 seconds

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        variant === 'default' ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'
      )}
    >
      <div className="grid gap-1">
        <h3 className={cn(
          'font-medium leading-none tracking-tight',
          variant === 'default' ? 'text-gray-900' : 'text-red-600'
        )}>
          {title}
        </h3>
        {description && (
          <p className={cn(
            'text-sm opacity-90',
            variant === 'default' ? 'text-gray-500' : 'text-red-600'
          )}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className={cn(
          'absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2',
          variant === 'default'
            ? 'text-gray-500 hover:text-gray-900 focus:ring-gray-300'
            : 'text-red-500 hover:text-red-600 focus:ring-red-300'
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const { toasts, dismissToast } = useToasts();

  return (
    <div className="fixed top-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} onDismiss={dismissToast} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Context
const ToastContext = React.createContext<{
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}>({
  toasts: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addToast: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dismissToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (toast: Omit<Toast, 'id'>) => {
      setToasts((prev) => [...prev, { ...toast, id: Math.random().toString() }]);
    },
    []
  );

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  return context;
}
