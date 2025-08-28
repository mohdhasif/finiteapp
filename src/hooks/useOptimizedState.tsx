import { useState, useCallback, useRef, useEffect } from 'react';

// Debounced state hook
export const useDebouncedState = <T,>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] => {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>();

  const setDebouncedState = useCallback((newValue: T) => {
    setValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, setDebouncedState, debouncedValue];
};

// Throttled state hook
export const useThrottledState = <T,>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>(initialValue);
  const lastUpdateRef = useRef<number>(0);

  const setThrottledState = useCallback((newValue: T) => {
    const now = Date.now();
    if (now - lastUpdateRef.current >= delay) {
      setValue(newValue);
      lastUpdateRef.current = now;
    }
  }, [delay]);

  return [value, setThrottledState];
};

// Optimized list state with pagination
export const useOptimizedList = <T,>(
  initialItems: T[] = [],
  pageSize: number = 20
) => {
  const [items, setItems] = useState<T[]>(initialItems);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const addItems = useCallback((newItems: T[], reset: boolean = false) => {
    if (reset) {
      setItems(newItems);
      setCurrentPage(1);
      setHasMore(newItems.length >= pageSize);
    } else {
      setItems((prev) => [...prev, ...newItems]);
      setCurrentPage((prev) => prev + 1);
      setHasMore(newItems.length >= pageSize);
    }
  }, [pageSize]);

  const loadMore = useCallback(async (loader: () => Promise<T[]>) => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const newItems = await loader();
      addItems(newItems);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, addItems]);

  const reset = useCallback(() => {
    setItems([]);
    setCurrentPage(1);
    setHasMore(true);
    setLoading(false);
  }, []);

  return {
    items,
    currentPage,
    hasMore,
    loading,
    addItems,
    loadMore,
    reset,
    setItems,
  };
};

// Optimized async state
export const useAsyncState = <T,>(
  initialValue: T | null = null
) => {
  const [data, setData] = useState<T | null>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialValue);
    setLoading(false);
    setError(null);
  }, [initialValue]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
  };
};

// Optimized form state
export const useOptimizedForm = <T extends Record<string, any>>(
  initialValues: T
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }, [errors]);

  const setError = useCallback(<K extends keyof T>(key: K, error: string) => {
    setErrors((prev) => ({ ...prev, [key]: error }));
  }, []);

  const setTouchedField = useCallback(<K extends keyof T>(key: K, isTouched: boolean = true) => {
    setTouched((prev) => ({ ...prev, [key]: isTouched }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setError,
    setTouchedField,
    setIsSubmitting,
    reset,
  };
};
