import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { products } from "../../../../../shared/infrastructure/database/schema";

interface UpdateProductStockInput {
  productId: string;
  stock: number;
}

export class AdminUpdateProductStockService {
  static async execute({ productId, stock }: UpdateProductStockInput) {
    if (!Number.isFinite(stock) || stock < 0) {
      throw new Error("Geçersiz stok değeri");
    }

    const normalizedStock = Math.floor(stock);

    const [updated] = await db
      .update(products)
      .set({
        stock: normalizedStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning({ id: products.id, stock: products.stock });

    if (!updated) {
      throw new Error("Ürün bulunamadı");
    }

    return {
      success: true,
      productId: updated.id,
      stock: updated.stock,
    };
  }
}
