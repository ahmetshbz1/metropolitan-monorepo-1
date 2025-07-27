//  "useCache.ts"
//  metropolitan app
//  Created by Ahmet on 09.07.2025.

import { useCallback } from "react";

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export const useCache = <T>(cacheTimeout: number = 5 * 60 * 1000) => {
  const isCacheValid = useCallback(
    (cacheItem: CacheItem<T> | undefined): boolean => {
      if (!cacheItem) return false;
      return Date.now() - cacheItem.timestamp < cacheTimeout;
    },
    [cacheTimeout]
  );

  const createCacheItem = useCallback((data: T): CacheItem<T> => {
    return {
      data,
      timestamp: Date.now(),
    };
  }, []);

  const shouldRefresh = useCallback(
    (
      cached: CacheItem<T> | undefined,
      hasData: boolean,
      forceRefresh: boolean
    ): boolean => {
      if (forceRefresh) return true;
      if (!hasData) return true;
      return !isCacheValid(cached);
    },
    [isCacheValid]
  );

  return {
    isCacheValid,
    createCacheItem,
    shouldRefresh,
  };
};