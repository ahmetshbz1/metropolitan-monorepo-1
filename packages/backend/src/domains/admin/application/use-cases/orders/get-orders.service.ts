import { desc, eq, sql, inArray, and } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { orders, orderItems, users, addresses, products, productTranslations } from "../../../../../shared/infrastructure/database/schema";

export interface AdminOrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  currency: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingCity: string;
  itemCount: number;
  items: AdminOrderItem[];
}

export interface GetOrdersFilters {
  status?: string;
  paymentStatus?: string;
  limit?: number;
  offset?: number;
}

export class GetAdminOrdersService {
  static async execute(filters: GetOrdersFilters = {}): Promise<{ orders: AdminOrder[]; total: number }> {
    try {
      const { status, paymentStatus, limit = 50, offset = 0 } = filters;

      const ordersData = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          totalAmount: orders.totalAmount,
          currency: orders.currency,
          createdAt: orders.createdAt,
          customerName: sql<string>`concat_ws(' ', ${users.firstName}, ${users.lastName})`,
          customerEmail: users.email,
          customerPhone: users.phoneNumber,
          shippingCity: addresses.city,
        })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .innerJoin(addresses, eq(orders.shippingAddressId, addresses.id))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

    const orderIds = ordersData.map((o) => o.id);

    let itemsData: Array<{
      orderId: string;
      id: string;
      productId: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      productImage: string | null;
      productName: string | null;
    }> = [];

    if (orderIds.length > 0) {
      const itemsRaw = await db
        .select({
          orderId: orderItems.orderId,
          id: orderItems.id,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          totalPrice: orderItems.totalPrice,
          productImage: products.imageUrl,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, orderIds));

      const productIds = [...new Set(itemsRaw.map((item) => item.productId))];

      const translations = await db
        .select({
          productId: productTranslations.productId,
          name: productTranslations.name,
        })
        .from(productTranslations)
        .where(
          and(
            inArray(productTranslations.productId, productIds),
            eq(productTranslations.languageCode, "tr")
          )
        );

      const translationsMap: Record<string, string> = {};
      for (const trans of translations) {
        translationsMap[trans.productId] = trans.name;
      }

      itemsData = itemsRaw.map((item) => ({
        ...item,
        productName: translationsMap[item.productId] || null,
      }));
    }

    const itemsByOrder: Record<string, AdminOrderItem[]> = {};
    for (const item of itemsData) {
      if (!itemsByOrder[item.orderId]) {
        itemsByOrder[item.orderId] = [];
      }
      itemsByOrder[item.orderId].push({
        id: item.id,
        productId: item.productId,
        productName: item.productName || "Unknown Product",
        productImage: item.productImage,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });
    }

    const result: AdminOrder[] = ordersData.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      currency: order.currency,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingCity: order.shippingCity,
      itemCount: itemsByOrder[order.id]?.length || 0,
      items: itemsByOrder[order.id] || [],
    }));

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders);

      return {
        orders: result,
        total: Number(totalResult[0]?.count || 0),
      };
    } catch (error) {
      console.error("GetAdminOrdersService error:", error);
      throw error;
    }
  }
}
