import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { orders } from "../../../../../shared/infrastructure/database/schema";

export interface UpdateOrderStatusInput {
  orderId: string;
  status: string;
  trackingNumber?: string;
  shippingCompany?: string;
  cancelReason?: string;
  estimatedDelivery?: string;
  notes?: string;
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

    const sanitizedTrackingNumber =
      typeof trackingNumber === "string" ? trackingNumber.trim() : undefined;
    const sanitizedShippingCompany =
      typeof shippingCompany === "string" ? shippingCompany.trim() : undefined;
    const sanitizedNotes = typeof notes === "string" ? notes.trim() : undefined;
    const sanitizedCancelReason =
      typeof cancelReason === "string" ? cancelReason.trim() : undefined;

    if (trackingNumber !== undefined) {
      updateData.trackingNumber =
        sanitizedTrackingNumber && sanitizedTrackingNumber.length > 0
          ? sanitizedTrackingNumber
          : null;
    }

    if (shippingCompany !== undefined) {
      updateData.shippingCompany =
        sanitizedShippingCompany && sanitizedShippingCompany.length > 0
          ? sanitizedShippingCompany
          : null;
    }

    if (estimatedDelivery !== undefined) {
      updateData.estimatedDelivery = estimatedDelivery
        ? new Date(estimatedDelivery)
        : null;
    }

    if (notes !== undefined) {
      updateData.notes =
        sanitizedNotes && sanitizedNotes.length > 0 ? sanitizedNotes : null;
    }

    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
      updateData.cancelReason =
        sanitizedCancelReason && sanitizedCancelReason.length > 0
          ? sanitizedCancelReason
          : null;
    } else if (cancelReason !== undefined) {
      updateData.cancelReason =
        sanitizedCancelReason && sanitizedCancelReason.length > 0
          ? sanitizedCancelReason
          : null;
      if (!sanitizedCancelReason) {
        updateData.cancelledAt = null;
      }
    }

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));

    return {
      success: true,
      message: "Order status updated successfully",
    };
  }
}
