import { Alert } from 'react-native';

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
}

class GlobalErrorHandler {
  private isProduction = !__DEV__;
  private errorCount = 0;
  private maxErrors = 5;
  private errorWindow = 60000; // 1 minute
  private lastErrorTime = 0;

  constructor() {
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    if (global.ErrorUtils) {
      global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        this.handleError(error, { isFatal });
      });
    }

    // Handle unhandled promise rejections
    if (global.Promise) {
      const originalThen = global.Promise.prototype.then;
      global.Promise.prototype.then = function(onFulfilled, onRejected) {
        return originalThen.call(this, onFulfilled, (reason) => {
          if (onRejected) {
            return onRejected(reason);
          }
          // Log unhandled rejection
          console.error('Unhandled Promise Rejection:', reason);
          return Promise.reject(reason);
        });
      };
    }
  }

  private shouldShowError(): boolean {
    const now = Date.now();
    
    // Reset counter if enough time has passed
    if (now - this.lastErrorTime > this.errorWindow) {
      this.errorCount = 0;
    }
    
    this.lastErrorTime = now;
    this.errorCount++;
    
    // Don't show too many errors in a short time
    return this.errorCount <= this.maxErrors;
  }

  handleError(error: Error, context?: { isFatal?: boolean; componentStack?: string }) {
    const errorInfo: ErrorInfo = {
      message: error.message || 'Unknown error occurred',
      stack: error.stack,
      componentStack: context?.componentStack,
    };

    // Log error (in production, send to crash reporting service)
    if (this.isProduction) {
      // TODO: Send to crash reporting service (e.g., Crashlytics, Sentry)
      // crashlytics().recordError(error);
    } else {
      console.error('Global Error Handler:', errorInfo);
    }

    // Show user-friendly error message (but not too frequently)
    if (this.shouldShowError()) {
      this.showUserFriendlyError(errorInfo.message, context?.isFatal);
    }
  }

  private showUserFriendlyError(message: string, isFatal?: boolean) {
    const title = isFatal ? 'Critical Error' : 'Something went wrong';
    const alertMessage = isFatal 
      ? 'A critical error occurred. Please restart the app.'
      : message;

    Alert.alert(
      title,
      alertMessage,
      [
        {
          text: 'OK',
          onPress: () => {
            if (isFatal) {
              // Force app restart or navigate to safe screen
              // navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }
          },
        },
      ],
      { cancelable: false }
    );
  }

  // Method to manually report errors
  reportError(error: Error, context?: string) {
    this.handleError(error, { componentStack: context });
  }

  // Method to set production mode
  setProductionMode(isProduction: boolean) {
    this.isProduction = isProduction;
  }
}

// Export singleton instance
export const globalErrorHandler = new GlobalErrorHandler();

// Export class for custom instances
export default GlobalErrorHandler;

