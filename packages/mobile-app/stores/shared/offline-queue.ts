//  "offline-queue.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { StorageKeys } from './storage';
import { QueuedAction, OfflineQueue } from './types';

// Offline action queue implementation
export const createOfflineQueue = (
  processAction: (action: QueuedAction) => Promise<boolean>
): OfflineQueue => {
  let actions: QueuedAction[] = [];
  let isProcessing = false;

  // Load queued actions from storage on init
  const loadQueue = async () => {
    try {
      const stored = await AsyncStorage.getItem(StorageKeys.OFFLINE_QUEUE);
      if (stored) {
        actions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  };

  // Save queue to storage
  const saveQueue = async () => {
    try {
      await AsyncStorage.setItem(
        StorageKeys.OFFLINE_QUEUE,
        JSON.stringify(actions)
      );
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  };

  // Add action to queue
  const addAction = (
    action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>
  ) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    actions.push(queuedAction);
    saveQueue();
  };

  // Process queued actions
  const processQueue = async () => {
    if (isProcessing || actions.length === 0) return;
    
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return;
    
    isProcessing = true;
    const processedIds: string[] = [];
    
    for (const action of actions) {
      try {
        const success = await processAction(action);
        
        if (success) {
          processedIds.push(action.id);
        } else if (action.retryCount < action.maxRetries) {
          action.retryCount++;
        } else {
          // Max retries reached, remove from queue
          processedIds.push(action.id);
          console.warn('Action failed after max retries:', action);
        }
      } catch (error) {
        console.error('Failed to process action:', error);
        
        if (action.retryCount < action.maxRetries) {
          action.retryCount++;
        } else {
          processedIds.push(action.id);
        }
      }
    }
    
    // Remove processed actions
    actions = actions.filter(a => !processedIds.includes(a.id));
    await saveQueue();
    
    isProcessing = false;
  };

  // Remove specific action
  const removeAction = (id: string) => {
    actions = actions.filter(a => a.id !== id);
    saveQueue();
  };

  // Clear all queued actions
  const clearQueue = () => {
    actions = [];
    saveQueue();
  };

  // Listen for network changes
  NetInfo.addEventListener(state => {
    if (state.isConnected && !isProcessing) {
      processQueue();
    }
  });

  // Load queue on creation
  loadQueue();

  return {
    actions,
    isProcessing,
    addAction,
    processQueue,
    removeAction,
    clearQueue,
  };
};

// Exponential backoff for retries
export const getRetryDelay = (retryCount: number): number => {
  return Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
};