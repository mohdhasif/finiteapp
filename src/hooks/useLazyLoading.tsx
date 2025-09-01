import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InteractionManager } from 'react-native';

interface LazyLoadingOptions {
  threshold?: number;
  delay?: number;
  enabled?: boolean;
}

export const useLazyLoading = <T,>(
  data: T[],
  options: LazyLoadingOptions = {}
) => {
  const { threshold = 0.8, delay = 100, enabled = true } = options;
  const [visibleData, setVisibleData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const loadingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const loadMore = useCallback(async () => {
    if (loadingRef.current || currentIndex >= data.length) return;

    loadingRef.current = true;
    setIsLoading(true);

    // Use InteractionManager to defer loading until interactions are complete
    InteractionManager.runAfterInteractions(() => {
      const nextBatch = data.slice(currentIndex, currentIndex + 10);
      setVisibleData(prev => [...prev, ...nextBatch]);
      setCurrentIndex(prev => prev + 10);
      setIsLoading(false);
      loadingRef.current = false;
    });
  }, [data, currentIndex]);

  const reset = useCallback(() => {
    setVisibleData([]);
    setCurrentIndex(0);
    setIsLoading(false);
    loadingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!enabled || data.length === 0) return;

    // Initial load
    const initialBatch = data.slice(0, 10);
    setVisibleData(initialBatch);
    setCurrentIndex(10);

    // Set up lazy loading
    const handleScroll = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const progress = visibleData.length / data.length;
        if (progress >= threshold && !loadingRef.current) {
          loadMore();
        }
      }, delay);
    };

    // Trigger initial check
    handleScroll();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, threshold, delay, loadMore, visibleData.length]);

  return {
    visibleData,
    isLoading,
    hasMore: currentIndex < data.length,
    loadMore,
    reset,
    progress: data.length > 0 ? visibleData.length / data.length : 0,
  };
};

// Hook for lazy loading images
export const useLazyImageLoading = (
  imageUrls: string[],
  options: LazyLoadingOptions = {}
) => {
  const { threshold = 0.5, delay = 200, enabled = true } = options;
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const loadingRef = useRef(false);

  const loadImage = useCallback(async (url: string) => {
    if (loadedImages.has(url) || loadingImages.has(url)) return;

    setLoadingImages(prev => new Set(prev).add(url));

    try {
      // For React Native, we'll use a different approach
      // Check if the image URL is valid
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        setLoadedImages(prev => new Set(prev).add(url));
      } else {
        throw new Error(`Image not found: ${url}`);
      }
    } catch (error) {
      console.warn(`Failed to load image: ${url}`, error);
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    }
  }, [loadedImages, loadingImages]);

  const loadVisibleImages = useCallback(async (visibleUrls: string[]) => {
    if (loadingRef.current) return;

    loadingRef.current = true;

    // Use InteractionManager for better performance
    InteractionManager.runAfterInteractions(() => {
      const unloadedUrls = visibleUrls.filter(url => 
        !loadedImages.has(url) && !loadingImages.has(url)
      );

      // Load images in batches
      const batchSize = 3;
      for (let i = 0; i < unloadedUrls.length; i += batchSize) {
        const batch = unloadedUrls.slice(i, i + batchSize);
        setTimeout(() => {
          batch.forEach(url => loadImage(url));
        }, i * delay);
      }

      loadingRef.current = false;
    });
  }, [loadedImages, loadingImages, loadImage, delay]);

  const reset = useCallback(() => {
    setLoadedImages(new Set());
    setLoadingImages(new Set());
    loadingRef.current = false;
  }, []);

  return {
    loadedImages,
    loadingImages,
    loadVisibleImages,
    reset,
    isImageLoaded: (url: string) => loadedImages.has(url),
    isImageLoading: (url: string) => loadingImages.has(url),
  };
};

// Hook for intersection observer (for web-like lazy loading)
// Note: This is a simplified version for React Native
export const useIntersectionObserver = (
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) => {
  const { enabled = true } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    // For React Native, we'll use a simple approach
    // In a real implementation, you might use react-native-visibility-aware-view
    setIsIntersecting(true);
    setHasIntersected(true);
  }, [enabled]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
  };
};
