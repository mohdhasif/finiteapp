import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';

interface VirtualizedListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem' | 'keyExtractor'> {
  data: T[];
  renderItem: (item: T, index: number) => JSX.Element;
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyComponent?: JSX.Element;
  loadingComponent?: JSX.Element;
  pageSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
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
  pageSize = 20,
  initialNumToRender = 10,
  maxToRenderPerBatch = 10,
  windowSize = 5,
  removeClippedSubviews = true,
  ...props
}: VirtualizedListProps<T>) => {
  
  const handleEndReached = useCallback(() => {
    if (hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  const handleRenderItem = useCallback(({ item, index }: { item: T; index: number }) => {
    return renderItem(item, index);
  }, [renderItem]);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore) return null;
    
    if (loading) {
      return loadingComponent || (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0072B5" />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    
    return null;
  }, [hasMore, loading, loadingComponent]);

  const ListEmptyComponent = useMemo(() => {
    if (loading) {
      return loadingComponent || (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#0072B5" />
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      );
    }
    
    return emptyComponent || (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }, [loading, emptyComponent, loadingComponent]);

  return (
    <FlatList
      data={data}
      renderItem={handleRenderItem}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      // Performance optimizations
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      getItemLayout={props.getItemLayout}
      // Memory optimizations
      updateCellsBatchingPeriod={50}
      disableVirtualization={false}
      // Scroll performance
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      {...props}
    />
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
