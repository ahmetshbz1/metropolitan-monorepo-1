//  "seed-storage-condition-translations.ts"
//  metropolitan backend
//  Created by Ahmet on 15.01.2025.

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { storageConditionTranslations } from "../src/shared/infrastructure/database/schema";

console.log("🌱 Starting to seed storage condition translations...");

const main = async () => {
  try {
    const client = postgres({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      max: 1,
    });

    const db = drizzle(client, { schema: { storageConditionTranslations } });

    console.log("🔥 Deleting existing storage condition translations...");
    await db.delete(storageConditionTranslations);

    console.log("📝 Inserting storage condition translations...");

    const storageConditionData = [
      {
        conditionKey: "refrigerated",
        translations: {
          tr: "Buzdolabında +4°C'de saklanmalıdır",
          en: "Store in refrigerator at +4°C",
          pl: "Przechowywać w lodówce w temperaturze +4°C",
        },
      },
      {
        conditionKey: "cool_dry",
        translations: {
          tr: "Serin ve kuru yerde saklanmalıdır",
          en: "Store in a cool and dry place",
          pl: "Przechowywać w chłodnym i suchym miejscu",
        },
      },
      {
        conditionKey: "away_from_sunlight",
        translations: {
          tr: "Güneş ışığından korunmalıdır",
          en: "Keep away from direct sunlight",
          pl: "Chronić przed bezpośrednim działaniem promieni słonecznych",
        },
      },
      {
        conditionKey: "consume_within_3_days",
        translations: {
          tr: "Açıldıktan sonra 3 gün içinde tüketilmelidir",
          en: "Consume within 3 days after opening",
          pl: "Spożyć w ciągu 3 dni po otwarciu",
        },
      },
      {
        conditionKey: "room_temperature",
        translations: {
          tr: "Oda sıcaklığında saklanmalıdır",
          en: "Store at room temperature",
          pl: "Przechowywać w temperaturze pokojowej",
        },
      },
      {
        conditionKey: "freezer",
        translations: {
          tr: "Dondurucuda -18°C'de saklanmalıdır",
          en: "Store in freezer at -18°C",
          pl: "Przechowywać w zamrażarce w temperaturze -18°C",
        },
      },
    ];

    for (const condition of storageConditionData) {
      for (const [languageCode, translation] of Object.entries(
        condition.translations
      )) {
        await db.insert(storageConditionTranslations).values({
          conditionKey: condition.conditionKey,
          languageCode,
          translation,
        });
      }
    }

    console.log("✅ Storage condition translations seeded successfully!");
    await client.end();
  } catch (error) {
    console.error("❌ Error seeding storage condition translations:", error);
    process.exit(1);
  }
};

main();
