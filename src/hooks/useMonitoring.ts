import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../services/analytics';
import { logger } from '../services/logger';
import { performance } from '../services/performance';
import { cache } from '../utils/cache';

export function useMonitoring() {
  const location = useLocation();

  // Track page views
  useEffect(() => {
    performance.startMark('page-render');
    analytics.trackPageView(location.pathname, document.title);

    return () => {
      const renderTime = performance.endMark('page-render');
      logger.debug('Page render complete', {
        path: location.pathname,
        renderTime
      });
    };
  }, [location]);

  // Monitor scroll depth
  useEffect(() => {
    let maxScroll = 0;
    let lastScrollTime = Date.now();

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        analytics.trackEngagement('scroll', maxScroll);
      }

      // Track time between scrolls
      const now = Date.now();
      if (now - lastScrollTime > 5000) { // 5 seconds between tracking
        analytics.trackEngagement('time_on_page', (now - lastScrollTime) / 1000);
        lastScrollTime = now;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Error boundary handler
  const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('React error boundary caught error', error, errorInfo);
    analytics.trackError(error, errorInfo);
  }, []);

  // Cache cleanup on page leave
  useEffect(() => {
    return () => {
      cache.clearStoreCache();
      cache.clearProductCache();
    };
  }, [location]);

  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackError: handleError,
    logger,
    performance
  };
}
