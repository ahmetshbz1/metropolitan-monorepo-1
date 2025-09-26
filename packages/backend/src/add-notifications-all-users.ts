//  "add-notifications-all-users.ts"
//  Add test notifications to ALL users

import { db } from "./shared/infrastructure/database/connection";
import { notifications, users } from "./shared/infrastructure/database/schema";

async function addNotificationsToAllUsers() {
  try {
    // Tüm kullanıcıları al
    const allUsers = await db
      .select({ id: users.id, phoneNumber: users.phoneNumber })
      .from(users);

    console.log(`📱 ${allUsers.length} kullanıcı bulundu`);

    const testNotifications = [
      {
        title: "🎉 Metropolitan'e Hoş Geldiniz!",
        body: "Uygulamamızı kullandığınız için teşekkürler. Su ihtiyacınız için buradayız!",
        type: "welcome",
        data: { screen: "/(tabs)" },
        source: "push",
        isRead: false,
      },
      {
        title: "💧 Yeni Ürünler",
        body: "19L damacana sularımızda %15 indirim başladı!",
        type: "promotion",
        data: { screen: "/(tabs)/products" },
        source: "push",
        isRead: false,
      },
    ];

    for (const user of allUsers) {
      console.log(`\n👤 ${user.phoneNumber} için bildirimler ekleniyor...`);

      for (const notification of testNotifications) {
        await db.insert(notifications).values({
          ...notification,
          userId: user.id,
        });
      }

      console.log(`✅ ${user.phoneNumber} için ${testNotifications.length} bildirim eklendi`);
    }

    console.log(`\n✨ Toplam ${allUsers.length * testNotifications.length} bildirim eklendi!`);
  } catch (error) {
    console.error("❌ Hata:", error);
  } finally {
    process.exit(0);
  }
}

addNotificationsToAllUsers();