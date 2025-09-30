//  "send-real-push.ts"
//  Send push notifications that will be saved to database

import { PushNotificationService } from "./shared/application/services/push-notification.service";
import { db } from "./shared/infrastructure/database/connection";
import { users } from "./shared/infrastructure/database/schema";

async function sendRealPushNotifications() {
  try {
    // Senin kullanıcını bul (Apple login)
    const [user] = await db
      .select({ id: users.id, phoneNumber: users.phoneNumber, email: users.email })
      .from(users)
      .where(sql`${users.email} = 'arasayzt@icloud.com'`)
      .limit(1);

    if (!user) {
      console.error("❌ Kullanıcı bulunamadı!");
      process.exit(1);
    }

    console.log(`📱 Kullanıcı bulundu: ${user.email} (${user.id})`);

    // İlk push
    console.log("\n🚀 İlk push gönderiliyor...");
    const result1 = await PushNotificationService.sendToUser(user.id, {
      title: "Yeni Siparişiniz Var!",
      body: "Siparişiniz başarıyla oluşturuldu ve hazırlanıyor.",
      type: "order",
      data: {
        screen: "/notifications",
        orderId: "test-order-123",
        timestamp: new Date().toISOString(),
      },
      badge: 5,
    });
    console.log("İlk push sonucu:", result1);

    // 2 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 2000));

    // İkinci push
    console.log("\n💎 İkinci push gönderiliyor...");
    const result2 = await PushNotificationService.sendToUser(user.id, {
      title: "Özel İndirim!",
      body: "Size özel %25 indirim kodu: METRO25 - Hemen kullanın!",
      type: "promotion",
      data: {
        screen: "/(tabs)/products",
        promoCode: "METRO25",
        discount: 25,
        timestamp: new Date().toISOString(),
      },
      badge: 6,
    });
    console.log("İkinci push sonucu:", result2);

    console.log("\n✨ Push'lar hem gönderildi hem veritabanına kaydedildi!");
    console.log("📱 Bildirimler sayfasını yenileyerek görebilirsiniz.");
  } catch (error) {
    console.error("❌ Hata:", error);
  } finally {
    process.exit(0);
  }
}

import { sql } from "drizzle-orm";
sendRealPushNotifications();