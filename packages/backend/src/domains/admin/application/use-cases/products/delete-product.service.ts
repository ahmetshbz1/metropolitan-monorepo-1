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

      const postgresError = (() => {
        if (error && typeof error === "object") {
          if ("code" in error && typeof (error as { code?: string }).code === "string") {
            return error as { code?: string };
          }

          if (
            "cause" in error &&
            typeof (error as { cause?: unknown }).cause === "object" &&
            (error as { cause?: unknown }).cause !== null &&
            "code" in ((error as { cause?: unknown }).cause as { code?: string })
          ) {
            return (error as { cause?: { code?: string } }).cause;
          }
        }
        return null;
      })();

      if (postgresError?.code === "23503") {
        throw new Error(
          "Bu ürüne ait sipariş kayıtları bulunduğu için silme işlemi engellendi. Önce ilgili siparişleri güncelleyin."
        );
      }

      throw new Error(
        error instanceof Error ? error.message : "Ürün silinemedi"
      );
    }
  }
}
