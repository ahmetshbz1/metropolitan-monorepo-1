//  "cartService.ts"
//  metropolitan app
//  Created by Ahmet on 26.06.2025.

import { api } from "@/core/api";
import { CartItem } from "@/types/cart";
import {
  normalizeGuestCartResponse,
  normalizeUserCartResponse,
} from "@/utils/cartNormalizers";

export class CartService {
  // User cart operations
  static async getUserCart() {
    const response = await api.get("/me/cart");
    return normalizeUserCartResponse(response);
  }

  static async addToUserCart(productId: string, quantity: number, lang: string = 'tr') {
    try {
      await api.post("/me/cart", {
        productId,
        quantity,
      }, {
        params: { lang }
      });
    } catch (error: any) {
      // Backend'den gelen hata response'unu olduğu gibi fırlat
      // useCartState hook'u bunu handle edecek
      throw error;
    }
  }

  static async updateUserCartItem(itemId: string, quantity: number, lang: string = 'tr') {
    try {
      await api.put(`/me/cart/${itemId}`, { quantity }, {
        params: { lang }
      });
    } catch (error: any) {
      // Backend'den gelen hata response'unu olduğu gibi fırlat
      // useCartState hook'u bunu handle edecek
      throw error;
    }
  }

  static async removeUserCartItem(itemId: string) {
    await api.delete(`/me/cart/${itemId}`);
  }

  static async clearUserCart() {
    await api.delete("/me/cart");
  }

  // Guest cart operations
  static async getGuestCart(guestId: string, language: string) {
    const response = await api.get(`/guest/cart/${guestId}`, {
      params: { lang: language },
    });

    if (response.data.success) {
      return normalizeGuestCartResponse(response);
    }

    return {
      items: [],
      summary: { totalItems: 0, totalAmount: 0, currency: "TRY" },
    };
  }

  static async addToGuestCart(
    guestId: string,
    productId: string,
    quantity: number
  ) {
    await api.post("/guest/cart/add", {
      guestId,
      productId,
      quantity,
    });
  }

  static async updateGuestCartItem(
    guestId: string,
    itemId: string,
    productId: string,
    quantity: number
  ) {
    // Guest endpoint'inde direct update yok, remove edip tekrar add yapıyoruz
    await api.delete(`/guest/cart/${guestId}/${itemId}`);
    await api.post("/guest/cart/add", {
      guestId,
      productId,
      quantity,
    });
  }

  static async removeGuestCartItem(guestId: string, itemId: string) {
    await api.delete(`/guest/cart/${guestId}/${itemId}`);
  }

  static async clearGuestCart(guestId: string, cartItems: CartItem[]) {
    // Guest user - her item'ı tek tek sil (bulk clear endpoint'i yok)
    for (const item of cartItems) {
      await api.delete(`/guest/cart/${guestId}/${item.id}`);
    }
  }

  // Hybrid operations (automatically choose user or guest)
  static async getCart(isUser: boolean, guestId?: string, language?: string) {
    if (isUser) {
      return this.getUserCart();
    } else if (guestId && language) {
      return this.getGuestCart(guestId, language);
    }

    return { items: [], summary: null };
  }

  static async addToCart(
    isUser: boolean,
    productId: string,
    quantity: number,
    guestId?: string,
    lang?: string
  ) {
    if (isUser) {
      return this.addToUserCart(productId, quantity, lang);
    } else if (guestId) {
      return this.addToGuestCart(guestId, productId, quantity);
    }
  }

  static async updateCartItem(
    isUser: boolean,
    itemId: string,
    quantity: number,
    guestId?: string,
    productId?: string,
    lang?: string
  ) {
    if (isUser) {
      return this.updateUserCartItem(itemId, quantity, lang);
    } else if (guestId && productId) {
      return this.updateGuestCartItem(guestId, itemId, productId, quantity);
    }
  }

  static async removeCartItem(
    isUser: boolean,
    itemId: string,
    guestId?: string
  ) {
    if (isUser) {
      return this.removeUserCartItem(itemId);
    } else if (guestId) {
      return this.removeGuestCartItem(guestId, itemId);
    }
  }

  static async clearCart(
    isUser: boolean,
    guestId?: string,
    cartItems?: CartItem[]
  ) {
    if (isUser) {
      return this.clearUserCart();
    } else if (guestId && cartItems) {
      return this.clearGuestCart(guestId, cartItems);
    }
  }
}
