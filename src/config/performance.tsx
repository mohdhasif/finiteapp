// Performance configuration
export const PERFORMANCE_CONFIG = {
  // Enable/disable performance monitoring
  ENABLE_PERFORMANCE_MONITORING: __DEV__,
  
  // Cache settings
  CACHE: {
    ENABLED: true,
    DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 100, // Maximum number of cached items
  },
  
  // Image optimization
  IMAGES: {
    ENABLE_LAZY_LOADING: true,
    ENABLE_CACHING: true,
    ENABLE_PROGRESSIVE_LOADING: true,
    FADE_DURATION: 0,
  },
  
  // API optimization
  API: {
    ENABLE_REQUEST_DEDUPLICATION: true,
    ENABLE_RESPONSE_CACHING: true,
    ENABLE_RETRY_ON_FAILURE: true,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },
  
  // Component optimization
  COMPONENTS: {
    ENABLE_MEMOIZATION: true,
    ENABLE_LAZY_LOADING: true,
    ENABLE_VIRTUALIZATION: true,
  },
  
  // Animation optimization
  ANIMATIONS: {
    ENABLE_NATIVE_DRIVER: true,
    ENABLE_USE_NATIVE_DRIVER: true,
    ENABLE_LAYOUT_ANIMATIONS: false, // Disable for better performance
  },
  
  // Memory management
  MEMORY: {
    ENABLE_GARBAGE_COLLECTION: true,
    ENABLE_MEMORY_MONITORING: __DEV__,
    WARNING_THRESHOLD: 50, // MB
  },
  
  // Network optimization
  NETWORK: {
    ENABLE_REQUEST_BATCHING: true,
    ENABLE_RESPONSE_COMPRESSION: true,
    ENABLE_OFFLINE_CACHING: true,
  },
  
  // Debug settings (development only)
  DEBUG: {
    ENABLE_PERFORMANCE_LOGS: __DEV__,
    ENABLE_MEMORY_LOGS: __DEV__,
    ENABLE_NETWORK_LOGS: __DEV__,
    ENABLE_RENDER_LOGS: __DEV__,
  },
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  SLOW_RENDER: 16, // ms (60fps)
  SLOW_OPERATION: 1000, // ms
  SLOW_NETWORK: 5000, // ms
  MEMORY_WARNING: 50, // MB
  CACHE_SIZE_WARNING: 80, // items
} as const;

// Feature flags for performance optimizations
export const FEATURE_FLAGS = {
  ENABLE_NEW_API_CLIENT: true,
  ENABLE_OPTIMIZED_IMAGES: true,
  ENABLE_PERFORMANCE_HOOKS: true,
  ENABLE_MEMOIZATION: true,
  ENABLE_LAZY_LOADING: true,
} as const;
