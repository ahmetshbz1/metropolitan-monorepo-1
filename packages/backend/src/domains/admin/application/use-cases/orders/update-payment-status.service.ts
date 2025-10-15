import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  orders,
  users,
} from "../../../../../shared/infrastructure/database/schema";
import { PushNotificationService } from "../../../../../shared/application/services/push-notification.service";

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
  private static readonly allowedStatuses: ReadonlySet<ManualPaymentStatus> =
    new Set([
      "pending",
      "processing",
      "requires_action",
      "completed",
      "succeeded",
      "failed",
      "canceled",
    ]);

  private static readonly successStatuses: ReadonlySet<ManualPaymentStatus> =
    new Set(["completed", "succeeded"]);

  static async execute(
    input: UpdateOrderPaymentStatusInput
  ): Promise<{ success: boolean; message: string }> {
    const { orderId, paymentStatus } = input;

    if (!this.allowedStatuses.has(paymentStatus)) {
      throw new Error("Geçersiz ödeme durumu seçildi");
    }

    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
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
      throw new Error(
        "Sadece banka havalesi ödemelerinin durumu manuel güncellenebilir"
      );
    }

    if (order.userType !== "corporate") {
      throw new Error(
        "Yalnızca kurumsal müşterilerin ödemeleri güncellenebilir"
      );
    }

    const updateData: Record<string, unknown> = {
      paymentStatus,
      updatedAt: new Date(),
    };

    const wasSuccessful = this.successStatuses.has(paymentStatus);

    if (wasSuccessful) {
      updateData.paidAt = new Date();
      updateData.status = "confirmed"; // Ödeme onaylandığında sipariş durumunu confirmed yap
    } else {
      updateData.paidAt = null;
    }

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));

    // Ödeme başarılı olduğunda fatura oluştur ve bildirim gönder (Stripe gibi)
    if (wasSuccessful) {
      // Push notification gönder
      try {
        await PushNotificationService.sendToUser(order.userId, {
          customTranslations: {
            tr: {
              title: "Ödeme Onaylandı",
              body: `${order.orderNumber} numaralı siparişinizin ödemesi onaylandı. Siparişiniz hazırlanıyor.`,
            },
            en: {
              title: "Payment Approved",
              body: `Payment for order ${order.orderNumber} has been approved. Your order is being prepared.`,
            },
            pl: {
              title: "Płatność Zatwierdzona",
              body: `Płatność za zamówienie ${order.orderNumber} została zatwierdzona. Twoje zamówienie jest przygotowywane.`,
            },
          },
          type: "payment_success",
          data: {
            screen: `/order/${order.id}`,
            orderId: order.id,
            orderNumber: order.orderNumber,
            type: "payment_success",
          },
        });
        console.log(
          `📱 Bank transfer payment approved notification sent for order ${order.orderNumber}`
        );
      } catch (error) {
        console.error("Failed to send payment approval notification:", error);
      }

      // Fatura oluştur (async - background'da)
      this.generateInvoiceInBackground(orderId, order.userId);
    }

    return {
      success: true,
      message: "Ödeme durumu güncellendi",
    };
  }

  /**
   * Arka planda fatura oluştur (async)
   */
  private static generateInvoiceInBackground(
    orderId: string,
    userId: string
  ): void {
    // Async olarak çalıştır, hata durumunda log'la
    (async () => {
      try {
        console.log(
          `📄 Generating invoice for bank transfer order ${orderId}...`
        );
        const { InvoiceService } = await import(
          "../../../../order/application/use-cases/invoice.service"
        );
        await InvoiceService.generateInvoicePDF(orderId, userId);
        console.log(`✅ Invoice generated successfully for order ${orderId}`);
      } catch (error) {
        console.error(
          `❌ Failed to generate invoice for order ${orderId}:`,
          error
        );
      }
    })();
  }
}
