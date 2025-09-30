//  "push-notification.service.ts"
//  metropolitan backend
//  Created by Ahmet on 26.09.2025.

import { db } from "../../infrastructure/database/connection";
import { deviceTokens, notifications } from "../../infrastructure/database/schema";
import { eq, and, sql } from "drizzle-orm";

interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  badge?: number;
  sound?: string;
  type?: string;
}

export class PushNotificationService {
  // Tek bir kullanıcıya bildirim gönder
  static async sendToUser(
    userId: string,
    notification: PushNotificationData
  ): Promise<boolean> {
    try {
      // Kullanıcının aktif token'larını al
      const userTokens = await db
        .select()
        .from(deviceTokens)
        .where(
          and(
            eq(deviceTokens.userId, userId),
            eq(deviceTokens.isValid, "true")
          )
        );

      if (userTokens.length === 0) {
        console.log(`No valid tokens found for user ${userId}`);
        return false;
      }

      // Her token'a push gönder
      const pushPromises = userTokens.map(async (tokenRecord) => {
        try {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: tokenRecord.token,
              title: notification.title,
              body: notification.body,
              data: notification.data || {},
              sound: notification.sound || 'default',
              badge: notification.badge,
            }),
          });

          const result = await response.json();

          if (result.data?.status === 'error') {
            // Token geçersiz, işaretle
            await db
              .update(deviceTokens)
              .set({
                isValid: "false",
                failureCount: sql`${deviceTokens.failureCount}::int + 1`,
                updatedAt: new Date(),
              })
              .where(eq(deviceTokens.id, tokenRecord.id));
          }

          return result;
        } catch (error) {
          console.error(`Failed to send push to token ${tokenRecord.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(pushPromises);
      const successCount = results.filter(r => r?.data?.status === 'ok').length;

      // Bildirimi veritabanına kaydet
      await db.insert(notifications).values({
        userId,
        title: notification.title,
        body: notification.body,
        type: notification.type || 'system',
        data: notification.data || {},
        source: 'push',
        pushId: results[0]?.data?.id, // İlk başarılı push ID'si
      });

      console.log(`Push sent to ${successCount}/${userTokens.length} devices for user ${userId}`);
      return successCount > 0;
    } catch (error) {
      console.error(`Push notification error for user ${userId}:`, error);
      return false;
    }
  }

  // Birden fazla kullanıcıya bildirim gönder
  static async sendToMultipleUsers(
    userIds: string[],
    notification: PushNotificationData
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      const success = await this.sendToUser(userId, notification);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  // Tüm kullanıcılara bildirim gönder (broadcast)
  static async broadcast(
    notification: PushNotificationData
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Tüm aktif token'ları al (unique user'lar için)
      const activeUsers = await db
        .selectDistinct({ userId: deviceTokens.userId })
        .from(deviceTokens)
        .where(eq(deviceTokens.isValid, "true"));

      const userIds = activeUsers.map(u => u.userId);
      return await this.sendToMultipleUsers(userIds, notification);
    } catch (error) {
      console.error('Broadcast error:', error);
      return { sent: 0, failed: 0 };
    }
  }

  // Test bildirimi gönder (backend'den manuel)
  static async sendTestNotification(userId: string): Promise<boolean> {
    return await this.sendToUser(userId, {
      title: 'Test Bildirimi',
      body: 'Bu bir test bildirimidir. Sistem düzgün çalışıyor!',
      type: 'system',
      data: { test: true, timestamp: new Date().toISOString() },
      badge: 1,
    });
  }
}