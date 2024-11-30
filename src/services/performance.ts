import { logger } from './logger';
import { analytics } from './analytics';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private readonly METRICS_THRESHOLD = 1000;

  constructor() {
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Observe paint timing
    const paintObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.recordMetric(entry.name, entry.startTime);
      });
    });

    // Observe layout shifts
    const layoutShiftObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        this.recordMetric('cumulative-layout-shift', entry.value);
      });
    });

    // Observe long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) { // Tasks longer than 50ms
          this.recordMetric('long-task', entry.duration);
          logger.warn('Long task detected', {
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });
    });

    try {
      paintObserver.observe({ entryTypes: ['paint'] });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      logger.error('Failed to setup performance observer', error as Error);
    }
  }

  private recordMetric(name: string, value: number) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now()
    });

    // Prevent metrics array from growing too large
    if (this.metrics.length > this.METRICS_THRESHOLD) {
      this.metrics = this.metrics.slice(-this.METRICS_THRESHOLD);
    }

    // Track significant performance issues
    if (this.isSignificantIssue(name, value)) {
      analytics.trackEvent('performance_issue', {
        metric: name,
        value
      });
    }
  }

  private isSignificantIssue(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'first-contentful-paint': 2000, // 2 seconds
      'long-task': 100, // 100ms
      'cumulative-layout-shift': 0.1 // 0.1 CLS
    };

    return value > (thresholds[name] || 0);
  }

  // Start timing an operation
  startMark(name: string) {
    this.marks.set(name, performance.now());
  }

  // End timing an operation and record the duration
  endMark(name: string) {
    const startTime = this.marks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
      this.marks.delete(name);
      return duration;
    }
    return 0;
  }

  // Get metrics for analysis
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return this.metrics;
  }

  // Get average value for a metric
  getAverageMetric(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics = [];
    this.marks.clear();
  }

  // Get performance summary
  getSummary() {
    const uniqueMetrics = [...new Set(this.metrics.map(m => m.name))];
    return uniqueMetrics.reduce((acc, name) => ({
      ...acc,
      [name]: this.getAverageMetric(name)
    }), {});
  }
}

export const performance = new PerformanceMonitor();
