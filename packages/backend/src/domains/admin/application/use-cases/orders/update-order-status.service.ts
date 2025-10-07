import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { orders } from "../../../../../shared/infrastructure/database/schema";

export interface UpdateOrderStatusInput {
  orderId: string;
  status: string;
  trackingNumber?: string;
  shippingCompany?: string;
  cancelReason?: string;
}

export class UpdateOrderStatusService {
  static async execute(input: UpdateOrderStatusInput): Promise<{ success: boolean; message: string }> {
    const { orderId, status, trackingNumber, shippingCompany, cancelReason } = input;

    const validStatuses = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid order status");
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (status === "shipped" && trackingNumber) {
      updateData.trackingNumber = trackingNumber;
      updateData.shippingCompany = shippingCompany || "DHL Express";
    }

    if (status === "cancelled") {
      updateData.cancelledAt = new Date();
      if (cancelReason) {
        updateData.cancelReason = cancelReason;
      }
    }

    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));

    return {
      success: true,
      message: "Order status updated successfully",
    };
  }
}
