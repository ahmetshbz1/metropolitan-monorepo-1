//  "cart-item-batch.service.ts"
//  metropolitan backend
//  Created by Ahmet on 26.06.2025.

import { eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import {
  cartItems,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";
import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";

import { CartValidationService } from "./cart-validation.service";
import type { CartItemWithTranslations } from "./cart-item-types";

/**
 * Sepet toplu işlemlerini yöneten servis
 */
export class CartItemBatchService {
  /**
   * Sepet öğelerini toplu günceller (batch update)
   */
  static async batchUpdateCartItems(
    userId: string,
    updates: Array<{ itemId: string; quantity: number }>,
    userType: "individual" | "corporate"
  ): Promise<{
    message: string;
    updatedCount: number;
    adjustedItems?: Array<{ itemId: string; requestedQty: number; adjustedQty: number; productName: string }>;
  }> {
    if (!updates.length) {
      return { message: "Güncelleme yapılmadı", updatedCount: 0 };
    }

    let updatedCount = 0;
    const adjustedItems: Array<{ itemId: string; requestedQty: number; adjustedQty: number; productName: string }> = [];

    // Her bir güncellemeyi sırayla işle
    for (const { itemId, quantity } of updates) {
      try {
        // Sepet öğesinin kullanıcıya ait olduğunu kontrol et
        await CartValidationService.validateCartOwnership(itemId, userId);

        const cartItem = (await db.query.cartItems.findFirst({
          where: eq(cartItems.id, itemId),
          with: {
            product: {
              with: {
                translations: {
                  where: eq(productTranslations.languageCode, "tr"),
                },
              },
            },
          },
        })) as CartItemWithTranslations | undefined;

        if (!cartItem) continue;

        const product = await db.query.products.findFirst({
          where: eq(products.id, cartItem.productId),
        });

        if (!product) continue;

        const availableStock = product.stock || 0;
        let finalQuantity = quantity;

        // Minimum quantity kontrolü
        try {
          await CartValidationService.validateMinQuantity(cartItem.productId, quantity, userType);
        } catch (error) {
          logger.error(
            { productId: cartItem.productId, error },
            "Min quantity validation failed"
          );
          continue;
        }

        // Eğer istenen miktar stoktan fazlaysa, otomatik olarak stok limitine ayarla
        if (quantity > availableStock) {
          finalQuantity = availableStock;
          const translationName = cartItem.product.translations[0]?.name;
          adjustedItems.push({
            itemId,
            requestedQty: quantity,
            adjustedQty: finalQuantity,
            productName: translationName || product.productCode || "Ürün",
          });
        } else {
          // Normal stok kontrolü
          await CartValidationService.validateStock(
            cartItem.productId,
            quantity,
            cartItem.quantity
          );
        }

        await db
          .update(cartItems)
          .set({
            quantity: finalQuantity,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, itemId));

        updatedCount++;
      } catch (error) {
        // Hata durumunda devam et, diğer güncellemeleri yap
        logger.error({ itemId, error }, "Cart item update failed");
      }
    }

    return {
      message: `${updatedCount} öğe güncellendi`,
      updatedCount,
      adjustedItems: adjustedItems.length > 0 ? adjustedItems : undefined,
    };
  }
}
