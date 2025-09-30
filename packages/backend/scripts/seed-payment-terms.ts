import { db } from "../src/shared/infrastructure/database/connection";
import { paymentTermsSettings } from "../src/shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";

async function seedPaymentTerms() {
  console.log("🌱 Seeding payment terms settings...");

  const existing = await db.query.paymentTermsSettings.findFirst({
    where: eq(paymentTermsSettings.isGlobalDefault, true),
  });

  if (existing) {
    console.log("✓ Global payment terms already exist");
    console.log(`  Available terms: ${existing.availableTerms}`);
  } else {
    await db.insert(paymentTermsSettings).values({
      isGlobalDefault: true,
      availableTerms: "7,14,21",
    });
    console.log("✓ Global payment terms created: 7,14,21 days");
  }

  console.log("✅ Payment terms seeding completed!");
  process.exit(0);
}

seedPaymentTerms().catch((error) => {
  console.error("❌ Error seeding payment terms:", error);
  process.exit(1);
});
