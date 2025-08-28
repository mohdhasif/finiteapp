import React, { useState, useCallback, useMemo } from 'react';
import {
  Image,
  ImageProps,
  ImageURISource,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';
import { BASE_URL } from '../constants/apiConfig';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: ImageURISource;
  fallbackSource?: ImageURISource;
  showLoader?: boolean;
  showError?: boolean;
  cacheKey?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  fallbackSource,
  showLoader = true,
  showError = true,
  style,
  onLoad,
  onError,
  resizeMode = 'cover',
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Process source URL to ensure it's absolute
  const processedSource = useMemo(() => {
    if (typeof source === 'object' && source.uri) {
      const uri = source.uri;
      if (uri.startsWith('http')) {
        return source;
      }
      // Handle relative URLs
      if (uri.startsWith('/')) {
        return { ...source, uri: `${BASE_URL}${uri}` };
      }
      // Handle relative URLs without leading slash
      return { ...source, uri: `${BASE_URL}/${uri}` };
    }
    return source;
  }, [source]);

  const handleLoad = useCallback((event: any) => {
    setLoading(false);
    setError(false);
    setImageLoaded(true);
    onLoad?.(event);
  }, [onLoad]);

  const handleError = useCallback((event: any) => {
    setLoading(false);
    setError(true);
    onError?.(event);
  }, [onError]);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
  }, []);

  // Show loading indicator
  if (loading && showLoader) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#0072B5" />
      </View>
    );
  }

  // Show error state
  if (error && showError) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>Failed to load image</Text>
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={error && fallbackSource ? fallbackSource : processedSource}
      style={[styles.image, style]}
      resizeMode={resizeMode}
      onLoadStart={handleLoadStart}
      onLoad={handleLoad}
      onError={handleError}
      // Performance optimizations
      fadeDuration={0}
      progressiveRenderingEnabled={true}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  errorText: {
    color: '#6c757d',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default React.memo(OptimizedImage);
