import React, { useCallback, useMemo, useRef } from 'react';
import {
  ScrollView,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollViewProps,
} from 'react-native';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => JSX.Element;
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyComponent?: JSX.Element;
  loadingComponent?: JSX.Element;
  // Legacy props kept for API compatibility (not used by ScrollView)
  pageSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  // Common ScrollView props
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  style?: ScrollViewProps['style'];
  horizontal?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  scrollEventThrottle?: number;
}

const VirtualizedList = <T,>({
  data,
  renderItem,
  keyExtractor,
  loading = false,
  onLoadMore,
  hasMore = false,
  emptyComponent,
  loadingComponent,
  // Legacy/compat props (unused but destructured to avoid ...rest collisions)
  pageSize,
  initialNumToRender,
  maxToRenderPerBatch,
  windowSize,
  removeClippedSubviews,
  // ScrollView props
  contentContainerStyle,
  style,
  horizontal,
  refreshControl,
  showsVerticalScrollIndicator,
  showsHorizontalScrollIndicator,
  scrollEventThrottle = 16,
  ...props
}: VirtualizedListProps<T>) => {
  const endReachedGuardRef = useRef(false);

  const handleLoadMoreIfNeeded = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const visibleLength = horizontal ? layoutMeasurement.width : layoutMeasurement.height;
      const offset = horizontal ? contentOffset.x : contentOffset.y;
      const contentLength = horizontal ? contentSize.width : contentSize.height;

      const threshold = 200; // px before end
      const isNearEnd = visibleLength + offset >= contentLength - threshold;

      if (isNearEnd && hasMore && !loading && onLoadMore && !endReachedGuardRef.current) {
        endReachedGuardRef.current = true;
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore, horizontal]
  );

  const handleScrollBegin = useCallback(() => {
    endReachedGuardRef.current = false;
  }, []);

  const Footer = useMemo(() => {
    if (!hasMore) return null;
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0072B5" />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    return null;
  }, [hasMore, loading]);

  const Empty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#0072B5" />
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      );
    }

    return (
      emptyComponent || (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      )
    );
  }, [loading, emptyComponent]);

  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      horizontal={horizontal}
      refreshControl={refreshControl}
      onScroll={handleLoadMoreIfNeeded}
      onScrollBeginDrag={handleScrollBegin}
      scrollEventThrottle={scrollEventThrottle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      {...props}
    >
      {data.length === 0 ? (
        Empty
      ) : (
        <View>
          {data.map((item, index) => (
            <View key={keyExtractor(item, index)}>
              {renderItem(item, index)}
            </View>
          ))}
          {Footer}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default React.memo(VirtualizedList) as <T>(
  props: VirtualizedListProps<T>
) => JSX.Element;
