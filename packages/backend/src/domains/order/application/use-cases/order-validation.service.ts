//  "order-validation.service.ts"
//  metropolitan backend
//  Created by Ahmet on 07.07.2025.

import type { CartItem as CartItemData } from "@metropolitan/shared/types/cart";
import type { StockError } from "@metropolitan/shared/types/order";
import { and, eq } from "drizzle-orm";
import { db } from "../../../../shared/infrastructure/database/connection";
import {
  addresses,
  cartItems,
  productTranslations,
  products,
} from "../../../../shared/infrastructure/database/schema";

export class OrderValidationService {
  /**
   * Kullanıcının sepetindeki ürünleri, adresini ve ödeme yöntemini doğrular.
   * @returns Geçerlilik durumu ve stokta olmayan ürünlerin listesi.
   */
  static async validateOrder(data: {
    userId: string;
    addressId: string;
    items: CartItemData[];
  }): Promise<{
    isValid: boolean;
    stockErrors?: StockError[];
    error?: string;
  }> {
    const { userId, addressId, items } = data;

    // 1. Ürün listesinin boş olup olmadığını kontrol et
    if (items.length === 0) {
      return { isValid: false, error: "Cannot create an order with no items." };
    }

    // 2. Adres kontrolü
    const address = await db.query.addresses.findFirst({
      where: and(eq(addresses.id, addressId), eq(addresses.userId, userId)),
    });
    if (!address) {
      return {
        isValid: false,
        error: `Address with ID ${addressId} not found or doesn't belong to the user.`,
      };
    }

    // 3. Ürünlerin stok ve geçerlilik durumu kontrolü
    const stockErrors: StockError[] = [];
    for (const item of items) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, item.product.id),
        with: {
          translations: {
            where: eq(productTranslations.languageCode, "tr"),
          },
        },
      });

      if (!product) {
        stockErrors.push({
          productId: item.product.id,
          productName: item.product.name,
          requestedQuantity: item.quantity,
          availableStock: 0, // Ürün bulunamadığı için stok 0 kabul edilir
        });
        continue;
      }

      if ((product.stock ?? 0) < item.quantity) {
        stockErrors.push({
          productId: product.id,
          productName: product.translations[0]?.name ?? "İsimsiz Ürün",
          requestedQuantity: item.quantity,
          availableStock: product.stock ?? 0,
        });
      }
    }

    if (stockErrors.length > 0) {
      return { isValid: false, stockErrors };
    }

    return { isValid: true };
  }

  /**
   * Sepet öğelerini doğrular ve cart item data'sını döner
   */
  static async validateCartItems(userId: string): Promise<{
    items: CartItemData[];
    validation: {
      isValid: boolean;
      errors?: StockError[];
    };
  }> {
    // Veritabanından sepet öğelerini al
    const dbCartItems = await db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
      with: {
        product: {
          with: {
            translations: {
              where: eq(productTranslations.languageCode, "tr"),
            },
          },
        },
      },
    });

    if (dbCartItems.length === 0) {
      return {
        items: [],
        validation: {
          isValid: false,
          errors: [
            {
              productId: "",
              productName: "Sepet",
              requestedQuantity: 0,
              availableStock: 0,
            },
          ],
        },
      };
    }

    // Cart item'ları CartItemData formatına çevir
    const cartItemsData: CartItemData[] = dbCartItems.map((item) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.translations[0]?.name || "İsimsiz Ürün",
        image: item.product.imageUrl || "",
        price: parseFloat(item.product.price || "0"),
        stock: item.product.stock || 0,
        category: "", // Category name backend'de resolve edilecek
        brand: item.product.brand || "",
        size: item.product.size || undefined,
        currency: item.product.currency,
      },
      quantity: item.quantity,
      createdAt: item.createdAt.toISOString(),
    }));

    // Stok kontrolü yap
    const stockErrors: StockError[] = [];
    for (const item of cartItemsData) {
      if (item.product.stock < item.quantity) {
        stockErrors.push({
          productId: item.product.id,
          productName: item.product.name,
          requestedQuantity: item.quantity,
          availableStock: item.product.stock,
        });
      }
    }

    return {
      items: cartItemsData,
      validation: {
        isValid: stockErrors.length === 0,
        errors: stockErrors.length > 0 ? stockErrors : undefined,
      },
    };
  }

  /**
   * Adresi doğrular
   */
  static async validateAddress(addressId: string, userId: string) {
    const address = await db.query.addresses.findFirst({
      where: and(eq(addresses.id, addressId), eq(addresses.userId, userId)),
    });
    if (!address) {
      throw new Error("Geçersiz teslimat adresi");
    }
    return address;
  }

  /**
   * Ödeme yöntemini doğrular (geçici olarak her zaman geçerli kabul ediyor)
   */
  static async validatePaymentMethod(paymentMethodId: string, _userId: string) {
    // Stripe payment types - bunlar artık table'da tutulmuyor
    const validPaymentMethods = [
      "card",
      "bank_transfer",
      "blik",
      "apple_pay",
      "google_pay",
    ];

    if (!validPaymentMethods.includes(paymentMethodId)) {
      throw new Error("Geçersiz ödeme yöntemi");
    }

    return true;
  }
}
