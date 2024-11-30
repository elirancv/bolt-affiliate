import { ANALYTICS_CONFIG } from '../constants/config';
import { apiClient } from '../api/clients/apiClient';

interface TrackEvent {
  event: string;
  properties: Record<string, any>;
  timestamp?: number;
}

interface PageView {
  path: string;
  title: string;
  referrer: string;
  timestamp?: number;
}

class AnalyticsService {
  private queue: Array<TrackEvent | PageView> = [];
  private isProcessing = false;
  private batchSize = 10;
  private batchTimeout = 1000; // 1 second

  constructor() {
    if (ANALYTICS_CONFIG.TRACKING_ENABLED) {
      this.startQueueProcessor();
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await apiClient.post('analytics', { events: batch });
    } catch (error) {
      console.error('Failed to process analytics batch:', error);
      // Put failed events back in the queue
      this.queue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  private startQueueProcessor() {
    setInterval(() => {
      this.processQueue();
    }, this.batchTimeout);
  }

  trackEvent(event: string, properties: Record<string, any> = {}) {
    if (!ANALYTICS_CONFIG.TRACKING_ENABLED) return;

    this.queue.push({
      event,
      properties,
      timestamp: Date.now()
    });

    if (import.meta.env.DEV) {
      console.log('Analytics Event:', { event, properties });
    }
  }

  trackPageView(path: string, title: string) {
    if (!ANALYTICS_CONFIG.TRACK_PAGE_VIEWS) return;

    this.queue.push({
      path,
      title,
      referrer: document.referrer,
      timestamp: Date.now()
    });

    if (import.meta.env.DEV) {
      console.log('Page View:', { path, title });
    }
  }

  trackProductClick(productId: string, storeId: string) {
    if (!ANALYTICS_CONFIG.TRACK_CLICKS) return;

    this.trackEvent('product_click', {
      product_id: productId,
      store_id: storeId
    });
  }

  trackStoreView(storeId: string) {
    this.trackEvent('store_view', {
      store_id: storeId
    });
  }

  trackError(error: Error, context: Record<string, any> = {}) {
    if (!ANALYTICS_CONFIG.TRACK_ERRORS) return;

    this.trackEvent('error', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });

    if (import.meta.env.DEV) {
      console.error('Error tracked:', error, context);
    }
  }

  trackSearch(query: string, results: number) {
    this.trackEvent('search', {
      query,
      results_count: results
    });
  }

  trackConversion(productId: string, storeId: string, value: number) {
    this.trackEvent('conversion', {
      product_id: productId,
      store_id: storeId,
      value
    });
  }

  // User engagement tracking
  trackEngagement(type: 'scroll' | 'time_on_page' | 'interaction', value: number) {
    this.trackEvent('engagement', {
      type,
      value
    });
  }
}

export const analytics = new AnalyticsService();
