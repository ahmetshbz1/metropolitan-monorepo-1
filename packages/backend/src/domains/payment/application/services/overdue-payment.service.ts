//  "overdue-payment.service.ts"
//  metropolitan backend
//  Vadesi geçmiş ödemeler için bildirim servisi

import { and, eq, lt, isNotNull } from "drizzle-orm";
import { db } from "../../../../shared/infrastructure/database/connection";
import { orders } from "../../../../shared/infrastructure/database/schema";
import { PushNotificationService } from "../../../../shared/application/services/push-notification.service";

export class OverduePaymentService {
  static async checkAndNotifyOverduePayments(): Promise<{
    checked: number;
    notified: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let notified = 0;

    try {
      const today = new Date();

      const overdueOrders = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          orderNumber: orders.orderNumber,
          paymentTermDays: orders.paymentTermDays,
          createdAt: orders.createdAt,
          totalAmount: orders.totalAmount,
          currency: orders.currency,
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentMethodType, "bank_transfer"),
            eq(orders.paymentStatus, "pending"),
            isNotNull(orders.paymentTermDays)
          )
        );

      console.log(`📊 ${overdueOrders.length} adet bank transfer siparişi kontrol ediliyor...`);

      for (const order of overdueOrders) {
        try {
          const dueDate = new Date(order.createdAt);
          dueDate.setDate(dueDate.getDate() + (order.paymentTermDays || 0));

          if (today > dueDate) {
            const daysOverdue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            await PushNotificationService.sendToUser(order.userId, {
              title: "Ödeme Vadesi Geçmiş",
              body: `${order.orderNumber} numaralı siparişinizin ödemesi ${daysOverdue} gün gecikmiş. Lütfen ödemenizi tamamlayın.`,
              type: "payment_overdue",
              data: {
                screen: `/order/${order.id}`,
                orderId: order.id,
                orderNumber: order.orderNumber,
                daysOverdue: daysOverdue,
                amount: order.totalAmount,
                currency: order.currency,
                type: "payment_overdue",
              },
            });

            console.log(`✅ Bildirim gönderildi: ${order.orderNumber} (${daysOverdue} gün gecikmiş)`);
            notified++;
          }
        } catch (error) {
          const errorMsg = `Sipariş ${order.orderNumber} için bildirim gönderilemedi: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      return {
        checked: overdueOrders.length,
        notified,
        errors,
      };
    } catch (error) {
      console.error("Vadesi geçmiş ödeme kontrolü hatası:", error);
      return {
        checked: 0,
        notified: 0,
        errors: [String(error)],
      };
    }
  }
}
