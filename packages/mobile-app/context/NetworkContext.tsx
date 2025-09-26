import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  networkType: string;
  isOffline: boolean;
  connectionQuality: 'poor' | 'moderate' | 'good' | 'excellent' | 'unknown';
  offlineQueue: OfflineRequest[];
  addToOfflineQueue: (request: OfflineRequest) => void;
  processOfflineQueue: () => Promise<void>;
  clearOfflineQueue: () => void;
}

interface OfflineRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  priority: 'low' | 'normal' | 'high';
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const OFFLINE_QUEUE_KEY = '@metropolitan_offline_queue';
const MAX_RETRY_COUNT = 3;
const QUEUE_PROCESS_INTERVAL = 30000; // 30 seconds

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [networkType, setNetworkType] = useState<string>('unknown');
  const [connectionQuality, setConnectionQuality] = useState<NetworkContextType['connectionQuality']>('unknown');
  const [offlineQueue, setOfflineQueue] = useState<OfflineRequest[]>([]);
  const [processingQueue, setProcessingQueue] = useState(false);

  // Load offline queue from storage on mount
  useEffect(() => {
    loadOfflineQueue();
  }, []);

  // Save offline queue to storage whenever it changes
  useEffect(() => {
    saveOfflineQueue();
  }, [offlineQueue]);

  // Set up network state monitoring
  useEffect(() => {
    let unsubscribe: NetInfoSubscription;

    const setupNetworkListener = async () => {
      // Get initial state
      const state = await NetInfo.fetch();
      handleNetworkStateChange(state);

      // Subscribe to network state changes
      unsubscribe = NetInfo.addEventListener(handleNetworkStateChange);
    };

    setupNetworkListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Process offline queue when connection is restored
  useEffect(() => {
    if (isConnected && !processingQueue && offlineQueue.length > 0) {
      processOfflineQueue();
    }
  }, [isConnected]);

  // Periodic queue processing
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && !processingQueue && offlineQueue.length > 0) {
        processOfflineQueue();
      }
    }, QUEUE_PROCESS_INTERVAL);

    return () => clearInterval(interval);
  }, [isConnected, processingQueue, offlineQueue]);

  const handleNetworkStateChange = (state: NetInfoState) => {
    setIsConnected(state.isConnected ?? false);
    setIsInternetReachable(state.isInternetReachable);
    setNetworkType(state.type);

    // Determine connection quality based on network type
    const quality = getConnectionQuality(state);
    setConnectionQuality(quality);

    // Log network state changes in development
    if (__DEV__) {
      // Network state changed
    }
  };

  const getConnectionQuality = (state: NetInfoState): NetworkContextType['connectionQuality'] => {
    if (!state.isConnected) return 'unknown';

    // Platform-specific quality assessment
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      switch (state.type) {
        case 'wifi':
          return 'excellent';
        case 'cellular':
          // Check cellular generation if available
          const cellularGen = (state.details as any)?.cellularGeneration;
          if (cellularGen === '4g' || cellularGen === '5g') return 'good';
          if (cellularGen === '3g') return 'moderate';
          return 'poor';
        case 'ethernet':
          return 'excellent';
        default:
          return 'unknown';
      }
    }

    return state.isConnected ? 'good' : 'unknown';
  };

  const loadOfflineQueue = async () => {
    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queueData) {
        const queue = JSON.parse(queueData);
        setOfflineQueue(queue);
      }
    } catch (error) {
      // Error loading offline queue
    }
  };

  const saveOfflineQueue = async () => {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
    } catch (error) {
      // Error saving offline queue
    }
  };

  const addToOfflineQueue = useCallback((request: Omit<OfflineRequest, 'id' | 'timestamp' | 'retryCount'>) => {
    const newRequest: OfflineRequest = {
      ...request,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setOfflineQueue(prev => {
      // Sort by priority
      const updated = [...prev, newRequest].sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      return updated;
    });

    if (__DEV__) {
      // Removed console statement
    }
  }, []);

  const processOfflineQueue = useCallback(async () => {
    if (processingQueue || offlineQueue.length === 0 || !isConnected) {
      return;
    }

    setProcessingQueue(true);

    try {
      const queue = [...offlineQueue];
      const failedRequests: OfflineRequest[] = [];

      for (const request of queue) {
        try {
          // Process the request
          const response = await processOfflineRequest(request);

          if (response.ok) {
            // Remove successful request from queue
            setOfflineQueue(prev => prev.filter(r => r.id !== request.id));

            if (__DEV__) {
              // Removed console statement
            }
          } else {
            // Handle failed request
            const updatedRequest = { ...request, retryCount: request.retryCount + 1 };

            if (updatedRequest.retryCount < MAX_RETRY_COUNT) {
              failedRequests.push(updatedRequest);
            } else {
              // Max retries reached, remove from queue
              if (__DEV__) {
                // Max retries reached for request: ${request.id}
              }
            }
          }
        } catch (error) {
          // Network error, keep in queue for retry
          const updatedRequest = { ...request, retryCount: request.retryCount + 1 };

          if (updatedRequest.retryCount < MAX_RETRY_COUNT) {
            failedRequests.push(updatedRequest);
          }

          if (__DEV__) {
            // Error processing offline request
          }
        }
      }

      // Update queue with failed requests
      if (failedRequests.length > 0) {
        setOfflineQueue(failedRequests);
      }
    } finally {
      setProcessingQueue(false);
    }
  }, [offlineQueue, isConnected, processingQueue]);

  const processOfflineRequest = async (request: OfflineRequest): Promise<Response> => {
    const { method, url, data } = request;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add any auth headers from storage
      },
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = JSON.stringify(data);
    }

    return fetch(url, options);
  };

  const clearOfflineQueue = useCallback(async () => {
    setOfflineQueue([]);
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }, []);

  const value: NetworkContextType = {
    isConnected,
    isInternetReachable,
    networkType,
    isOffline: !isConnected,
    connectionQuality,
    offlineQueue,
    addToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};