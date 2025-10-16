import { AbandonedCartReminderService } from "../../application/use-cases/abandoned-cart-reminder.service";

/**
 * Unutulan sepet hatırlatıcısı cron job
 *
 * Bu script manuel olarak veya cron ile çalıştırılabilir:
 *
 * Manuel çalıştırma:
 * bun src/domains/shopping/infrastructure/jobs/abandoned-cart-cron.ts
 *
 * Crontab örneği (her gün saat 10:00'da):
 * 0 10 * * * cd /path/to/backend && bun src/domains/shopping/infrastructure/jobs/abandoned-cart-cron.ts
 *
 * Crontab örneği (her 6 saatte bir):
 * 0 */6 * * * cd /path/to/backend && bun src/domains/shopping/infrastructure/jobs/abandoned-cart-cron.ts
 */

async function runAbandonedCartReminder() {
  console.log("=".repeat(60));
  console.log("Abandoned Cart Reminder Cron Job Başlatıldı");
  console.log(`Tarih: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  try {
    const result = await AbandonedCartReminderService.sendReminders({
      abandonedHours: Number(process.env.ABANDONED_CART_HOURS) || 24,
      limit: Number(process.env.ABANDONED_CART_LIMIT) || 100,
    });

    console.log("\n" + "=".repeat(60));
    console.log("Abandoned Cart Reminder Cron Job Tamamlandı");
    console.log(`İşlenen Kullanıcı: ${result.processedUsers}`);
    console.log(`Gönderilen Bildirim: ${result.sentNotifications}`);
    console.log(`Hata Sayısı: ${result.errors}`);
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("Abandoned Cart Reminder Cron Job HATASI:");
    console.error(error);
    console.error("=".repeat(60) + "\n");

    process.exit(1);
  }
}

runAbandonedCartReminder();
