import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  InteractionManager,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useMemoryOptimization } from '../utils/memoryOptimization';
import { performanceMonitor } from '../utils/performance';

interface PerformanceOptimizedScreenProps {
  children: React.ReactNode;
  screenName: string;
  enableMemoryOptimization?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableLazyLoading?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onBackground?: () => void;
  onForeground?: () => void;
}

const PerformanceOptimizedScreen: React.FC<PerformanceOptimizedScreenProps> = ({
  children,
  screenName,
  enableMemoryOptimization = true,
  enablePerformanceMonitoring = true,
  enableLazyLoading = true,
  onFocus,
  onBlur,
  onBackground,
  onForeground,
}) => {
  const renderStartTime = useRef<number>(Date.now());
  const isFocused = useRef<boolean>(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Memory optimization
  const { cleanup, getMemoryStats } = useMemoryOptimization({
    cleanupOnUnmount: true,
    cleanupOnBackground: true,
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  });

  // Performance monitoring
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      performanceMonitor.startTimer(`${screenName}_render`);
    }

    return () => {
      if (enablePerformanceMonitoring) {
        performanceMonitor.endTimer(`${screenName}_render`);
      }
    };
  }, [screenName, enablePerformanceMonitoring]);

  // Screen focus handling
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      renderStartTime.current = Date.now();

      if (enablePerformanceMonitoring) {
        performanceMonitor.startTimer(`${screenName}_focus`);
      }

      // Defer non-critical operations
      InteractionManager.runAfterInteractions(() => {
        onFocus?.();
      });

      return () => {
        isFocused.current = false;
        
        if (enablePerformanceMonitoring) {
          performanceMonitor.endTimer(`${screenName}_focus`);
        }

        onBlur?.();
      };
    }, [screenName, onFocus, onBlur, enablePerformanceMonitoring])
  );

  // App state handling
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        if (isFocused.current) {
          InteractionManager.runAfterInteractions(() => {
            onForeground?.();
          });
        }
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background
        if (isFocused.current) {
          InteractionManager.runAfterInteractions(() => {
            onBackground?.();
            if (enableMemoryOptimization) {
              cleanup();
            }
          });
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, [onBackground, onForeground, enableMemoryOptimization, cleanup]);

  // Lazy loading optimization
  useEffect(() => {
    if (enableLazyLoading && isFocused.current) {
      // Defer heavy operations until interactions are complete
      const interactionPromise = InteractionManager.runAfterInteractions(() => {
        // Perform lazy loading operations here
        if (enablePerformanceMonitoring) {
          performanceMonitor.startTimer(`${screenName}_lazy_load`);
        }
      });

      return () => {
        interactionPromise.cancel();
        if (enablePerformanceMonitoring) {
          performanceMonitor.endTimer(`${screenName}_lazy_load`);
        }
      };
    }
  }, [screenName, enableLazyLoading, enablePerformanceMonitoring]);

  // Memory monitoring
  useEffect(() => {
    if (enableMemoryOptimization) {
      const interval = setInterval(() => {
        const stats = getMemoryStats();
        
        if (stats.utilization > 80) {
          console.warn(`High memory usage detected on ${screenName}: ${stats.utilization.toFixed(1)}%`);
          cleanup();
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [screenName, enableMemoryOptimization, getMemoryStats, cleanup]);

  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default React.memo(PerformanceOptimizedScreen);

// Higher-order component for easy screen optimization
export const withPerformanceOptimization = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Partial<Omit<PerformanceOptimizedScreenProps, 'children'>> = {}
) => {
  return React.memo((props: P) => (
    <PerformanceOptimizedScreen
      screenName={options.screenName || WrappedComponent.name || 'UnknownScreen'}
      enableMemoryOptimization={options.enableMemoryOptimization}
      enablePerformanceMonitoring={options.enablePerformanceMonitoring}
      enableLazyLoading={options.enableLazyLoading}
      onFocus={options.onFocus}
      onBlur={options.onBlur}
      onBackground={options.onBackground}
      onForeground={options.onForeground}
    >
      <WrappedComponent {...props} />
    </PerformanceOptimizedScreen>
  ));
};
