//  "check-token-users.ts"
//  Check which users have this device token

import { db } from "./shared/infrastructure/database/connection";
import { deviceTokens, users } from "./shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";

async function checkTokenUsers() {
  const targetToken = "ExponentPushToken[gFM269GGghCrmZDV0RE_u2]";

  try {
    // Bu token'a sahip tüm kullanıcıları bul
    const results = await db
      .select({
        userId: deviceTokens.userId,
        token: deviceTokens.token,
        phoneNumber: users.phoneNumber,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(deviceTokens)
      .innerJoin(users, eq(deviceTokens.userId, users.id))
      .where(eq(deviceTokens.token, targetToken));

    console.log(`\n📱 Token: ${targetToken}`);
    console.log(`\n👥 Bu token'a sahip ${results.length} kullanıcı bulundu:\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. Kullanıcı:`);
      console.log(`   ID: ${result.userId}`);
      console.log(`   Ad: ${result.firstName} ${result.lastName}`);
      console.log(`   Telefon: ${result.phoneNumber}`);
      console.log(`   Email: ${result.email || 'Yok'}`);
      console.log('---');
    });

    // Son bildirimleri kontrol et
    console.log("\n📬 Son eklenen bildirimler:\n");

    const { notifications } = await import("./shared/infrastructure/database/schema");
    const recentNotifications = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        title: notifications.title,
        body: notifications.body,
        createdAt: notifications.createdAt,
        phoneNumber: users.phoneNumber,
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.userId, users.id))
      .orderBy(notifications.createdAt)
      .limit(10);

    recentNotifications.forEach(notif => {
      console.log(`- ${notif.title} (${notif.phoneNumber})`);
      console.log(`  Kullanıcı ID: ${notif.userId}`);
      console.log(`  Tarih: ${notif.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error("❌ Hata:", error);
  } finally {
    process.exit(0);
  }
}

checkTokenUsers();