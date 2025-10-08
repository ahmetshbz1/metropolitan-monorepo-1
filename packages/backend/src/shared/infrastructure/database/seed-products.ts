import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import {
  categories,
  categoryTranslations,
  productTranslations,
  products,
} from "./schema";

console.log("🛍️  Seeding products (DEVELOPMENT ONLY)...");

const slugify = (text: string): string => {
  const a =
    "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;";
  const b =
    "aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------";
  const p = new RegExp(a.split("").join("|"), "g");

  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(p, (c) => b.charAt(a.indexOf(c)))
    .replace(/&/g, "-and-")
    .replace(/[^\w\\-]+/g, "")
    .replace(/\\-\\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
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

    console.log("🔥 Deleting existing product data...");
    await db.delete(schema.productTranslations);
    await db.delete(schema.products);
    await db.delete(schema.categoryTranslations);
    await db.delete(schema.categories);

    const filePath = path.join(
      process.cwd(),
      "data",
      "yayla_products_with_images.json"
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
      const categoryName = productData.tr.kategori;
      const categoryId = categoryMap.get(categoryName);

      if (!categoryId) {
        console.warn(
          `⚠️ Could not find category for product code: ${productCode}. Skipping.`
        );
        continue;
      }

      const imageUrl = `/images/${productCode}.png`;
      const basePrice = Math.floor(Math.random() * (45 - 5 + 1)) + 5;
      const endings = [0.0, 0.5, 0.99];
      const randomEnding =
        endings[Math.floor(Math.random() * endings.length)] ?? 0;
      const price = (basePrice + randomEnding).toFixed(2);
      const isZeroStock = productCodes[zeroStockIndex] === productCode;
      const stock = isZeroStock ? 0 : Math.floor(Math.random() * 200) + 10;

      const sampleNutritionalValues = {
        energy: `${Math.floor(Math.random() * 300) + 100} kcal`,
        fat: `${(Math.random() * 20 + 1).toFixed(1)}g`,
        saturatedFat: `${(Math.random() * 10 + 0.5).toFixed(1)}g`,
        carbohydrates: `${(Math.random() * 50 + 5).toFixed(1)}g`,
        sugar: `${(Math.random() * 15 + 1).toFixed(1)}g`,
        protein: `${(Math.random() * 20 + 2).toFixed(1)}g`,
        salt: `${(Math.random() * 2 + 0.1).toFixed(2)}g`,
      };

      const sampleManufacturerInfo = {
        name: "Yayla Gıda A.Ş.",
        address: "Organize Sanayi Bölgesi 1. Cadde No:15 Bolu/Türkiye",
        phone: "+90 374 215 10 00",
        email: "info@yayla.com.tr",
      };

      const isPerishable =
        categoryName === "SÜT ÜRÜNLERİ" || categoryName === "ET ÜRÜNLERİ";
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (isPerishable ? 30 : 365));

      const sampleBadges = {
        halal: true,
        vegetarian: categoryName !== "ET ÜRÜNLERİ",
        vegan: categoryName === "SALÇA VE EZMELER",
        glutenFree: categoryName !== "UNLU MAMÜLLER",
        organic: Math.random() > 0.5,
        lactoseFree: categoryName !== "SÜT ÜRÜNLERİ",
      };

      const individualPrice = price;
      const corporatePrice = Number((Number(price) * 0.85).toFixed(2));
      const minQuantityIndividual = 1;
      const minQuantityCorporate = Math.random() > 0.5 ? 6 : 12;
      const quantityPerBox = minQuantityCorporate;

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
          individualPrice: individualPrice,
          corporatePrice: corporatePrice,
          minQuantityIndividual: minQuantityIndividual,
          minQuantityCorporate: minQuantityCorporate,
          quantityPerBox: quantityPerBox,
          allergens:
            categoryName === "SÜT ÜRÜNLERİ"
              ? "dairy"
              : categoryName === "UNLU MAMÜLLER"
                ? "gluten"
                : categoryName === "ET ÜRÜNLERİ"
                  ? "eggs"
                  : null,
          nutritionalValues: JSON.stringify(sampleNutritionalValues),
          netQuantity:
            productData.tr.size || `${Math.floor(Math.random() * 500) + 100}g`,
          expiryDate: expiryDate,
          storageConditions: isPerishable ? "refrigerated" : "cool_dry",
          manufacturerInfo: JSON.stringify(sampleManufacturerInfo),
          originCountry: "Türkiye",
          badges: JSON.stringify(sampleBadges),
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
            description: langData.description || null,
          });
        }
      }
      productCount++;
    }
    console.log(`✅ ${productCount} products processed.`);

    console.log("✅ Product seeding completed!");
    await client.end();
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

export { main as seedProducts };
