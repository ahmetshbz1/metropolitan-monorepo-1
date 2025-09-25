import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt?: number;
  version: string;
}

interface CacheConfig {
  prefix?: string;
  defaultTTL?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  version?: string;
}

class OfflineCacheService {
  private prefix: string;
  private defaultTTL: number;
  private maxSize: number;
  private version: string;
  private cacheKeys: Set<string> = new Set();

  constructor(config: CacheConfig = {}) {
    this.prefix = config.prefix || '@metropolitan_cache_';
    this.defaultTTL = config.defaultTTL || 1000 * 60 * 60 * 24; // 24 hours default
    this.maxSize = config.maxSize || 10 * 1024 * 1024; // 10MB default
    this.version = config.version || '1.0.0';

    this.loadCacheKeys();
  }

  /**
   * Store data in cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    const expiresAt = ttl ? Date.now() + ttl : Date.now() + this.defaultTTL;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt,
      version: this.version,
    };

    try {
      // Check cache size before storing
      await this.ensureCacheSize();

      const serialized = JSON.stringify(entry);
      await AsyncStorage.setItem(cacheKey, serialized);

      this.cacheKeys.add(cacheKey);
      await this.saveCacheKeys();

      if (__DEV__) {
        console.log(`Cached data for key: ${key}`);
      }
    } catch (error) {
      console.error(`Error caching data for key ${key}:`, error);
    }
  }

  /**
   * Retrieve data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(key);

    try {
      const serialized = await AsyncStorage.getItem(cacheKey);
      if (!serialized) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(serialized);

      // Check version compatibility
      if (entry.version !== this.version) {
        await this.remove(key);
        return null;
      }

      // Check expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.remove(key);
        return null;
      }

      if (__DEV__) {
        console.log(`Retrieved cached data for key: ${key}`);
      }

      return entry.data;
    } catch (error) {
      console.error(`Error retrieving cached data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove specific item from cache
   */
  async remove(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);

    try {
      await AsyncStorage.removeItem(cacheKey);
      this.cacheKeys.delete(cacheKey);
      await this.saveCacheKeys();

      if (__DEV__) {
        console.log(`Removed cached data for key: ${key}`);
      }
    } catch (error) {
      console.error(`Error removing cached data for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const keys = Array.from(this.cacheKeys);
      await AsyncStorage.multiRemove(keys);
      this.cacheKeys.clear();
      await this.saveCacheKeys();

      if (__DEV__) {
        console.log('Cleared all cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(key);
    const value = await AsyncStorage.getItem(cacheKey);
    return value !== null;
  }

  /**
   * Get cache size in bytes
   */
  async getSize(): Promise<number> {
    let totalSize = 0;

    try {
      for (const key of this.cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2; // Approximate size in bytes (UTF-16)
        }
      }
    } catch (error) {
      console.error('Error calculating cache size:', error);
    }

    return totalSize;
  }

  /**
   * Ensure cache doesn't exceed max size
   */
  private async ensureCacheSize(): Promise<void> {
    const currentSize = await this.getSize();

    if (currentSize > this.maxSize) {
      // Remove oldest entries until under max size
      const entries: Array<{ key: string; timestamp: number }> = [];

      for (const key of this.cacheKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const entry = JSON.parse(value);
            entries.push({ key, timestamp: entry.timestamp });
          }
        } catch (error) {
          // Skip invalid entries
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries
      const toRemove = Math.floor(entries.length * 0.3); // Remove 30% of oldest entries
      for (let i = 0; i < toRemove; i++) {
        const keyToRemove = entries[i].key.replace(this.prefix, '');
        await this.remove(keyToRemove);
      }
    }
  }

  /**
   * Clean expired entries
   */
  async cleanExpired(): Promise<void> {
    const keysToRemove: string[] = [];

    for (const cacheKey of this.cacheKeys) {
      try {
        const value = await AsyncStorage.getItem(cacheKey);
        if (value) {
          const entry: CacheEntry = JSON.parse(value);
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            keysToRemove.push(cacheKey);
          }
        }
      } catch (error) {
        // Remove invalid entries
        keysToRemove.push(cacheKey);
      }
    }

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      keysToRemove.forEach(key => this.cacheKeys.delete(key));
      await this.saveCacheKeys();

      if (__DEV__) {
        console.log(`Cleaned ${keysToRemove.length} expired cache entries`);
      }
    }
  }

  /**
   * Get formatted cache key
   */
  private getCacheKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Load cache keys from storage
   */
  private async loadCacheKeys(): Promise<void> {
    try {
      const keysData = await AsyncStorage.getItem(`${this.prefix}keys`);
      if (keysData) {
        this.cacheKeys = new Set(JSON.parse(keysData));
      }
    } catch (error) {
      console.error('Error loading cache keys:', error);
    }
  }

  /**
   * Save cache keys to storage
   */
  private async saveCacheKeys(): Promise<void> {
    try {
      const keysArray = Array.from(this.cacheKeys);
      await AsyncStorage.setItem(`${this.prefix}keys`, JSON.stringify(keysArray));
    } catch (error) {
      console.error('Error saving cache keys:', error);
    }
  }
}

// Export singleton instance
export const offlineCache = new OfflineCacheService({
  prefix: '@metropolitan_',
  defaultTTL: 1000 * 60 * 60 * 24, // 24 hours
  maxSize: 10 * 1024 * 1024, // 10MB
  version: '1.0.0',
});

// Export specific cache instances for different data types
export const productCache = new OfflineCacheService({
  prefix: '@metropolitan_products_',
  defaultTTL: 1000 * 60 * 60 * 12, // 12 hours
  maxSize: 5 * 1024 * 1024, // 5MB
});

export const userCache = new OfflineCacheService({
  prefix: '@metropolitan_user_',
  defaultTTL: 1000 * 60 * 60 * 6, // 6 hours
  maxSize: 2 * 1024 * 1024, // 2MB
});

export const orderCache = new OfflineCacheService({
  prefix: '@metropolitan_orders_',
  defaultTTL: 1000 * 60 * 60, // 1 hour
  maxSize: 3 * 1024 * 1024, // 3MB
});

export default OfflineCacheService;