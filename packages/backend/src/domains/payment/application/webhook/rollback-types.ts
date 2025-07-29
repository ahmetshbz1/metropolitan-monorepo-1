//  "rollback-types.ts"
//  metropolitan backend
//  Type definitions for rollback operations

export interface RollbackResult {
  success: boolean;
  method: "redis" | "database" | "both" | "none";
  itemsRolledBack: number;
  errors: string[];
}

export interface RollbackStrategy {
  rollback(
    orderDetails: Array<{
      userId: string;
      productId: string;
      quantity: number;
    }>
  ): Promise<RollbackResult>;

  verify?(
    orderDetails: Array<{ productId: string }>
  ): Promise<{
    verified: boolean;
    stockLevels: Array<{
      productId: string;
      currentStock: number;
    }>;
  }>;
}

export interface StockVerificationResult {
  verified: boolean;
  currentStockLevels: Array<{
    productId: string;
    currentStock: number;
    reservations: number;
  }>;
  message: string;
}