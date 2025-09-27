//  "seed-allergen-translations.ts"
//  metropolitan backend
//  Created by Ahmet on 15.01.2025.

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { allergenTranslations } from "../src/shared/infrastructure/database/schema";

console.log("🌱 Starting to seed allergen translations...");

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

    const db = drizzle(client, { schema: { allergenTranslations } });

    console.log("🔥 Deleting existing allergen translations...");
    await db.delete(allergenTranslations);

    console.log("📝 Inserting allergen translations...");

    const allergenData = [
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

    console.log("✅ Allergen translations seeded successfully!");
    await client.end();
  } catch (error) {
    console.error("❌ Error seeding allergen translations:", error);
    process.exit(1);
  }
};

main();
