import { and, eq, lt, sql } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import {
  cartItems,
  users,
  deviceTokens,
} from "../../../../shared/infrastructure/database/schema";
import { PushNotificationService } from "../../../../shared/application/services/push-notification.service";
import { getNotificationTranslation } from "../../../../shared/application/services/notification-translations";

export interface AbandonedCartReminderOptions {
  abandonedHours?: number;
  limit?: number;
}

export class AbandonedCartReminderService {
  /**
   * Unutulan sepetleri bulur ve kullanıcılara bildirim gönderir
   */
  static async sendReminders(
    options: AbandonedCartReminderOptions = {}
  ): Promise<{
    success: boolean;
    processedUsers: number;
    sentNotifications: number;
    errors: number;
  }> {
    try {
      const { abandonedHours = 24, limit = 100 } = options;

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - abandonedHours);

      console.log(`Abandoned Cart Reminder: Sepetler kontrol ediliyor (${abandonedHours} saat önce)`);

      const abandonedCarts = await db
        .select({
          userId: cartItems.userId,
          userEmail: users.email,
          userName: sql<string>`COALESCE(CONCAT(${users.firstName}, ' ', ${users.lastName}), ${users.firstName}, ${users.lastName})`,
          lastUpdatedAt: sql<Date>`MAX(${cartItems.updatedAt})`,
          itemCount: sql<number>`COUNT(DISTINCT ${cartItems.id})`,
        })
        .from(cartItems)
        .innerJoin(users, eq(cartItems.userId, users.id))
        .groupBy(cartItems.userId, users.email, users.firstName, users.lastName)
        .having(
          and(
            sql`MAX(${cartItems.updatedAt}) < ${cutoffDate}`,
            sql`COUNT(DISTINCT ${cartItems.id}) > 0`
          )
        )
        .limit(limit);

      console.log(`Abandoned Cart Reminder: ${abandonedCarts.length} kullanıcı bulundu`);

      if (abandonedCarts.length === 0) {
        return {
          success: true,
          processedUsers: 0,
          sentNotifications: 0,
          errors: 0,
        };
      }

      let processedUsers = 0;
      let sentNotifications = 0;
      let errors = 0;

      for (const cart of abandonedCarts) {
        try {
          processedUsers++;

          const userDeviceTokens = await db
            .select()
            .from(deviceTokens)
            .where(
              and(
                eq(deviceTokens.userId, cart.userId),
                eq(deviceTokens.isValid, "true")
              )
            );

          if (userDeviceTokens.length === 0) {
            console.log(`Abandoned Cart Reminder: Kullanıcı ${cart.userId} için aktif cihaz token'ı yok`);
            continue;
          }

          for (const token of userDeviceTokens) {
            try {
              const translation = getNotificationTranslation(
                "abandoned_cart_reminder",
                token.language
              );

              const success = await PushNotificationService.sendToUser(
                cart.userId,
                {
                  title: translation.title,
                  body: translation.body,
                  notificationType: "abandoned_cart_reminder",
                  type: "abandoned_cart_reminder",
                  data: {
                    type: "abandoned_cart",
                    userId: cart.userId,
                    itemCount: cart.itemCount,
                  },
                }
              );

              if (success) {
                sentNotifications++;
                console.log(
                  `Abandoned Cart Reminder: Kullanıcı ${cart.userId} (${cart.userEmail}) için bildirim gönderildi - ${cart.itemCount} ürün`
                );
              }
            } catch (tokenError) {
              console.error(
                `Abandoned Cart Reminder: Token ${token.id} için bildirim gönderilemedi:`,
                tokenError
              );
              errors++;
            }
          }
        } catch (userError) {
          console.error(
            `Abandoned Cart Reminder: Kullanıcı ${cart.userId} için hata:`,
            userError
          );
          errors++;
        }
      }

      console.log(
        `Abandoned Cart Reminder Tamamlandı: ${processedUsers} kullanıcı işlendi, ${sentNotifications} bildirim gönderildi, ${errors} hata`
      );

      return {
        success: true,
        processedUsers,
        sentNotifications,
        errors,
      };
    } catch (error) {
      console.error("Abandoned Cart Reminder Service error:", error);
      throw error;
    }
  }
}
