//  "test-notifications.ts"
//  Test script to add notifications to database

import { db } from "./shared/infrastructure/database/connection";
import { notifications, users } from "./shared/infrastructure/database/schema";
import { sql } from "drizzle-orm";

async function addTestNotifications() {
  // Önce mevcut bir user bul
  const existingUsers = await db
    .select({ id: users.id, phoneNumber: users.phoneNumber })
    .from(users)
    .limit(1);

  if (existingUsers.length === 0) {
    console.error("❌ Veritabanında kullanıcı bulunamadı!");
    process.exit(1);
  }

  const userId = existingUsers[0].id;
  console.log(`📱 Kullanıcı bulundu: ${existingUsers[0].phoneNumber} (${userId})`);


  const testNotifications = [
    {
      userId,
      title: "🛍️ Siparişiniz Hazırlanıyor",
      body: "Metropolitan ekibi siparişinizi özenle hazırlıyor!",
      type: "order_update",
      data: { screen: "/orders" },
      source: "push",
      isRead: false,
    },
    {
      userId,
      title: "💧 Su Hatırlatması",
      body: "Gün içinde yeterli su içmeyi unutmayın! Metropolitan su her zaman yanınızda.",
      type: "reminder",
      data: { screen: "/(tabs)/products" },
      source: "push",
      isRead: false,
    },
    {
      userId,
      title: "✅ Ödeme Başarılı",
      body: "ORD-2025-001234 numaralı siparişinizin ödemesi alındı.",
      type: "payment_success",
      data: { screen: "/order/123", orderId: "123" },
      source: "push",
      isRead: false,
    },
    {
      userId,
      title: "🚚 Kargoya Verildi",
      body: "Siparişiniz kargoya verildi. Takip numarası: 123456789",
      type: "shipping",
      data: { screen: "/order/123", trackingNumber: "123456789" },
      source: "push",
      isRead: true,
    },
  ];

  try {
    for (const notification of testNotifications) {
      await db.insert(notifications).values(notification);
      console.log(`✅ Added notification: ${notification.title}`);
    }
    console.log("\n✨ All test notifications added successfully!");
  } catch (error) {
    console.error("❌ Error adding notifications:", error);
  } finally {
    process.exit(0);
  }
}

addTestNotifications();