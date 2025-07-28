//  "useOptimizedList.ts"
//  metropolitan app
//  Optimized list rendering hook with virtualization support

import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, ViewToken } from "react-native";

interface UseOptimizedListOptions<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  // Performance options
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  windowSize?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  // Viewport tracking
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
  viewabilityConfig?: {
    minimumViewTime?: number;
    viewAreaCoveragePercentThreshold?: number;
    itemVisiblePercentThreshold?: number;
    waitForInteraction?: boolean;
  };
}

export function useOptimizedList<T>({
  data,
  keyExtractor,
  initialNumToRender = 10,
  maxToRenderPerBatch = 5,
  windowSize = 10,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  onViewableItemsChanged,
  viewabilityConfig = {
    minimumViewTime: 250,
    viewAreaCoveragePercentThreshold: 50,
    itemVisiblePercentThreshold: 50,
    waitForInteraction: false,
  },
}: UseOptimizedListOptions<T>) {
  const flatListRef = useRef<FlatList>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Memoized performance props
  const performanceProps = useMemo(
    () => ({
      initialNumToRender,
      maxToRenderPerBatch,
      windowSize,
      updateCellsBatchingPeriod,
      removeClippedSubviews,
      // Additional performance optimizations
      maintainVisibleContentPosition: {
        minIndexForVisible: 0,
      },
      // Optimize scrolling performance
      scrollEventThrottle: 16,
      // Use getItemLayout if items have fixed height
      // getItemLayout: (data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }),
    }),
    [initialNumToRender, maxToRenderPerBatch, windowSize, updateCellsBatchingPeriod, removeClippedSubviews]
  );
  
  // Optimized scroll to index
  const scrollToIndex = useCallback((index: number, animated = true) => {
    flatListRef.current?.scrollToIndex({ index, animated });
  }, []);
  
  // Optimized scroll to top
  const scrollToTop = useCallback((animated = true) => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated });
  }, []);
  
  // Handle refresh with optimization
  const handleRefresh = useCallback(async (onRefresh: () => Promise<void>) => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  // Memoized viewability config
  const memoizedViewabilityConfig = useMemo(
    () => viewabilityConfig,
    [
      viewabilityConfig.minimumViewTime,
      viewabilityConfig.viewAreaCoveragePercentThreshold,
      viewabilityConfig.itemVisiblePercentThreshold,
      viewabilityConfig.waitForInteraction,
    ]
  );
  
  // Optimized key extractor
  const memoizedKeyExtractor = useCallback(keyExtractor, []);
  
  return {
    listRef: flatListRef,
    listProps: {
      ...performanceProps,
      data,
      keyExtractor: memoizedKeyExtractor,
      refreshing,
      onViewableItemsChanged,
      viewabilityConfig: memoizedViewabilityConfig,
    },
    scrollToIndex,
    scrollToTop,
    handleRefresh,
    refreshing,
  };
}