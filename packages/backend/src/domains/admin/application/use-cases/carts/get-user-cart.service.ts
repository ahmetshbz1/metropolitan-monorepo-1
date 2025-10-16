import { desc, eq, and } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  cartItems,
  users,
  products,
  productTranslations,
} from "../../../../../shared/infrastructure/database/schema";

export interface UserCartDetails {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string;
  userType: "individual" | "corporate";
  items: Array<{
    id: string;
    productId: string;
    productName: string | null;
    productCode: string;
    productImage: string | null;
    price: string | null;
    quantity: number;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  summary: {
    totalItems: number;
    totalAmount: number;
    itemCount: number;
  };
}

export class GetUserCartService {
  static async execute(userId: string): Promise<UserCartDetails> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const userCartItems = await db
        .select({
          id: cartItems.id,
          productId: products.id,
          productName: productTranslations.name,
          productCode: products.productCode,
          productImage: products.imageUrl,
          price: products.price,
          individualPrice: products.individualPrice,
          corporatePrice: products.corporatePrice,
          quantity: cartItems.quantity,
          createdAt: cartItems.createdAt,
          updatedAt: cartItems.updatedAt,
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

      let totalAmount = 0;
      let totalItems = 0;

      const items = userCartItems.map((item) => {
        let finalPrice = Number(item.price || 0);
        if (user.userType === "corporate" && item.corporatePrice) {
          finalPrice = Number(item.corporatePrice);
        } else if (user.userType === "individual" && item.individualPrice) {
          finalPrice = Number(item.individualPrice);
        }

        const itemTotalPrice = finalPrice * item.quantity;
        totalAmount += itemTotalPrice;
        totalItems += item.quantity;

        return {
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          productImage: item.productImage,
          price: item.price,
          quantity: item.quantity,
          totalPrice: itemTotalPrice,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      });

      const userName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName;

      return {
        userId: user.id,
        userName,
        userEmail: user.email,
        userPhone: user.phoneNumber,
        userType: user.userType === "corporate" ? "corporate" : "individual",
        items,
        summary: {
          totalItems,
          totalAmount,
          itemCount: items.length,
        },
      };
    } catch (error) {
      console.error("GetUserCartService error:", error);
      throw error;
    }
  }
}
