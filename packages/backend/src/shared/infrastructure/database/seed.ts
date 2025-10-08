//  "seed.ts"
//  metropolitan backend
//  System data seeding (allergen and storage condition translations)

import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import {
  allergenTranslations,
  storageConditionTranslations,
} from "./schema";

console.log("🌱 Seeding system data...");

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

    const db = drizzle(client, { schema });

    console.log("🔥 Deleting existing system data...");
    await db.delete(schema.storageConditionTranslations);
    await db.delete(schema.allergenTranslations);

    console.log("🧩 Seeding allergen and storage condition translations...");

    const allergenData: Array<{
      allergenKey: string;
      translations: Record<string, string>;
    }> = [
      {
        allergenKey: "dairy",
        translations: {
          tr: "Süt ve süt ürünleri içerir",
          en: "Contains milk and dairy products",
          pl: "Zawiera mleko i produkty mleczne",
        },
      },
      {
        allergenKey: "gluten",
        translations: {
          tr: "Gluten içerebilir",
          en: "May contain gluten",
          pl: "Może zawierać gluten",
        },
      },
      {
        allergenKey: "eggs",
        translations: {
          tr: "Yumurta içerebilir",
          en: "May contain eggs",
          pl: "Może zawierać jaja",
        },
      },
      {
        allergenKey: "soy",
        translations: {
          tr: "Soya içerebilir",
          en: "May contain soy",
          pl: "Może zawierać soję",
        },
      },
      {
        allergenKey: "nuts",
        translations: {
          tr: "Fındık ve fıstık içerebilir",
          en: "May contain nuts",
          pl: "Może zawierać orzechy",
        },
      },
      {
        allergenKey: "sesame",
        translations: {
          tr: "Susam içerebilir",
          en: "May contain sesame",
          pl: "Może zawierać sezam",
        },
      },
    ];

    for (const allergen of allergenData) {
      for (const [languageCode, translation] of Object.entries(
        allergen.translations
      )) {
        await db.insert(allergenTranslations).values({
          allergenKey: allergen.allergenKey,
          languageCode,
          translation,
        });
      }
    }

    const storageConditionData: Array<{
      conditionKey: string;
      translations: Record<string, string>;
    }> = [
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

    console.log("✅ System data seeded successfully!");
    await client.end();
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Sadece script direkt çalıştırıldığında main'i otomatik çalıştır
if (require.main === module) {
  main();
}

export { main as seedDatabase };
