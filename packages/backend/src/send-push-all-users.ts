//  "send-push-all-users.ts"
//  Send push to all users with the same token

import { PushNotificationService } from "./shared/application/services/push-notification.service";
import { db } from "./shared/infrastructure/database/connection";
import { deviceTokens, users } from "./shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";

async function sendPushToAllTokenUsers() {
  const targetToken = "ExponentPushToken[gFM269GGghCrmZDV0RE_u2]";

  try {
    // Bu token'a sahip tüm kullanıcıları bul
    const tokenUsers = await db
      .select({
        userId: deviceTokens.userId,
        phoneNumber: users.phoneNumber,
        email: users.email,
        firstName: users.firstName,
      })
      .from(deviceTokens)
      .innerJoin(users, eq(deviceTokens.userId, users.id))
      .where(eq(deviceTokens.token, targetToken));

    console.log(`\n📱 ${tokenUsers.length} kullanıcıya push gönderiliyor...\n`);

    for (const user of tokenUsers) {
      console.log(`👤 Gönderiliyor: ${user.phoneNumber} (${user.email || 'Email yok'})`);

      const result = await PushNotificationService.sendToUser(user.userId, {
        title: "🎯 Test Push - Tüm Hesaplar",
        body: `${user.firstName}, bildirimler sayfanızı kontrol edin! Bu mesaj ${user.phoneNumber} numaranıza özel.`,
        type: "system",
        data: {
          screen: "/notifications",
          userId: user.userId,
          timestamp: new Date().toISOString(),
        },
        badge: 10,
      });

      console.log(`  ✅ Sonuç: ${result ? 'Başarılı' : 'Başarısız'}\n`);

      // Biraz bekle
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("✨ Tüm hesaplara push gönderildi ve veritabanına kaydedildi!");
    console.log("📱 Hangi hesapla giriş yaptıysanız, o hesabın bildirimler sayfasında göreceksiniz.");

  } catch (error) {
    console.error("❌ Hata:", error);
  } finally {
    process.exit(0);
  }
}

sendPushToAllTokenUsers();