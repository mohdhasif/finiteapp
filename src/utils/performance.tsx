import React from 'react';
import { InteractionManager } from 'react-native';

// Performance monitoring utilities
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private timers: Map<string, number> = new Map();
  private memoryUsage: number[] = [];

  // Start timing an operation
  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  // End timing and record the duration
  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      // Remove console.warn for production - could log to analytics service instead
      return 0;
    }

    const duration = Date.now() - startTime;
    this.metrics.set(name, duration);
    this.timers.delete(name);

    // Log slow operations
    if (duration > 1000) {
      // Remove console.warn for production - could log to analytics service instead
    }

    return duration;
  }

  // Get timing for a specific operation
  getTimer(name: string): number {
    return this.metrics.get(name) || 0;
  }

  // Get all metrics
  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  // Track memory usage
  trackMemoryUsage(): void {
    if (__DEV__) {
      // In development, we can track some basic metrics
      const usage = Date.now();
      this.memoryUsage.push(usage);
      
      // Keep only last 100 entries
      if (this.memoryUsage.length > 100) {
        this.memoryUsage.shift();
      }
    }
  }

  // Get performance report
  getReport(): string {
    const metrics = this.getAllMetrics();
    const totalTime = Object.values(metrics).reduce((sum, time) => sum + time, 0);
    
    return `
Performance Report:
Total operations: ${Object.keys(metrics).length}
Total time: ${totalTime}ms
Average time: ${Object.keys(metrics).length > 0 ? totalTime / Object.keys(metrics).length : 0}ms

Slowest operations:
${Object.entries(metrics)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([name, time]) => `  ${name}: ${time}ms`)
  .join('\n')}
    `.trim();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Higher-order component for performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const startTime = React.useRef<number>(Date.now());

    React.useEffect(() => {
      const renderTime = Date.now() - startTime.current;
      performanceMonitor.startTimer(`${componentName}_render`);
      
      return () => {
        performanceMonitor.endTimer(`${componentName}_render`);
      };
    });

    return <WrappedComponent {...props} />;
  });
};

// Hook for measuring component render time
export const useRenderTime = (componentName: string) => {
  const startTime = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const renderTime = Date.now() - startTime.current;
    performanceMonitor.startTimer(`${componentName}_render`);
    
    return () => {
      performanceMonitor.endTimer(`${componentName}_render`);
    };
  });
};

// Hook for measuring async operations
export const useAsyncTimer = (operationName: string) => {
  const executeWithTimer = React.useCallback(
    <T,>(asyncFn: () => Promise<T>): Promise<T> => {
      performanceMonitor.startTimer(operationName);
      try {
        const result = asyncFn();
        return result;
      } finally {
        performanceMonitor.endTimer(operationName);
      }
    },
    [operationName]
  );

  return executeWithTimer;
};

// Utility for deferring non-critical operations
export const deferOperation = (operation: () => void, priority: 'low' | 'normal' = 'normal') => {
  if (priority === 'low') {
    // Use InteractionManager for low priority operations
    InteractionManager.runAfterInteractions(() => {
      operation();
    });
  } else {
    // Use requestAnimationFrame for normal priority
    requestAnimationFrame(() => {
      operation();
    });
  }
};

// Utility for throttling function calls
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return ((...args: any[]) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
};

// Utility for debouncing function calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  }) as T;
};

// Performance constants
export const PERFORMANCE_CONSTANTS = {
  SLOW_RENDER_THRESHOLD: 16, // 60fps = 16ms per frame
  SLOW_OPERATION_THRESHOLD: 1000, // 1 second
  MEMORY_WARNING_THRESHOLD: 50, // 50MB
  CACHE_SIZE_LIMIT: 100, // Maximum number of cached items
} as const;
