//  "update-product-translations.ts"
//  metropolitan backend
//  Created by Ahmet on 15.01.2025.

import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  productTranslations,
  products,
} from "../src/shared/infrastructure/database/schema";

console.log("🌱 Starting to update product translations...");

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

    const db = drizzle(client, { schema: { productTranslations, products } });

    console.log("📝 Updating product translations...");

    // Ürün çevirileri
    const productTranslationsData = {
      "1000": {
        tr: "Tatlı Biber Salçası",
        en: "Sweet Pepper Paste",
        pl: "Pasta z Słodkiej Papryki",
      },
      "118": {
        tr: "Lavaş Ekmeği 30x25cm",
        en: "Flatbread 30x25cm",
        pl: "Płaski Chleb 30x25cm",
      },
      "175": {
        tr: "Krem Peynir Mini",
        en: "Cream Cheese Mini's",
        pl: "Serek Śmietankowy Mini",
      },
      "250": {
        tr: "Tuzlu Tereyağı",
        en: "Butter, Salted",
        pl: "Masło Solone",
      },
      "330": {
        tr: "Göçebe Yumuşak Peynir",
        en: "Nomadic Soft Cheese",
        pl: "Miękki Ser Nomadów",
      },
      "338": {
        tr: "Beyaz Peynir Salamura %45 Yağ",
        en: "White Cheese Brine 45% Fat",
        pl: "Biały Ser w Solance 45% Tłuszczu",
      },
      "342": {
        tr: "Keçi Peyniri Salamura %50 Yağ",
        en: "Goat Cheese in Brine 50% Fat",
        pl: "Ser Kozi w Solance 50% Tłuszczu",
      },
      "350": {
        tr: "Yumuşak Peynir - Çörek Otu ile",
        en: "Soft Cheese - with Nigella Seeds",
        pl: "Miękki Ser - z Czarnuszką",
      },
      "363": {
        tr: "Ayran - Yoğurt İçeceği Türk Tarzı",
        en: "Ayran - Yogurt Drink Turkish Style",
        pl: "Ayran - Napój Jogurtowy w Stylu Tureckim",
      },
      "400": {
        tr: "Sığır Sosisi",
        en: "Beef Sausage",
        pl: "Kiełbasa Wołowa",
      },
      "502": {
        tr: "Pişmiş Kanatlı Et Sosisi",
        en: "Cooked Poultry Meat Sausage",
        pl: "Kiełbasa z Pieczonego Mięsa Drobiowego",
      },
    };

    for (const [productCode, translations] of Object.entries(
      productTranslationsData
    )) {
      // Ürün ID'sini bul
      const product = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.productCode, productCode))
        .limit(1);

      if (product.length === 0) {
        console.warn(`⚠️ Product with code ${productCode} not found`);
        continue;
      }

      const productId = product[0].id;

      // Mevcut çevirileri sil
      await db
        .delete(productTranslations)
        .where(eq(productTranslations.productId, productId));

      // Yeni çevirileri ekle
      for (const [languageCode, translation] of Object.entries(translations)) {
        await db.insert(productTranslations).values({
          productId,
          languageCode,
          name: translation,
          fullName: translation,
          description: null,
        });
      }

      console.log(`✅ Updated translations for product ${productCode}`);
    }

    console.log("✅ Product translations updated successfully!");
    await client.end();
  } catch (error) {
    console.error("❌ Error updating product translations:", error);
    process.exit(1);
  }
};

main();
