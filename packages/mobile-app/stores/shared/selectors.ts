//  "selectors.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { StoreApi, UseBoundStore } from 'zustand';
import { StateSelector, EqualityFn } from './types';

// Shallow equality check
export const shallow: EqualityFn<any> = (a, b) => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!Object.is(a[key], b[key])) return false;
  }
  
  return true;
};

// Create memoized selector
export const createSelector = <T, U>(
  selector: StateSelector<T, U>,
  equalityFn: EqualityFn<U> = Object.is
) => {
  let lastState: T | undefined;
  let lastResult: U | undefined;
  
  return (state: T): U => {
    if (lastState === state && lastResult !== undefined) {
      return lastResult;
    }
    
    const result = selector(state);
    
    if (lastResult !== undefined && equalityFn(result, lastResult)) {
      return lastResult;
    }
    
    lastState = state;
    lastResult = result;
    return result;
  };
};

// Create computed selector that combines multiple selectors
export const createComputedSelector = <T, Args extends readonly unknown[], R>(
  selectors: { [K in keyof Args]: StateSelector<T, Args[K]> },
  combiner: (...args: Args) => R,
  equalityFn: EqualityFn<R> = Object.is
) => {
  const memoizedCombiner = createSelector(
    (state: T) => {
      const values = selectors.map(selector => selector(state)) as unknown as Args;
      return combiner(...values);
    },
    equalityFn
  );
  
  return memoizedCombiner;
};

// Subscribe to specific slice of store
export const subscribeWithSelector = <T, U>(
  store: UseBoundStore<StoreApi<T>>,
  selector: StateSelector<T, U>,
  listener: (selected: U, previousSelected: U) => void,
  equalityFn: EqualityFn<U> = Object.is
) => {
  let currentSlice = selector(store.getState());
  
  return store.subscribe((state) => {
    const nextSlice = selector(state);
    
    if (!equalityFn(currentSlice, nextSlice)) {
      const previousSlice = currentSlice;
      currentSlice = nextSlice;
      listener(nextSlice, previousSlice);
    }
  });
};

// Performance tracking selector
export const withPerformanceTracking = <T, U>(
  selector: StateSelector<T, U>,
  name: string
): StateSelector<T, U> => {
  return (state: T) => {
    if (__DEV__) {
      const start = performance.now();
      const result = selector(state);
      const duration = performance.now() - start;
      
      if (duration > 1) {
        console.warn(`Slow selector "${name}": ${duration.toFixed(2)}ms`);
      }
      
      return result;
    }
    
    return selector(state);
  };
};