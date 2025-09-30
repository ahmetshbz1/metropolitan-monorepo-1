//  "send-push-test.ts"
//  Send real push notifications using PushNotificationService

import { PushNotificationService } from "./shared/application/services/push-notification.service";
import { db } from "./shared/infrastructure/database/connection";
import { users, deviceTokens } from "./shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";

async function sendRealPushNotifications() {
  // Test user ID
  const userId = "96d9a2e4-3e06-46ce-bd23-db7da7271776";

  // ExponentPushToken tokenınızı buraya manuel ekleyin
  const yourToken = "ExponentPushToken[kDJHFDEjaJNZ9drwfUOpKl]";

  // Önce device token'ı veritabanına kaydet
  try {
    // Mevcut token kontrolü
    const existingToken = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.userId, userId))
      .limit(1);

    if (existingToken.length === 0) {
      // Token yoksa ekle
      await db.insert(deviceTokens).values({
        userId: userId,
        token: yourToken,
        platform: "ios",
        deviceName: "Test Device",
        isValid: "true",
        failureCount: "0",
      });
      console.log("✅ Device token kaydedildi");
    } else {
      // Token varsa güncelle
      await db
        .update(deviceTokens)
        .set({
          token: yourToken,
          isValid: "true",
          failureCount: "0",
          updatedAt: new Date(),
        })
        .where(eq(deviceTokens.userId, userId));
      console.log("✅ Device token güncellendi");
    }

    // İlk push gönder
    console.log("\n📱 İlk push gönderiliyor...");
    const result1 = await PushNotificationService.sendToUser(userId, {
      title: "Selam Umut",
      body: "TestFlight'a hoş geldin! Metropolitan uygulamasını test edebilirsin.",
      type: "test",
      data: {
        screen: "/(tabs)/notifications",
        test: true,
        timestamp: new Date().toISOString(),
      },
      badge: 1,
    });
    console.log("İlk push sonucu:", result1);

    // 2 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 2000));

    // İkinci push gönder
    console.log("\n📱 İkinci push gönderiliyor...");
    const result2 = await PushNotificationService.sendToUser(userId, {
      title: "Yeni Siparişler",
      body: "Uygulamada yeni ürünler var, keşfetmeye başla!",
      type: "test",
      data: {
        screen: "/(tabs)/notifications",
        test: true,
        timestamp: new Date().toISOString(),
      },
      badge: 2,
    });
    console.log("İkinci push sonucu:", result2);

    console.log("\n✨ Push'lar gönderildi ve veritabanına kaydedildi!");
  } catch (error) {
    console.error("❌ Hata:", error);
  } finally {
    process.exit(0);
  }
}

sendRealPushNotifications();