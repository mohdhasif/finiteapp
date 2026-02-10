import React, { useEffect, useRef, useCallback, useState } from 'react';
import { InteractionManager, AppState, AppStateStatus } from 'react-native';

// Memory management utilities
class MemoryManager {
  private static instance: MemoryManager;
  private cache = new Map<string, { data: any; timestamp: number; size: number }>();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private maxCacheAge = 10 * 60 * 1000; // 10 minutes
  private listeners: Set<() => void> = new Set();

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // Add item to cache with size estimation
  set(key: string, data: any, size?: number): void {
    const estimatedSize = size || this.estimateSize(data);
    const timestamp = Date.now();

    this.cache.set(key, { data, timestamp, size: estimatedSize });
    this.cleanup();
    this.notifyListeners();
  }

  // Get item from cache
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item is still valid
    if (Date.now() - item.timestamp > this.maxCacheAge) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // Remove item from cache
  delete(key: string): void {
    this.cache.delete(key);
    this.notifyListeners();
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.notifyListeners();
  }

  // Get cache statistics
  getStats() {
    const totalSize = Array.from(this.cache.values()).reduce((sum, item) => sum + item.size, 0);
    const totalItems = this.cache.size;
    const oldestItem = Math.min(...Array.from(this.cache.values()).map(item => item.timestamp));

    return {
      totalSize,
      totalItems,
      maxSize: this.maxCacheSize,
      oldestItem: oldestItem === Infinity ? 0 : oldestItem,
      utilization: (totalSize / this.maxCacheSize) * 100,
    };
  }

  // Get all cached items (for cleanup purposes)
  getAllItems() {
    return Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      ...item,
    }));
  }

  // Cleanup old and large items
  private cleanup(): void {
    const now = Date.now();
    const items = Array.from(this.cache.entries());
    
    // Remove expired items
    items.forEach(([key, item]) => {
      if (now - item.timestamp > this.maxCacheAge) {
        this.cache.delete(key);
      }
    });

    // If still over limit, remove oldest items
    const stats = this.getStats();
    if (stats.totalSize > this.maxCacheSize) {
      const sortedItems = items
        .filter(([, item]) => now - item.timestamp <= this.maxCacheAge)
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      let currentSize = stats.totalSize;
      for (const [key, item] of sortedItems) {
        if (currentSize <= this.maxCacheSize) break;
        this.cache.delete(key);
        currentSize -= item.size;
      }
    }
  }

  // Estimate size of data in bytes
  private estimateSize(data: any): number {
    try {
      const jsonString = JSON.stringify(data);
      // Use Buffer or string length as fallback for React Native
      return jsonString.length * 2; // Approximate 2 bytes per character
    } catch {
      // Fallback estimation
      return 1024; // 1KB default
    }
  }

  // Subscribe to cache changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Global memory manager instance
export const memoryManager = MemoryManager.getInstance();

// Hook for memory-aware component lifecycle
export const useMemoryOptimization = (options: {
  cleanupOnUnmount?: boolean;
  cleanupOnBackground?: boolean;
  maxMemoryUsage?: number;
} = {}) => {
  const {
    cleanupOnUnmount = true,
    cleanupOnBackground = true,
    maxMemoryUsage = 50 * 1024 * 1024, // 50MB
  } = options;

  const cleanupRef = useRef<(() => void) | null>(null);

  // Memory cleanup function
  const cleanup = useCallback(() => {
    const stats = memoryManager.getStats();
    
    if (stats.utilization > 80) {
      // Force cleanup if usage is high
      memoryManager.clear();
    } else if (stats.utilization > 60) {
      // Remove oldest items - use the public API
      const items = memoryManager.getAllItems();
      const sortedItems = items.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove 20% of oldest items
      const itemsToRemove = Math.ceil(sortedItems.length * 0.2);
      sortedItems.slice(0, itemsToRemove).forEach((item) => {
        memoryManager.delete(item.key);
      });
    }
  }, []);

  // App state change handler
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && cleanupOnBackground) {
      // Defer cleanup to avoid blocking UI
      InteractionManager.runAfterInteractions(() => {
        cleanup();
      });
    }
  }, [cleanup, cleanupOnBackground]);

  useEffect(() => {
    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up periodic cleanup
    const interval = setInterval(() => {
      const stats = memoryManager.getStats();
      if (stats.utilization > 70) {
        cleanup();
      }
    }, 30000); // Check every 30 seconds

    // Cleanup on unmount
    if (cleanupOnUnmount) {
      cleanupRef.current = cleanup;
    }

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
      clearInterval(interval);
      
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [cleanup, cleanupOnUnmount, handleAppStateChange]);

  return {
    cleanup,
    getMemoryStats: () => memoryManager.getStats(),
  };
};

// Hook for memory-efficient data processing
export const useMemoryEfficientData = <T,>(
  data: T[],
  options: {
    batchSize?: number;
    delay?: number;
    maxItems?: number;
  } = {}
) => {
  const { batchSize = 50, delay = 100, maxItems = 1000 } = options;
  const [processedData, setProcessedData] = useState<T[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const processData = useCallback(async () => {
    if (processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);

    // Process data in batches to avoid blocking UI
    const processBatch = async (startIndex: number) => {
      const endIndex = Math.min(startIndex + batchSize, data.length);
      const batch = data.slice(startIndex, endIndex);

      // Process batch
      await new Promise(resolve => setTimeout(resolve, delay));
      
      setProcessedData(prev => {
        const newData = [...prev, ...batch];
        // Keep only the latest items to prevent memory overflow
        return newData.slice(-maxItems);
      });

      if (endIndex < data.length) {
        // Process next batch
        await processBatch(endIndex);
      } else {
        setIsProcessing(false);
        processingRef.current = false;
      }
    };

    // Start processing
    setProcessedData([]);
    await processBatch(0);
  }, [data, batchSize, delay, maxItems]);

  useEffect(() => {
    if (data.length > 0) {
      processData();
    }
  }, [data, processData]);

  return {
    processedData,
    isProcessing,
    processData,
  };
};

// Utility for debouncing memory-intensive operations
export const useMemoryDebounce = <T extends (...args: any[]) => any,>(
  callback: T,
  delay: number = 300,
  maxCalls: number = 10
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callCountRef = useRef(0);
  const lastCallRef = useRef(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    // Reset call count if enough time has passed
    if (now - lastCallRef.current > delay * 2) {
      callCountRef.current = 0;
    }

    // Limit number of calls to prevent memory issues
    if (callCountRef.current >= maxCalls) {
      return;
    }

    callCountRef.current++;
    lastCallRef.current = now;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
      callCountRef.current = 0;
    }, delay);
  }, [callback, delay, maxCalls]) as T;
};
