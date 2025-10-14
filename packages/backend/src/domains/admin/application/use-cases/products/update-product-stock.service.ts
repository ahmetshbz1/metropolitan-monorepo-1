import { eq } from "drizzle-orm";

import { RedisStockService } from "../../../../../shared/infrastructure/cache/redis-stock.service";
import { db } from "../../../../../shared/infrastructure/database/connection";
import { products } from "../../../../../shared/infrastructure/database/schema";

interface UpdateProductStockInput {
  productId: string;
  stock: number;
  adminUserId: string;
}

export class AdminUpdateProductStockService {
  static async execute({ productId, stock, adminUserId }: UpdateProductStockInput) {
    if (!Number.isFinite(stock) || stock < 0) {
      throw new Error("Geçersiz stok değeri");
    }

    const normalizedStock = Math.floor(stock);

    // Redis'i distributed lock ile güncelle (race condition önlemi)
    const redisResult = await RedisStockService.setStockLevelWithLock(
      productId,
      normalizedStock,
      adminUserId
    );

    if (!redisResult.success) {
      throw new Error(redisResult.error || "Redis lock alınamadı, lütfen tekrar deneyin");
    }

    // Database'i güncelle
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
