//  "test-user-separation.ts"
//  metropolitan backend
//  Created by Ahmet on [current date]

import { and, eq } from "drizzle-orm";
import { db } from "../src/shared/infrastructure/database/connection";
import { users } from "../src/shared/infrastructure/database/schema";

async function testUserSeparation() {
  const testPhoneNumber = "+905551234567";

  console.log("🧪 Testing user separation functionality...\n");

  try {
    // Önce mevcut test verilerini temizle
    console.log("🧹 Cleaning up existing test data...");
    await db.delete(users).where(eq(users.phoneNumber, testPhoneNumber));
    console.log("✅ Cleanup completed\n");

    // 1. Bireysel kullanıcı oluştur
    console.log("👤 Creating individual user...");
    const individualUsers = await db
      .insert(users)
      .values({
        phoneNumber: testPhoneNumber,
        userType: "individual",
        firstName: "Ahmet",
        lastName: "Bireysel",
        email: "ahmet.bireysel@test.com",
      })
      .returning();

    const individualUser = individualUsers[0]!;
    console.log(`✅ Individual user created: ${individualUser.id}`);
    console.log(`   - Phone: ${individualUser.phoneNumber}`);
    console.log(`   - Type: ${individualUser.userType}`);
    console.log(
      `   - Name: ${individualUser.firstName} ${individualUser.lastName}\n`
    );

    // 2. Kurumsal kullanıcı oluştur (aynı telefon numarası)
    console.log("🏢 Creating corporate user with same phone number...");
    const corporateUsers = await db
      .insert(users)
      .values({
        phoneNumber: testPhoneNumber,
        userType: "corporate",
        firstName: "Ahmet",
        lastName: "Kurumsal",
        email: "ahmet.kurumsal@test.com",
      })
      .returning();

    const corporateUser = corporateUsers[0]!;
    console.log(`✅ Corporate user created: ${corporateUser.id}`);
    console.log(`   - Phone: ${corporateUser.phoneNumber}`);
    console.log(`   - Type: ${corporateUser.userType}`);
    console.log(
      `   - Name: ${corporateUser.firstName} ${corporateUser.lastName}\n`
    );

    // 3. Her iki kullanıcı tipini ayrı ayrı sorgula
    console.log("🔍 Testing user queries...");

    const individualQuery = await db.query.users.findFirst({
      where: and(
        eq(users.phoneNumber, testPhoneNumber),
        eq(users.userType, "individual")
      ),
    });

    const corporateQuery = await db.query.users.findFirst({
      where: and(
        eq(users.phoneNumber, testPhoneNumber),
        eq(users.userType, "corporate")
      ),
    });

    console.log(
      `✅ Individual user query: ${individualQuery?.firstName} ${individualQuery?.lastName} (${individualQuery?.userType})`
    );
    console.log(
      `✅ Corporate user query: ${corporateQuery?.firstName} ${corporateQuery?.lastName} (${corporateQuery?.userType})\n`
    );

    // 4. Aynı tip ile duplicate oluşturmayı dene (hata vermeli)
    console.log("🚫 Testing duplicate prevention...");
    try {
      await db.insert(users).values({
        phoneNumber: testPhoneNumber,
        userType: "individual",
        firstName: "Duplicate",
        lastName: "User",
        email: "duplicate@test.com",
      });
      console.log(
        "❌ ERROR: Duplicate user was created (this shouldn't happen!)"
      );
    } catch (error: any) {
      console.log("✅ Duplicate prevention working correctly:");
      console.log(`   - Error: ${error.message}\n`);
    }

    // 5. Tüm kullanıcıları listele
    console.log("📋 All users with this phone number:");
    const allUsers = await db.query.users.findMany({
      where: eq(users.phoneNumber, testPhoneNumber),
    });

    allUsers.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.firstName} ${user.lastName} (${user.userType}) - ${user.email}`
      );
    });

    console.log("\n🎉 Test completed successfully!");
    console.log(
      "✅ Users can now have both individual and corporate accounts with the same phone number"
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Test sonunda temizlik
    console.log("\n🧹 Final cleanup...");
    await db.delete(users).where(eq(users.phoneNumber, testPhoneNumber));
    console.log("✅ Test data cleaned up");
    process.exit(0);
  }
}

// Script'i çalıştır
testUserSeparation();
