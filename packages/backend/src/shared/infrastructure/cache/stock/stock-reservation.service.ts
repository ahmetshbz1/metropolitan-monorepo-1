//  "stock-reservation.service.ts"
//  metropolitan backend
//  Focused service for atomic stock reservation operations
//  Extracted from redis-stock.service.ts (lines 28-214)

import { redis } from "../../database/redis";
import { logger } from "../../monitoring/logger.config";

import { REDIS_STOCK_CONFIG, type ReservationResult, type StockReservation } from "./stock-config";

export class StockReservationService {
  private static readonly LOCK_TIMEOUT = REDIS_STOCK_CONFIG.LOCK_TIMEOUT_MS;
  private static readonly STOCK_PREFIX = REDIS_STOCK_CONFIG.KEY_PREFIXES.STOCK;
  private static readonly LOCK_PREFIX = REDIS_STOCK_CONFIG.KEY_PREFIXES.LOCK;
  private static readonly RESERVATION_PREFIX = REDIS_STOCK_CONFIG.KEY_PREFIXES.RESERVATION;

  /**
   * Atomic stock reservation with distributed locking
   * Prevents race conditions across multiple server instances
   */
  static async reserveStockAtomic(
    productId: string,
    userId: string,
    quantity: number
  ): Promise<ReservationResult> {
    const lockKey = `${this.LOCK_PREFIX}${productId}`;
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    const reservationKey = `${this.RESERVATION_PREFIX}${userId}:${productId}`;

    // 1. Acquire distributed lock
    const lockAcquired = await redis.set(
      lockKey,
      userId,
      "PX",
      this.LOCK_TIMEOUT,
      "NX"
    );

    if (!lockAcquired) {
      return {
        success: false,
        error: "Another user is currently processing this product. Please try again.",
      };
    }

    try {
      // 2. Get current stock from Redis, if not exists load from database
      const availableStock = await this.getCurrentAvailableStock(productId, stockKey);

      logger.debug("Lock acquired for product", { userId, productId });
      logger.debug("Stock check", { productId, availableStock, requestedQuantity: quantity });

      // 3. Check if sufficient stock available
      if (availableStock < quantity) {
        return {
          success: false,
          error: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
        };
      }

      // 4. Reserve stock atomically
      const newStock = await redis.decrby(stockKey, quantity);

      // 5. Store reservation info (for rollback)
      await this.storeReservationInfo(reservationKey, productId, userId, quantity);

      logger.info("Stock reserved successfully", { productId, userId, quantity, remainingStock: newStock });

      return {
        success: true,
        remainingStock: newStock,
      };
    } finally {
      // 6. Always release the lock
      await redis.del(lockKey);
      logger.debug("Lock released for product", { productId });
    }
  }

  /**
   * Rollback stock reservation (payment failed)
   */
  static async rollbackReservation(
    userId: string,
    productId: string
  ): Promise<void> {
    const stockKey = `${this.STOCK_PREFIX}${productId}`;
    const reservationKey = `${this.RESERVATION_PREFIX}${userId}:${productId}`;

    try {
      // Get reservation details
      const reservationData = await redis.get(reservationKey);
      if (!reservationData) {
        logger.warn("No reservation found for rollback", { userId, productId });
        return;
      }

      const reservation: StockReservation = JSON.parse(reservationData);

      // Return stock to Redis
      const newStock = await redis.incrby(stockKey, reservation.quantity);

      // Mark reservation as rolled back
      await redis.setex(
        reservationKey,
        REDIS_STOCK_CONFIG.RESERVATION_TTL_SECONDS,
        JSON.stringify({
          ...reservation,
          status: "rolled_back",
          rolledBackAt: new Date().toISOString(),
        })
      );

      logger.info("Stock rolled back successfully", {
        userId,
        productId,
        quantity: reservation.quantity,
        newStock
      });
    } catch (error) {
      logger.error("Failed to rollback reservation", {
        userId,
        productId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Confirm stock reservation (payment successful)
   */
  static async confirmReservation(
    userId: string,
    productId: string
  ): Promise<void> {
    const reservationKey = `${this.RESERVATION_PREFIX}${userId}:${productId}`;

    try {
      const reservationData = await redis.get(reservationKey);
      if (!reservationData) {
        logger.warn("No reservation found for confirmation", { userId, productId });
        return;
      }

      const reservation: StockReservation = JSON.parse(reservationData);

      // Mark reservation as confirmed
      await redis.setex(
        reservationKey,
        86400, // Keep for 24h for audit
        JSON.stringify({
          ...reservation,
          status: "confirmed",
          confirmedAt: new Date().toISOString(),
        })
      );

      logger.info("Reservation confirmed successfully", { userId, productId });
    } catch (error) {
      logger.error("Failed to confirm reservation", {
        userId,
        productId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Helper: Get current available stock, load from DB if not in Redis
   */
  private static async getCurrentAvailableStock(
    productId: string,
    stockKey: string
  ): Promise<number> {
    const currentStock = await redis.get(stockKey);
    let availableStock = currentStock ? parseInt(currentStock) : null;

    // If stock not in Redis, load from database
    if (availableStock === null) {
      logger.debug("Stock not found in Redis, loading from database", { productId });

      try {
        const { db } = await import("../../database/connection");
        const { products } = await import("../../database/schema");
        const { eq } = await import("drizzle-orm");

        const product = await db.query.products.findFirst({
          where: eq(products.id, productId),
          columns: { stock: true }
        });

        if (product) {
          availableStock = product.stock || 0;
          // Set stock in Redis for future use
          await redis.set(stockKey, availableStock.toString());
          logger.info("Stock loaded from database", { productId, availableStock });
        } else {
          logger.warn("Product not found in database", { productId });
          availableStock = 0;
        }
      } catch (dbError) {
        logger.error("Database error loading stock", {
          productId,
          error: dbError instanceof Error ? dbError.message : String(dbError)
        });
        availableStock = 0;
      }
    }

    return availableStock;
  }

  /**
   * Helper: Store reservation information in Redis
   */
  private static async storeReservationInfo(
    reservationKey: string,
    productId: string,
    userId: string,
    quantity: number
  ): Promise<void> {
    const reservation: StockReservation = {
      productId,
      userId,
      quantity,
      reservedAt: new Date().toISOString(),
      status: "reserved",
    };

    await redis.setex(
      reservationKey,
      REDIS_STOCK_CONFIG.RESERVATION_TTL_SECONDS,
      JSON.stringify(reservation)
    );
  }
}