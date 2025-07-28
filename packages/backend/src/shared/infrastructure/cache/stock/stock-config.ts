//  "stock-config.ts"
//  metropolitan backend  
//  Stock management configuration and shared types
//  Extracted from redis-stock.service.ts for better modularity

export const REDIS_STOCK_CONFIG = {
  LOCK_TIMEOUT_MS: 5000, // 5 seconds
  RESERVATION_TTL_SECONDS: 3600, // 1 hour
  KEY_PREFIXES: {
    STOCK: "stock:",
    LOCK: "stock_lock:",
    RESERVATION: "reservation:",
  },
} as const;

export interface StockReservation {
  productId: string;
  userId: string;
  quantity: number;
  reservedAt: string;
  status: "reserved" | "confirmed" | "rolled_back";
  confirmedAt?: string;
  rolledBackAt?: string;
}

export interface ReservationResult {
  success: boolean;
  remainingStock?: number;
  error?: string;
}

export interface StockActivity {
  productId: string;
  userId: string;
  quantity: number;
  reservedAt: string;
  status: string;
  confirmedAt?: string;  
  rolledBackAt?: string;
}