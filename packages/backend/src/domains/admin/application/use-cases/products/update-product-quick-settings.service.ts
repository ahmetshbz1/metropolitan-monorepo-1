import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { products } from "../../../../../shared/infrastructure/database/schema";
import { toDecimalString } from "./product.utils";

interface AdminQuickUpdateInput {
  productId: string;
  stock?: number;
  individualPrice?: number | null;
  corporatePrice?: number | null;
}

export class AdminUpdateProductQuickSettingsService {
  static async execute({
    productId,
    stock,
    individualPrice,
    corporatePrice,
  }: AdminQuickUpdateInput) {
    const updates: Record<string, unknown> = {};

    if (stock !== undefined) {
      if (!Number.isFinite(stock) || stock < 0) {
        throw new Error("Geçersiz stok değeri");
      }
      updates.stock = Math.floor(stock);
    }

    if (individualPrice !== undefined) {
      if (individualPrice === null) {
        updates.individualPrice = null;
      } else if (Number.isFinite(individualPrice) && individualPrice >= 0) {
        updates.individualPrice = toDecimalString(individualPrice);
      } else {
        throw new Error("Geçersiz bireysel fiyat");
      }
    }

    if (corporatePrice !== undefined) {
      if (corporatePrice === null) {
        updates.corporatePrice = null;
      } else if (Number.isFinite(corporatePrice) && corporatePrice >= 0) {
        updates.corporatePrice = toDecimalString(corporatePrice);
      } else {
        throw new Error("Geçersiz kurumsal fiyat");
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("Güncellenecek bir alan belirtmelisiniz");
    }

    updates.updatedAt = new Date();

    const [result] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, productId))
      .returning({
        id: products.id,
        stock: products.stock,
        individualPrice: products.individualPrice,
        corporatePrice: products.corporatePrice,
      });

    if (!result) {
      throw new Error("Ürün bulunamadı");
    }

    return {
      success: true,
      productId: result.id,
      stock: result.stock,
      individualPrice: result.individualPrice,
      corporatePrice: result.corporatePrice,
    };
  }
}
