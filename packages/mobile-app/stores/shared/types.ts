//  "types.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

// Shared types for all stores
export interface StoreError {
  code: string;
  message: string;
  timestamp: number;
}

export interface AsyncState {
  isLoading: boolean;
  error: StoreError | null;
}

export interface PersistConfig {
  key: string;
  version: number;
  migrate?: (persistedState: any, version: number) => any;
}

// Offline action queue types
export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineQueue {
  actions: QueuedAction[];
  isProcessing: boolean;
  addAction: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  processQueue: () => Promise<void>;
  removeAction: (id: string) => void;
  clearQueue: () => void;
}

// Performance monitoring types
export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

export type StateSelector<T, U> = (state: T) => U;
export type EqualityFn<T> = (a: T, b: T) => boolean;