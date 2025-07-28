//  "useOptimizedContext.ts"
//  metropolitan app
//  Optimized context hook with automatic memoization

import { useCallback, useContext, useMemo, useRef, useSyncExternalStore } from "react";

interface OptimizedContextOptions<T> {
  // Selector function to pick specific parts of state
  selector?: (state: T) => any;
  // Equality function for shallow comparison
  equalityFn?: (a: any, b: any) => boolean;
  // Debounce updates (ms)
  debounce?: number;
}

// Default shallow equality check
const defaultEqualityFn = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => a[key] === b[key]);
};

export function createOptimizedContext<T>() {
  const subscribers = new Set<() => void>();
  let currentState: T;
  
  const subscribe = (callback: () => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };
  
  const getSnapshot = () => currentState;
  
  const setState = (newState: T) => {
    if (currentState !== newState) {
      currentState = newState;
      subscribers.forEach(callback => callback());
    }
  };
  
  return {
    Provider: ({ value, children }: { value: T; children: React.ReactNode }) => {
      currentState = value;
      return <>{children}</>;
    },
    
    useOptimizedContext: (options: OptimizedContextOptions<T> = {}) => {
      const {
        selector,
        equalityFn = defaultEqualityFn,
        debounce = 0,
      } = options;
      
      const previousSelectedRef = useRef<any>();
      const debounceTimerRef = useRef<NodeJS.Timeout>();
      
      // Use external store for optimal performance
      const state = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getSnapshot
      );
      
      // Apply selector with memoization
      const selectedState = useMemo(() => {
        const selected = selector ? selector(state) : state;
        
        // Check if selection changed
        if (previousSelectedRef.current && equalityFn(previousSelectedRef.current, selected)) {
          return previousSelectedRef.current;
        }
        
        previousSelectedRef.current = selected;
        return selected;
      }, [state, selector, equalityFn]);
      
      // Debounced state for expensive operations
      const [debouncedState, setDebouncedState] = React.useState(selectedState);
      
      React.useEffect(() => {
        if (debounce > 0) {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          debounceTimerRef.current = setTimeout(() => {
            setDebouncedState(selectedState);
          }, debounce);
          
          return () => {
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }
          };
        } else {
          setDebouncedState(selectedState);
        }
      }, [selectedState, debounce]);
      
      return debounce > 0 ? debouncedState : selectedState;
    },
    
    setState,
  };
}

// Performance monitoring wrapper
export function withPerformanceMonitoring<T>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return React.memo((props: T) => {
    const renderStartRef = useRef<number>();
    const renderEndRef = useRef<number>();
    
    // Track render start
    renderStartRef.current = performance.now();
    
    React.useEffect(() => {
      // Track render end
      renderEndRef.current = performance.now();
      const renderTime = renderEndRef.current - renderStartRef.current!;
      
      // Log slow renders
      if (renderTime > 16) { // More than one frame (60fps)
        console.warn(
          `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
        );
      }
    });
    
    return <Component {...props} />;
  });
}

// Batch state updates for better performance
export function useBatchedUpdates<T extends Record<string, any>>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = React.useState(initialState);
  const pendingUpdatesRef = useRef<Partial<T>>({});
  const updateTimerRef = useRef<NodeJS.Timeout>();
  
  const batchedSetState = useCallback((updates: Partial<T>) => {
    // Accumulate updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };
    
    // Clear existing timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    // Schedule batch update
    updateTimerRef.current = setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        ...pendingUpdatesRef.current,
      }));
      pendingUpdatesRef.current = {};
    }, 0); // Next tick
  }, []);
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []);
  
  return [state, batchedSetState];
}