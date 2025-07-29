// invoice-data.service.ts
// Service for fetching and transforming invoice data from database

import type { InvoiceData } from "@metropolitan/shared/types/order";
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

export class InvoiceDataService {
  private static readonly VAT_RATE = 0.23; // Polish standard VAT rate

  /**
   * Fetch and transform invoice data for given order
   */
  static async getInvoiceData(
    orderId: string,
    userId: string
  ): Promise<InvoiceData> {
    const order = await this.fetchOrderDetails(orderId);
    
    if (!order) {
      throw new Error("Sipariş bulunamadı");
    }

    if (order.user.id !== userId) {
      throw new Error("Bu siparişe erişim yetkiniz yok");
    }

    const items = await this.fetchOrderItems(orderId);
    const { netAmount, vatAmount } = this.calculateVat(Number(order.totalAmount));
    const invoiceNumber = this.generateInvoiceNumber(order.orderNumber);

    return this.formatInvoiceData(order, items, {
      invoiceNumber,
      netAmount,
      vatAmount,
    });
  }

  /**
   * Fetch order details with related data
   */
  private static async fetchOrderDetails(orderId: string) {
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
  private static async fetchOrderItems(orderId: string) {
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

  /**
   * Calculate VAT amounts
   */
  private static calculateVat(totalAmount: number) {
    const netAmount = totalAmount / (1 + this.VAT_RATE);
    const vatAmount = totalAmount - netAmount;
    return { netAmount, vatAmount };
  }

  /**
   * Generate invoice number from order number
   */
  private static generateInvoiceNumber(orderNumber: string): string {
    return `FAT-${orderNumber}`;
  }

  /**
   * Format the final invoice data structure
   */
  private static formatInvoiceData(
    order: any,
    items: any[],
    calculations: { invoiceNumber: string; netAmount: number; vatAmount: number }
  ): InvoiceData {
    return {
      invoiceNumber: calculations.invoiceNumber,
      orderNumber: order.orderNumber,
      issueDate: order.createdAt.toISOString(),
      dueDate: new Date(
        order.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),

      seller: this.getSellerInfo(),
      buyer: this.getBuyerInfo(order),
      items: this.formatItems(items),

      netAmount: calculations.netAmount,
      vatAmount: calculations.vatAmount,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,

      notes: order.notes || undefined,
      totalAmountInWords: "TODO",
      paymentMethod: order.paymentMethodType || "transfer",
      accountNumber: "TODO",
    };
  }

  /**
   * Get seller (company) information
   */
  private static getSellerInfo() {
    return {
      name: "Metropolitan Sp. z o.o.",
      address: "ul. Przykładowa 123",
      city: "Warszawa",
      postalCode: "00-001",
      country: "Polska",
      nip: "1234567890",
      email: "info@metropolitan.pl",
      phone: "+48 123 456 789",
    };
  }

  /**
   * Get buyer information from order
   */
  private static getBuyerInfo(order: any) {
    return {
      name:
        order.company?.name ||
        `${order.user.firstName} ${order.user.lastName}`,
      address: order.address.street,
      city: order.address.city,
      postalCode: order.address.postalCode,
      country: order.address.country,
      nip: order.company?.nip || null,
      email: order.user.email || "",
      phone: order.user.phoneNumber,
    };
  }

  /**
   * Format order items for invoice
   */
  private static formatItems(items: any[]) {
    return items.map((item) => ({
      description:
        item.product.name || `${item.product.brand} ${item.product.size}`,
      productCode: item.product.productCode,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      vatRate: this.VAT_RATE * 100,
    }));
  }
}