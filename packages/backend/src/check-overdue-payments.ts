//  "check-overdue-payments.ts"
//  metropolitan backend
//  Vadesi geçmiş ödemeleri kontrol eden script

import { OverduePaymentService } from "./domains/payment/application/services/overdue-payment.service";

async function checkOverduePayments() {
  console.log("🔍 Vadesi geçmiş ödemeler kontrol ediliyor...\n");

  const result = await OverduePaymentService.checkAndNotifyOverduePayments();

  console.log("\n📊 Kontrol Sonuçları:");
  console.log(`   Kontrol edilen sipariş: ${result.checked}`);
  console.log(`   Bildirim gönderilen: ${result.notified}`);

  if (result.errors.length > 0) {
    console.log("\n❌ Hatalar:");
    result.errors.forEach((error) => console.log(`   - ${error}`));
  }

  process.exit(0);
}

checkOverduePayments();
