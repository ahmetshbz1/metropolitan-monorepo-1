//  "invoice-data.repository.ts"
//  metropolitan backend
//  Repository for fetching invoice-related data

import { and, eq } from "drizzle-orm";
import { db } from "../../../../shared/infrastructure/database/connection";
import {
  addresses,
  companies,
  orderItems,
  orders,
  productTranslations,
  products,
  users,
} from "../../../../shared/infrastructure/database/schema";

export class InvoiceDataRepository {
  /**
   * Fetch order details with related data
   */
  static async fetchOrderDetails(orderId: string) {
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        notes: orders.notes,
        createdAt: orders.createdAt,
        paymentMethodType: orders.paymentMethodType,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phoneNumber: users.phoneNumber,
        },
        company: {
          id: companies.id,
          name: companies.name,
          nip: companies.nip,
        },
        address: {
          addressTitle: addresses.addressTitle,
          street: addresses.street,
          city: addresses.city,
          postalCode: addresses.postalCode,
          country: addresses.country,
        },
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .leftJoin(companies, eq(users.companyId, companies.id))
      .innerJoin(addresses, eq(orders.shippingAddressId, addresses.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    return order;
  }

  /**
   * Fetch order items with Polish translations
   */
  static async fetchOrderItems(orderId: string) {
    return db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        product: {
          id: products.id,
          productCode: products.productCode,
          brand: products.brand,
          size: products.size,
          name: productTranslations.name,
        },
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(
        productTranslations,
        and(
          eq(products.id, productTranslations.productId),
          eq(productTranslations.languageCode, "pl")
        )
      )
      .where(eq(orderItems.orderId, orderId));
  }
}