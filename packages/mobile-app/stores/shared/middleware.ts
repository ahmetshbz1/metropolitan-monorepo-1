//  "middleware.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { StoreApi, StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createAsyncStorageAdapter } from './storage';
import { PersistConfig } from './types';

// Logger middleware for development
export const logger = <T extends object>(
  config: StateCreator<T>
): StateCreator<T> => (set, get, api) =>
  config(
    (args) => {
      if (__DEV__) {
        console.log('Previous state:', get());
        console.log('Applying:', args);
      }
      set(args);
      if (__DEV__) {
        console.log('New state:', get());
      }
    },
    get,
    api
  );

// Performance monitoring middleware
export const performanceMonitor = <T extends object>(
  config: StateCreator<T>
): StateCreator<T> => {
  let renderCount = 0;
  let lastRenderTime = Date.now();
  
  return (set, get, api) =>
    config(
      (args) => {
        const startTime = Date.now();
        set(args);
        
        if (__DEV__) {
          renderCount++;
          const renderTime = Date.now() - startTime;
          
          if (renderTime > 16) { // More than one frame (60fps)
            console.warn(`Slow state update: ${renderTime}ms`);
          }
          
          lastRenderTime = Date.now();
        }
      },
      get,
      api
    );
};

// Create store with all middleware
export const createStore = <T extends object>(
  name: string,
  config: StateCreator<T>,
  persistConfig?: PersistConfig
) => {
  let store = config;

  // Apply immer for immutable updates
  store = immer(store) as StateCreator<T>;

  // Apply persistence if config provided
  if (persistConfig) {
    store = persist(store, {
      name: persistConfig.key,
      storage: createAsyncStorageAdapter(),
      version: persistConfig.version,
      migrate: persistConfig.migrate,
    }) as StateCreator<T>;
  }

  // Apply devtools in development
  if (__DEV__) {
    store = devtools(store, { name }) as StateCreator<T>;
    store = logger(store) as StateCreator<T>;
    store = performanceMonitor(store) as StateCreator<T>;
  }

  return store;
};

// Batch updates utility
export const batchUpdates = <T>(updates: Array<(state: T) => void>) => {
  return (state: T) => {
    updates.forEach(update => update(state));
  };
};