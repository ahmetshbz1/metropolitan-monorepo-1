//  "cart-item-query.service.ts"
//  metropolitan backend
//  Created by Ahmet on 26.06.2025.

import { and, desc, eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import {
  cartItems,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";

import { CartCalculationService } from "./cart-calculation.service";
import { mapCartItem } from "./cart-item-mapper";
import type { CartResponse } from "./cart-item-types";

/**
 * Sepet sorgulama işlemlerini yöneten servis
 */
export class CartItemQueryService {
  /**
   * Kullanıcının sepet öğelerini getirir
   */
  static async getUserCartItems(
    userId: string,
    userType?: "individual" | "corporate"
  ): Promise<CartResponse> {
    const userCartItems = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        product: {
          id: products.id,
          productCode: products.productCode,
          brand: products.brand,
          size: products.size,
          image: products.imageUrl,
          price: products.price,
          individualPrice: products.individualPrice,
          corporatePrice: products.corporatePrice,
          currency: products.currency,
          stock: products.stock,
          name: productTranslations.name,
          category: products.categoryId,
        },
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.languageCode, "tr")
        )
      )
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));

    const mappedItems = userCartItems.map(item => mapCartItem(item, userType));
    const summary = CartCalculationService.generateCartSummary(mappedItems);

    return {
      items: mappedItems,
      summary,
    };
  }
}
