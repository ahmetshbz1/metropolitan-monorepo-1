//  "base-cache-strategy.ts"
//  metropolitan backend
//  Base interface for all cache strategies

export interface CacheOptions {
  ttl?: number;
  staleWhileRevalidate?: boolean;
  staleTtl?: number;
}

export interface CacheStrategy<T> {
  execute(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T>;
}

export abstract class BaseCacheStrategy<T> implements CacheStrategy<T> {
  protected readonly defaultOptions: CacheOptions = {
    ttl: 300,
    staleWhileRevalidate: true,
    staleTtl: 3600,
  };

  abstract execute(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T>;

  protected mergeOptions(options?: CacheOptions): Required<CacheOptions> {
    return {
      ttl: options?.ttl ?? this.defaultOptions.ttl!,
      staleWhileRevalidate: options?.staleWhileRevalidate ?? this.defaultOptions.staleWhileRevalidate!,
      staleTtl: options?.staleTtl ?? this.defaultOptions.staleTtl!,
    };
  }
}