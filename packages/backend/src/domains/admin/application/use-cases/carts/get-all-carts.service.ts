import { desc, eq, sql, and, or, ilike, gt } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  cartItems,
  users,
  products,
  productTranslations,
} from "../../../../../shared/infrastructure/database/schema";

export interface AdminCartItem {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string;
  userType: "individual" | "corporate";
  productId: string;
  productName: string | null;
  productCode: string;
  productImage: string | null;
  price: string | null;
  quantity: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  lastActivityDays: number;
}

export interface GetAllCartsFilters {
  search?: string;
  userType?: string;
  abandonedOnly?: boolean;
  abandonedDays?: number;
  limit?: number;
  offset?: number;
}

export class GetAllCartsService {
  static async execute(
    filters: GetAllCartsFilters = {}
  ): Promise<{ carts: AdminCartItem[]; total: number }> {
    try {
      const {
        search,
        userType,
        abandonedOnly = false,
        abandonedDays = 1,
        limit = 50,
        offset = 0,
      } = filters;

      const conditions: SQL<unknown>[] = [];

      if (userType) {
        conditions.push(eq(users.userType, userType));
      }

      if (abandonedOnly) {
        const abandonedDate = new Date();
        abandonedDate.setDate(abandonedDate.getDate() - abandonedDays);
        conditions.push(sql`${cartItems.updatedAt} < ${abandonedDate}`);
      }

      if (search) {
        conditions.push(
          or(
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.phoneNumber, `%${search}%`),
            ilike(products.productCode, `%${search}%`)
          )!
        );
      }

      const whereClause =
        conditions.length === 0
          ? undefined
          : conditions.length === 1
            ? conditions[0]
            : and(...conditions);

      let cartsQuery = db
        .select({
          id: cartItems.id,
          userId: users.id,
          userName: sql<string>`COALESCE(CONCAT(${users.firstName}, ' ', ${users.lastName}), ${users.firstName}, ${users.lastName})`,
          userEmail: users.email,
          userPhone: users.phoneNumber,
          userType: users.userType,
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
        .innerJoin(users, eq(cartItems.userId, users.id))
        .innerJoin(products, eq(cartItems.productId, products.id))
        .leftJoin(
          productTranslations,
          and(
            eq(productTranslations.productId, products.id),
            eq(productTranslations.languageCode, "tr")
          )
        );

      if (whereClause) {
        cartsQuery = cartsQuery.where(whereClause);
      }

      const cartsData = await cartsQuery
        .orderBy(desc(cartItems.updatedAt))
        .limit(limit)
        .offset(offset);

      const now = new Date();
      const result: AdminCartItem[] = cartsData.map((cart) => {
        const lastActivityMs = now.getTime() - cart.updatedAt.getTime();
        const lastActivityDays = Math.floor(lastActivityMs / (1000 * 60 * 60 * 24));

        let finalPrice = Number(cart.price || 0);
        if (cart.userType === "corporate" && cart.corporatePrice) {
          finalPrice = Number(cart.corporatePrice);
        } else if (cart.userType === "individual" && cart.individualPrice) {
          finalPrice = Number(cart.individualPrice);
        }

        return {
          id: cart.id,
          userId: cart.userId,
          userName: cart.userName,
          userEmail: cart.userEmail,
          userPhone: cart.userPhone,
          userType: cart.userType === "corporate" ? "corporate" : "individual",
          productId: cart.productId,
          productName: cart.productName,
          productCode: cart.productCode,
          productImage: cart.productImage,
          price: cart.price,
          quantity: cart.quantity,
          totalPrice: finalPrice * cart.quantity,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
          lastActivityDays,
        };
      });

      let totalQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(cartItems)
        .innerJoin(users, eq(cartItems.userId, users.id))
        .innerJoin(products, eq(cartItems.productId, products.id));

      if (whereClause) {
        totalQuery = totalQuery.where(whereClause);
      }

      const totalResult = await totalQuery;

      return {
        carts: result,
        total: Number(totalResult[0]?.count || 0),
      };
    } catch (error) {
      console.error("GetAllCartsService error:", error);
      throw error;
    }
  }
}
