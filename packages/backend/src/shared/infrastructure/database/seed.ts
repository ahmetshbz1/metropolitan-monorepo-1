//  "seed.ts"
//  metropolitan backend
//  Created by Ahmet on 30.06.2025.

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import {
  categories,
  categoryTranslations,
  products,
  productTranslations,
} from "./schema";

console.log("🌱 Starting to seed the database...");

const slugify = (text: string): string => {
  const a =
    "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;";
  const b =
    "aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------";
  const p = new RegExp(a.split("").join("|"), "g");

  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\\-]+/g, "") // Remove all non-word chars
    .replace(/\\-\\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

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

    console.log("🔥 Deleting existing data...");
    try {
      // Sıralama önemli: foreign key constraint'lerini ihlal etmemek için
      // önce bağımlı tablolardaki verileri sil.
      await db.delete(schema.trackingEvents);
      await db.delete(schema.orderItems);
      await db.delete(schema.orders);
      await db.delete(schema.cartItems);
      await db.delete(schema.favorites);
      await db.delete(schema.guestCartItems);
      await db.delete(schema.guestFavorites);
      await db.delete(schema.guestSessions);
      await db.delete(schema.addresses);
      await db.delete(schema.users);
      await db.delete(schema.companies);
      await db.delete(schema.productTranslations);
      await db.delete(schema.products);
      await db.delete(schema.categoryTranslations);
      await db.delete(schema.categories);
    } catch (error) {
      console.error("❌ Error deleting data:", error);
      process.exit(1);
    }

    const filePath = path.join(
      process.cwd(),
      "data",
      "yayla_products_kategorili-all.json"
    );
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const productsData = JSON.parse(fileContent);

    const categoryMap = new Map<string, string>();
    const languageCodes = ["tr", "en", "pl"];
    const categoryTranslationsMap: {
      [key: string]: { [key: string]: string };
    } = {
      "SÜT ÜRÜNLERİ": { en: "Dairy Products", pl: "Produkty Mleczne" },
      "ET ÜRÜNLERİ": { en: "Meat Products", pl: "Produkty Mięsne" },
      "UNLU MAMÜLLER": { en: "Bakery Products", pl: "Produkty Piekarnicze" },
      BAKLİYAT: { en: "Legumes", pl: "Rośliny strączkowe" },
      ZEYTİNLER: { en: "Olives", pl: "Oliwki" },
      "SALÇA VE EZMELER": { en: "Pastes & Spreads", pl: "Pasty i smarowidła" },
      "DİĞER ÜRÜNLER": { en: "Other Products", pl: "Inne Produkty" },
    };

    console.log("📦 Processing categories...");
    const allCategories = new Set<string>();
    for (const productCode in productsData) {
      allCategories.add(productsData[productCode].tr.kategori);
    }

    for (const categoryName of allCategories) {
      if (categoryMap.has(categoryName)) continue;

      const slug = slugify(categoryName);

      const [newCategory] = await db
        .insert(categories)
        .values({ slug })
        .returning({ id: categories.id });
      if (!newCategory)
        throw new Error(`Failed to create category: ${categoryName}`);
      categoryMap.set(categoryName, newCategory.id);

      for (const lang of languageCodes) {
        const translatedName =
          lang === "tr"
            ? categoryName
            : categoryTranslationsMap[categoryName]?.[lang] || categoryName;

        await db.insert(categoryTranslations).values({
          categoryId: newCategory.id,
          languageCode: lang,
          name: translatedName,
        });
      }
    }
    console.log(
      `✅ ${allCategories.size} categories processed with correct translations.`
    );

    console.log("🛍️  Processing products...");
    let productCount = 0;
    const productCodes = Object.keys(productsData);
    const zeroStockIndex = Math.floor(Math.random() * productCodes.length);

    for (const productCode in productsData) {
      const productData =
        productsData[productCode as keyof typeof productsData];
      const categoryId = categoryMap.get(productData.tr.kategori);

      if (!categoryId) {
        console.warn(
          `⚠️ Could not find category for product code: ${productCode}. Skipping.`
        );
        continue;
      }

      const imageUrl = `/images/${productCode}.png`;

      // Gerçekçi mock veri oluştur
      const basePrice = Math.floor(Math.random() * (45 - 5 + 1)) + 5; // 5 to 45
      const endings = [0.0, 0.5, 0.99];
      const randomEnding =
        endings[Math.floor(Math.random() * endings.length)] ?? 0;
      const price = (basePrice + randomEnding).toFixed(2);
      const isZeroStock = productCodes[zeroStockIndex] === productCode;
      const stock = isZeroStock ? 0 : Math.floor(Math.random() * 200) + 10;

      const [newProduct] = await db
        .insert(products)
        .values({
          productCode: productCode,
          categoryId: categoryId,
          brand: "Yayla",
          size: productData.tr.size,
          imageUrl: imageUrl,
          price: price,
          currency: "PLN",
          stock: stock,
        })
        .returning({ id: products.id });
      if (!newProduct)
        throw new Error(`Failed to create product: ${productCode}`);

      for (const lang of languageCodes) {
        const langData = productData[lang];
        if (langData) {
          await db.insert(productTranslations).values({
            productId: newProduct.id,
            languageCode: lang,
            name: langData.name,
            fullName: langData.full_name,
          });
        }
      }
      productCount++;
    }
    console.log(`✅ ${productCount} products processed.`);

    console.log("🌱 Database seeded successfully!");
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
