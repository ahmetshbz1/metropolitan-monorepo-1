import { eq } from "drizzle-orm";

import { logger } from "../../../../../shared/infrastructure/monitoring/logger.config";
import { db } from "../../../../../shared/infrastructure/database/connection";
import { orders } from "../../../../../shared/infrastructure/database/schema";
import { WebhookStockRollbackService } from "../../../../payment/application/webhook/stock-rollback.service";

export interface UpdateOrderStatusInput {
  orderId: string;
  status: string;
  trackingNumber?: string | null;
  shippingCompany?: string | null;
  cancelReason?: string | null;
  estimatedDelivery?: string | null;
  notes?: string | null;
}

export class UpdateOrderStatusService {
  static async execute(
    input: UpdateOrderStatusInput
  ): Promise<{ success: boolean; message: string }> {
    const {
      orderId,
      status,
      trackingNumber,
      shippingCompany,
      cancelReason,
      estimatedDelivery,
      notes,
    } = input;

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid order status");
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    const sanitizeOptionalString = (
      value: string | null | undefined
    ): string | null | undefined => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const sanitizedTrackingNumber = sanitizeOptionalString(trackingNumber);
    if (sanitizedTrackingNumber !== undefined) {
      updateData.trackingNumber = sanitizedTrackingNumber;
    }

    const sanitizedShippingCompany = sanitizeOptionalString(shippingCompany);
    if (sanitizedShippingCompany !== undefined) {
      updateData.shippingCompany = sanitizedShippingCompany;
    }

    if (estimatedDelivery !== undefined) {
      if (estimatedDelivery === null) {
        updateData.estimatedDelivery = null;
      } else {
        const parsedDate = new Date(estimatedDelivery);
        if (Number.isNaN(parsedDate.getTime())) {
          throw new Error("Invalid estimated delivery date");
        }
        updateData.estimatedDelivery = parsedDate;
      }
    }

    const sanitizedNotes = sanitizeOptionalString(notes);
    if (sanitizedNotes !== undefined) {
      updateData.notes = sanitizedNotes;
    }

    const sanitizedCancelReason = sanitizeOptionalString(cancelReason);

    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = sanitizedCancelReason ?? null;
    } else if (sanitizedCancelReason !== undefined) {
      updateData.cancelReason = sanitizedCancelReason;
      if (sanitizedCancelReason === null) {
        updateData.cancelledAt = null;
      }
    }

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));

    // Sipariş iptal ediliyorsa stokları geri ekle
    if (status === "cancelled") {
      try {
        logger.info({ orderId, context: "UpdateOrderStatusService" }, "Sipariş iptal edildi, stoklar geri ekleniyor");
        const rollbackResult = await WebhookStockRollbackService.rollbackOrderStock(orderId);

        if (rollbackResult.success) {
          logger.info({ orderId, message: rollbackResult.message, context: "UpdateOrderStatusService" }, "Stok rollback başarılı");
        } else {
          logger.warn({ orderId, errors: rollbackResult.errors, context: "UpdateOrderStatusService" }, "Stok rollback kısmen başarısız");
          // Stok rollback hatası sipariş iptal işlemini engellemez
        }
      } catch (rollbackError) {
        logger.error({ orderId, error: rollbackError, context: "UpdateOrderStatusService" }, "Stok rollback hatası");
        // Stok rollback hatası sipariş iptal işlemini engellemez
      }
    }

    return {
      success: true,
      message: "Order status updated successfully",
    };
  }
}
