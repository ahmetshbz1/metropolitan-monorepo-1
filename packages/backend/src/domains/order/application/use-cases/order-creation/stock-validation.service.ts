//  "stock-validation.service.ts"
//  metropolitan backend
//  Stock validation logic separated from StockManagementService

import type { OrderItem as OrderItemData } from "@metropolitan/shared/types/order";
import { eq } from "drizzle-orm";
import { products } from "../../../../../shared/infrastructure/database/schema";

export class StockValidationService {
  /**
   * Validates if requested quantities are available in stock
   */
  static async validateStockAvailability(
    tx: any,
    orderItemsData: OrderItemData[]
  ): Promise<{
    valid: boolean;
    insufficientItems: Array<{
      productId: string;
      productName: string;
      requested: number;
      available: number;
    }>;
  }> {
    const insufficientItems: Array<{
      productId: string;
      productName: string;
      requested: number;
      available: number;
    }> = [];

    for (const item of orderItemsData) {
      const [product] = await tx
        .select({
          id: products.id,
          name: products.name,
          stock: products.stock,
        })
        .from(products)
        .where(eq(products.id, item.product.id))
        .limit(1);

      if (!product || product.stock < item.quantity) {
        insufficientItems.push({
          productId: item.product.id,
          productName: product?.name || `Product ${item.product.id}`,
          requested: item.quantity,
          available: product?.stock || 0,
        });
      }
    }

    return {
      valid: insufficientItems.length === 0,
      insufficientItems,
    };
  }

  /**
   * Creates insufficient stock error with detailed information
   */
  static createInsufficientStockError(
    productId: string,
    error?: string
  ): Error {
    return new Error(
      JSON.stringify({
        code: "INSUFFICIENT_STOCK",
        message: "Stok yetersiz",
        productId,
        error,
      })
    );
  }
}