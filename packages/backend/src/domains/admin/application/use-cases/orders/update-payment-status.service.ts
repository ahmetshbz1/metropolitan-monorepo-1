import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { orders, users } from "../../../../../shared/infrastructure/database/schema";

type ManualPaymentStatus =
  | "pending"
  | "processing"
  | "requires_action"
  | "completed"
  | "succeeded"
  | "failed"
  | "canceled";

interface UpdateOrderPaymentStatusInput {
  orderId: string;
  paymentStatus: ManualPaymentStatus;
}

export class UpdateOrderPaymentStatusService {
  private static readonly allowedStatuses: ReadonlySet<ManualPaymentStatus> = new Set([
    "pending",
    "processing",
    "requires_action",
    "completed",
    "succeeded",
    "failed",
    "canceled",
  ]);

  private static readonly successStatuses: ReadonlySet<ManualPaymentStatus> = new Set([
    "completed",
    "succeeded",
  ]);

  static async execute(input: UpdateOrderPaymentStatusInput): Promise<{ success: boolean; message: string }> {
    const { orderId, paymentStatus } = input;

    if (!this.allowedStatuses.has(paymentStatus)) {
      throw new Error("Geçersiz ödeme durumu seçildi");
    }

    const [order] = await db
      .select({
        id: orders.id,
        paymentMethodType: orders.paymentMethodType,
        userType: users.userType,
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error("Sipariş bulunamadı");
    }

    if (order.paymentMethodType !== "bank_transfer") {
      throw new Error("Sadece banka havalesi ödemelerinin durumu manuel güncellenebilir");
    }

    if (order.userType !== "corporate") {
      throw new Error("Yalnızca kurumsal müşterilerin ödemeleri güncellenebilir");
    }

    const updateData: Record<string, unknown> = {
      paymentStatus,
      updatedAt: new Date(),
    };

    if (this.successStatuses.has(paymentStatus)) {
      updateData.paidAt = new Date();
    } else {
      updateData.paidAt = null;
    }

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));

    return {
      success: true,
      message: "Ödeme durumu güncellendi",
    };
  }
}

