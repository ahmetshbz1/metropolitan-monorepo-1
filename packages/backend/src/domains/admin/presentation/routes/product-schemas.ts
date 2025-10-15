//  "product-schemas.ts"
//  metropolitan backend
//  Paylaşılan ürün şemaları ve validasyonlar

import { t } from "elysia";
import { SUPPORTED_LANGUAGES } from "../../application/use-cases/products/product.types";

export const translationSchema = t.Object({
  languageCode: t.String({
    enum: SUPPORTED_LANGUAGES as unknown as readonly string[],
  }),
  name: t.String({ minLength: 1 }),
  fullName: t.Optional(t.String()),
  description: t.Optional(t.String()),
});

export const baseProductSchema = {
  productCode: t.String({ minLength: 2 }),
  categoryId: t.Optional(t.String()),
  brand: t.Optional(t.String()),
  size: t.Optional(t.String()),
  imageUrl: t.Optional(t.String()),
  price: t.Optional(t.Number()),
  currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
  stock: t.Optional(t.Number()),
  tax: t.Optional(t.Number()),
  allergens: t.Optional(t.Array(t.String())),
  nutritionalValues: t.Optional(
    t.Object({
      energy: t.Optional(t.String()),
      fat: t.Optional(t.String()),
      saturatedFat: t.Optional(t.String()),
      carbohydrates: t.Optional(t.String()),
      sugar: t.Optional(t.String()),
      protein: t.Optional(t.String()),
      salt: t.Optional(t.String()),
    })
  ),
  netQuantity: t.Optional(t.String()),
  expiryDate: t.Optional(t.String({ format: "date-time" })),
  storageConditions: t.Optional(t.String()),
  manufacturerInfo: t.Optional(t.Record(t.String(), t.Any())),
  originCountry: t.Optional(t.String()),
  badges: t.Optional(
    t.Object({
      halal: t.Optional(t.Boolean()),
      vegetarian: t.Optional(t.Boolean()),
      vegan: t.Optional(t.Boolean()),
      glutenFree: t.Optional(t.Boolean()),
      organic: t.Optional(t.Boolean()),
      lactoseFree: t.Optional(t.Boolean()),
    })
  ),
  individualPrice: t.Optional(t.Number()),
  corporatePrice: t.Optional(t.Number()),
  minQuantityIndividual: t.Optional(t.Number()),
  minQuantityCorporate: t.Optional(t.Number()),
  quantityPerBox: t.Optional(t.Number()),
  translations: t.Array(translationSchema, { minItems: 1 }),
};

export const createProductSchema = t.Object(baseProductSchema);
