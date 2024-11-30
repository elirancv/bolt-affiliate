import React from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import { logger } from '../../services/logger';

interface LoadingStateProps {
  message?: string;
  timeout?: number;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  timeout = 10000,
  fallback,
  children
}) => {
  const [showTimeout, setShowTimeout] = React.useState(false);

  const performance = usePerformance({
    name: 'loading_state',
    threshold: timeout,
    onThresholdExceeded: (duration) => {
      logger.warn('Loading state exceeded timeout', { duration, timeout });
      setShowTimeout(true);
    }
  });

  React.useEffect(() => {
    return () => {
      const duration = performance.getElapsedTime();
      if (duration > 1000) {
        logger.debug('Loading state duration', { duration });
      }
    };
  }, [performance]);

  if (showTimeout && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="mt-2 text-gray-600">{message}</p>
      {children}
    </div>
  );
};
