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
    const [result] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        notes: orders.notes,
        createdAt: orders.createdAt,
        paymentMethodType: orders.paymentMethodType,
        // User fields (flat)
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userPhoneNumber: users.phoneNumber,
        // Company fields (flat - leftJoin null olabilir)
        companyId: companies.id,
        companyName: companies.name,
        companyNip: companies.nip,
        // Address fields (flat)
        addressTitle: addresses.addressTitle,
        addressStreet: addresses.street,
        addressCity: addresses.city,
        addressPostalCode: addresses.postalCode,
        addressCountry: addresses.country,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .leftJoin(companies, eq(users.companyId, companies.id))
      .innerJoin(addresses, eq(orders.shippingAddressId, addresses.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!result) {
      throw new Error(`Sipariş bulunamadı: ${orderId}`);
    }

    // Manuel olarak nested format'a dönüştür
    return {
      id: result.id,
      orderNumber: result.orderNumber,
      status: result.status,
      totalAmount: result.totalAmount,
      currency: result.currency,
      notes: result.notes,
      createdAt: result.createdAt,
      paymentMethodType: result.paymentMethodType,
      user: {
        id: result.userId,
        firstName: result.userFirstName,
        lastName: result.userLastName,
        email: result.userEmail,
        phoneNumber: result.userPhoneNumber,
      },
      company: result.companyId ? {
        id: result.companyId,
        name: result.companyName,
        nip: result.companyNip,
      } : null,
      address: {
        addressTitle: result.addressTitle,
        street: result.addressStreet,
        city: result.addressCity,
        postalCode: result.addressPostalCode,
        country: result.addressCountry,
      },
    };
  }

  /**
   * Fetch order items with Polish translations
   */
  static async fetchOrderItems(orderId: string) {
    const results = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        // Product fields (flat)
        productId: products.id,
        productCode: products.productCode,
        productBrand: products.brand,
        productSize: products.size,
        productTax: products.tax,
        fakturowniaProductId: products.fakturowniaProductId,
        // Translation name (leftJoin - null olabilir)
        translationName: productTranslations.name,
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

    if (!results || results.length === 0) {
      throw new Error(`Sipariş kalemleri bulunamadı: ${orderId}`);
    }

    // Manuel olarak nested format'a dönüştür
    return results.map(result => ({
      id: result.id,
      quantity: result.quantity,
      unitPrice: result.unitPrice,
      totalPrice: result.totalPrice,
      product: {
        id: result.productId,
        productCode: result.productCode,
        brand: result.productBrand,
        size: result.productSize,
        tax: result.productTax,
        fakturowniaProductId: result.fakturowniaProductId,
        name: result.translationName,
      },
    }));
  }
}
