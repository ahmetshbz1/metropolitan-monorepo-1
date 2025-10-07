//  "delete-product.service.ts"
//  metropolitan backend
//  Admin ürün silme servisi

import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { products } from "../../../../../shared/infrastructure/database/schema";

export class AdminDeleteProductService {
  static async execute(productId: string) {
    try {
      const deleted = await db
        .delete(products)
        .where(eq(products.id, productId))
        .returning({ id: products.id });

      if (deleted.length === 0) {
        throw new Error("Ürün bulunamadı");
      }

      return {
        success: true,
        productId,
        message: "Ürün silindi",
      };
    } catch (error) {
      console.error("Admin ürün silme hatası", error);
      throw new Error(
        error instanceof Error ? error.message : "Ürün silinemedi"
      );
    }
  }
}
