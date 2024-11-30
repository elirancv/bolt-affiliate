import { useEffect, useCallback, useRef } from 'react';
import { performance } from '../services/performance';
import { logger } from '../services/logger';

interface PerformanceOptions {
  name: string;
  threshold?: number;
  onThresholdExceeded?: (duration: number) => void;
}

export function usePerformance(options: PerformanceOptions) {
  const { name, threshold = 1000, onThresholdExceeded } = options;
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
    performance.startMark(name);

    return () => {
      const duration = performance.endMark(name);
      if (duration > threshold) {
        logger.warn(`Performance threshold exceeded for ${name}`, {
          duration,
          threshold
        });
        onThresholdExceeded?.(duration);
      }
    };
  }, [name, threshold, onThresholdExceeded]);

  const measureOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      return await operation();
    } finally {
      const duration = performance.now() - startTime;
      logger.debug(`Operation ${operationName} completed`, { duration });
      if (duration > threshold) {
        logger.warn(`Operation ${operationName} exceeded threshold`, {
          duration,
          threshold
        });
        onThresholdExceeded?.(duration);
      }
    }
  }, [threshold, onThresholdExceeded]);

  const measureSync = useCallback(<T>(
    operation: () => T,
    operationName: string
  ): T => {
    const startTime = performance.now();
    try {
      return operation();
    } finally {
      const duration = performance.now() - startTime;
      logger.debug(`Operation ${operationName} completed`, { duration });
      if (duration > threshold) {
        logger.warn(`Operation ${operationName} exceeded threshold`, {
          duration,
          threshold
        });
        onThresholdExceeded?.(duration);
      }
    }
  }, [threshold, onThresholdExceeded]);

  const getElapsedTime = useCallback((): number => {
    return performance.now() - startTimeRef.current;
  }, []);

  return {
    measureOperation,
    measureSync,
    getElapsedTime
  };
}
