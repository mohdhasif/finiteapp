// Environment configuration utility
export const isProduction = !__DEV__;
export const isDevelopment = __DEV__;

// Safe logging utility - only logs in development
export const safeLog = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // In production, could send to crash reporting service
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

// Performance monitoring utility
export const performanceMonitor = {
  startTimer: (name: string) => {
    if (isDevelopment) {
      console.time(name);
    }
  },
  endTimer: (name: string) => {
    if (isDevelopment) {
      console.timeEnd(name);
    }
  },
  mark: (name: string) => {
    if (isDevelopment) {
      console.log(`[PERF] ${name}`);
    }
  },
};

// Error reporting utility
export const errorReporter = {
  report: (error: Error, context?: string) => {
    if (isProduction) {
      // TODO: Send to crash reporting service
      // crashlytics().recordError(error);
    } else {
      console.error(`[ERROR] ${context || 'Unknown context'}:`, error);
    }
  },
  warn: (message: string, context?: string) => {
    if (isProduction) {
      // TODO: Send to analytics service
    } else {
      console.warn(`[WARN] ${context || 'Unknown context'}:`, message);
    }
  },
};

