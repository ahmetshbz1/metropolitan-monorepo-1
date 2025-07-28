//  "offlineSlice.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import { StateCreator } from 'zustand';
import { EcommerceStore, OfflineAction } from '../types';
import { 
  generateTempId, 
  retryWithBackoff, 
  storeData, 
  retrieveData, 
  StorageKeys,
  sleep 
} from '../utils';
// Network detection using built-in APIs

export const createOfflineSlice: StateCreator<
  EcommerceStore,
  [],
  [],
  {
    offlineQueue: OfflineAction[];
    isOnline: boolean;
    queueOfflineAction: (action: Omit<OfflineAction, 'id' | 'queuedAt' | 'retryCount'>) => void;
    processOfflineQueue: () => Promise<void>;
    setOnlineStatus: (status: boolean) => void;
    initializeOfflineSupport: () => void;
  }
> = (set, get) => ({
  // Offline state
  offlineQueue: [],
  isOnline: true,

  // Queue action for offline processing
  queueOfflineAction: (action) => {
    const queuedAction: OfflineAction = {
      ...action,
      id: generateTempId(),
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    };

    set((state) => ({
      offlineQueue: [...state.offlineQueue, queuedAction],
    }));

    // Persist queue to storage
    storeData(StorageKeys.OFFLINE_QUEUE, get().offlineQueue);
  },

  // Process all queued offline actions
  processOfflineQueue: async () => {
    const { offlineQueue, isOnline } = get();
    
    if (!isOnline || offlineQueue.length === 0) {
      return;
    }

    console.log(`Processing ${offlineQueue.length} offline actions...`);

    for (const action of offlineQueue) {
      try {
        await processAction(action, get, set);
        
        // Remove successfully processed action
        set((state) => ({
          offlineQueue: state.offlineQueue.filter(a => a.id !== action.id),
        }));

        // Small delay between actions to avoid overwhelming the server
        await sleep(200);

      } catch (error) {
        console.warn(`Failed to process offline action ${action.id}:`, error);
        
        // Increment retry count
        set((state) => ({
          offlineQueue: state.offlineQueue.map(a => 
            a.id === action.id 
              ? { ...a, retryCount: a.retryCount + 1 }
              : a
          ),
        }));

        // Remove action if max retries exceeded
        if (action.retryCount >= 3) {
          console.error(`Max retries exceeded for action ${action.id}, removing from queue`);
          set((state) => ({
            offlineQueue: state.offlineQueue.filter(a => a.id !== action.id),
          }));
        }
      }
    }

    // Persist updated queue
    await storeData(StorageKeys.OFFLINE_QUEUE, get().offlineQueue);
    
    console.log('Offline queue processing completed');
  },

  // Set online status
  setOnlineStatus: (status: boolean) => {
    const wasOffline = !get().isOnline;
    
    set({ isOnline: status });

    // If coming back online, process queued actions
    if (status && wasOffline) {
      setTimeout(() => {
        get().processOfflineQueue();
      }, 1000); // Give a second for connection to stabilize
    }
  },

  // Initialize offline support with network monitoring
  initializeOfflineSupport: () => {
    // Load persisted offline queue
    loadPersistedQueue();

    // Set initial online status
    get().setOnlineStatus(navigator.onLine);

    // Monitor network connectivity using built-in events
    const handleOnline = () => get().setOnlineStatus(true);
    const handleOffline = () => get().setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
});

// Helper function to process individual actions
const processAction = async (action: OfflineAction, get: any, set: any) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      await get().addToCart(action.payload.productId, action.payload.quantity);
      break;
      
    case 'UPDATE_QUANTITY':
      await get().updateQuantity(action.payload.itemId, action.payload.quantity);
      break;
      
    case 'REMOVE_FROM_CART':
      await get().removeFromCart(action.payload.itemId);
      break;
      
    case 'UPDATE_PROFILE':
      await get().updateUserProfile(action.payload.userData);
      break;
      
    default:
      console.warn(`Unknown offline action type: ${action.type}`);
  }
};

// Helper function to load persisted queue
const loadPersistedQueue = async () => {
  try {
    const persistedQueue = await retrieveData<OfflineAction[]>(StorageKeys.OFFLINE_QUEUE);
    
    if (persistedQueue && Array.isArray(persistedQueue)) {
      // Filter out old actions (older than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      const now = new Date().getTime();
      
      const validActions = persistedQueue.filter(action => {
        const queuedTime = new Date(action.queuedAt).getTime();
        return (now - queuedTime) < maxAge;
      });

      if (validActions.length > 0) {
        // Update store with valid actions
        const { set } = arguments as any;
        set({ offlineQueue: validActions });
      }
    }
  } catch (error) {
    console.warn('Failed to load persisted offline queue:', error);
  }
};