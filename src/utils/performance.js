// Performance monitoring utilities for production

class PerformanceMonitor {
  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.metrics = new Map();
    this.observers = new Map();
  }

  // Start timing a performance metric
  startTiming(name) {
    if (!this.isProduction) return;
    
    this.metrics.set(name, {
      startTime: performance.now(),
      startTimestamp: Date.now()
    });
  }

  // End timing and record the metric
  endTiming(name, additionalData = {}) {
    if (!this.isProduction) return;
    
    const metric = this.metrics.get(name);
    if (!metric) return;

    const duration = performance.now() - metric.startTime;
    const endTimestamp = Date.now();

    const performanceData = {
      name,
      duration,
      startTimestamp: metric.startTimestamp,
      endTimestamp,
      ...additionalData
    };

    // Log performance metric
    this.logMetric(performanceData);
    
    // Clean up
    this.metrics.delete(name);
    
    return performanceData;
  }

  // Log a performance metric
  logMetric(data) {
    if (!this.isProduction) return;
    
    // In a real production app, you would send this to a monitoring service
    console.log('[Performance]', data);
    
    // Example: Send to monitoring service
    // this.sendToMonitoringService('performance', data);
  }

  // Monitor Core Web Vitals
  observeWebVitals() {
    if (!this.isProduction) return;

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.logMetric({
            name: 'LCP',
            value: lastEntry.startTime,
            url: window.location.href
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.logMetric({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              url: window.location.href
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.logMetric({
            name: 'CLS',
            value: clsValue,
            url: window.location.href
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  }

  // Monitor API response times
  monitorApiCall(apiName, startTime, endTime, success = true, error = null) {
    if (!this.isProduction) return;

    const duration = endTime - startTime;
    this.logMetric({
      name: 'API_CALL',
      apiName,
      duration,
      success,
      error: error ? error.message : null,
      url: window.location.href
    });
  }

  // Monitor page load performance
  monitorPageLoad() {
    if (!this.isProduction) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          this.logMetric({
            name: 'PAGE_LOAD',
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            totalTime: navigation.loadEventEnd - navigation.fetchStart,
            url: window.location.href
          });
        }
      }, 0);
    });
  }

  // Monitor memory usage (if available)
  monitorMemory() {
    if (!this.isProduction || !performance.memory) return;

    setInterval(() => {
      const memory = performance.memory;
      this.logMetric({
        name: 'MEMORY_USAGE',
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        url: window.location.href
      });
    }, 30000); // Every 30 seconds
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
    this.metrics.clear();
  }

  // Send data to monitoring service (placeholder)
  sendToMonitoringService(type, data) {
    // In a real production app, you would implement this
    // Example: Send to your analytics/monitoring service
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, timestamp: Date.now() })
    }).catch(console.error);
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in production
if (import.meta.env.PROD) {
  performanceMonitor.observeWebVitals();
  performanceMonitor.monitorPageLoad();
  performanceMonitor.monitorMemory();
}

export default performanceMonitor;

// Convenience functions
export const startTiming = (name) => performanceMonitor.startTiming(name);
export const endTiming = (name, additionalData) => performanceMonitor.endTiming(name, additionalData);
export const monitorApiCall = (apiName, startTime, endTime, success, error) => 
  performanceMonitor.monitorApiCall(apiName, startTime, endTime, success, error);
