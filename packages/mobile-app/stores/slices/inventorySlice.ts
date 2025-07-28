//  "inventorySlice.ts"
//  metropolitan app
//  Created by Claude on 28.07.2025.

import { StateCreator } from 'zustand';
import { EcommerceStore, InventorySlice } from '../types';

export const createInventorySlice: StateCreator<
  EcommerceStore,
  [],
  [],
  InventorySlice & {
    connectInventorySocket: () => WebSocket | null;
    validateCartStock: () => void;
    handlePriceUpdates: (productId: string) => void;
  }
> = (set, get) => ({
  // Inventory state
  stockLevels: {},
  reservations: {},
  priceUpdates: {},
  connected: false,

  // Connect to WebSocket for real-time inventory updates
  connectInventorySocket: () => {
    const wsUrl = process.env.EXPO_PUBLIC_WS_URL;
    if (!wsUrl) {
      console.warn('WebSocket URL not configured');
      return null;
    }

    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Inventory WebSocket connected');
        set({ connected: true });
        
        // Subscribe to inventory updates
        ws.send(JSON.stringify({
          type: 'SUBSCRIBE',
          channel: 'inventory_updates',
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'STOCK_UPDATE':
              handleStockUpdate(data);
              break;
              
            case 'PRICE_UPDATE':
              handlePriceUpdate(data);
              break;
              
            case 'RESERVATION_CONFIRMED':
              handleReservationConfirmed(data);
              break;
              
            case 'RESERVATION_EXPIRED':
              handleReservationExpired(data);
              break;
              
            default:
              console.log('Unknown inventory message type:', data.type);
          }
        } catch (error) {
          console.warn('Failed to parse inventory WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Inventory WebSocket disconnected');
        set({ connected: false });
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          get().connectInventorySocket();
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('Inventory WebSocket error:', error);
        set({ connected: false });
      };

      return ws;

    } catch (error) {
      console.error('Failed to connect to inventory WebSocket:', error);
      return null;
    }
  },

  // Validate cart items against current stock levels
  validateCartStock: () => {
    const { items, stockLevels } = get();
    const invalidItems: Array<any> = [];

    items.forEach(item => {
      const currentStock = stockLevels[item.productId];
      
      if (currentStock !== undefined && currentStock < item.quantity) {
        invalidItems.push({
          ...item,
          availableStock: currentStock,
        });
      }
    });

    if (invalidItems.length > 0) {
      set({
        stockValidation: {
          hasInvalidItems: true,
          invalidItems,
          validatedAt: new Date().toISOString(),
        },
      });

      // Notify user about stock issues
      console.warn('Stock validation failed for items:', invalidItems);
    } else {
      set({
        stockValidation: {
          hasInvalidItems: false,
          invalidItems: [],
          validatedAt: new Date().toISOString(),
        },
      });
    }
  },

  // Handle price updates in cart items
  handlePriceUpdates: (productId: string) => {
    const { items, priceUpdates } = get();
    const cartItem = items.find(item => item.productId === productId);
    const priceUpdate = priceUpdates[productId];

    if (cartItem && priceUpdate) {
      // Create notification about price change
      const notification = {
        id: `price-update-${productId}`,
        type: 'PRICE_CHANGE' as const,
        title: 'Fiyat Değişikliği',
        message: `${cartItem.product?.name} ürününün fiyatı değişti`,
        data: {
          productId,
          oldPrice: priceUpdate.oldPrice,
          newPrice: priceUpdate.newPrice,
          cartItemId: cartItem.id,
        },
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Add to notifications (assuming notifications slice exists)
      const currentNotifications = (get() as any).notifications || [];
      set({ notifications: [notification, ...currentNotifications] });

      console.log('Price change notification created:', notification);
    }
  },
});

// Helper functions for WebSocket message handling
const handleStockUpdate = (data: any) => {
  const { set, get } = arguments as any;
  
  set((state: any) => ({
    stockLevels: {
      ...state.stockLevels,
      [data.productId]: data.newStock,
    },
  }));
  
  // Validate cart after stock update
  get().validateCartStock();
};

const handlePriceUpdate = (data: any) => {
  const { set, get } = arguments as any;
  
  set((state: any) => ({
    priceUpdates: {
      ...state.priceUpdates,
      [data.productId]: {
        oldPrice: data.oldPrice,
        newPrice: data.newPrice,
        updatedAt: data.timestamp,
      },
    },
  }));
  
  // Handle price updates in cart
  get().handlePriceUpdates(data.productId);
};

const handleReservationConfirmed = (data: any) => {
  const { set } = arguments as any;
  
  set((state: any) => {
    const newReservations = { ...state.reservations };
    delete newReservations[`${data.userId}:${data.productId}`];
    
    return {
      reservations: newReservations,
    };
  });
};

const handleReservationExpired = (data: any) => {
  const { set } = arguments as any;
  
  set((state: any) => {
    const newReservations = { ...state.reservations };
    delete newReservations[`${data.userId}:${data.productId}`];
    
    return {
      reservations: newReservations,
      stockLevels: {
        ...state.stockLevels,
        [data.productId]: (state.stockLevels[data.productId] || 0) + data.quantity,
      },
    };
  });
};