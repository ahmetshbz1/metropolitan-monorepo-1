import type { SQL } from "drizzle-orm";
import { and, eq, inArray } from "drizzle-orm";

import { buildExportFile, type ExportFormat } from "../../../../../shared/application/services/export/export-builder";
import { db } from "../../../../../shared/infrastructure/database/connection";
import {
  addresses,
  orderItems,
  orders,
  productTranslations,
  products,
  users,
} from "../../../../../shared/infrastructure/database/schema";

interface ExportOrdersParams {
  format: ExportFormat;
  status?: string;
  paymentStatus?: string;
}

const DEFAULT_LANGUAGE_CODE = "tr";

const formatDecimal = (value: string | number): string => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return numeric.toFixed(2);
};

const formatOptionalDate = (value: Date | null): string => {
  if (!value) {
    return "";
  }
  return value.toISOString();
};

const formatOptionalString = (value: string | null): string => {
  if (!value) {
    return "";
  }
  return value.trim();
};

const resolveUserFullName = (firstName: string | null, lastName: string | null): string => {
  const parts = [firstName, lastName].filter((part) => part && part.trim().length > 0);
  return parts.length > 0 ? parts.join(" ") : "";
};

const resolveUserType = (value: string | null): string => {
  if (!value) {
    return "Bireysel";
  }
  return value === "corporate" ? "Kurumsal" : "Bireysel";
};

export class AdminExportOrdersService {
  static async execute({ format, status, paymentStatus }: ExportOrdersParams) {
    const conditions: SQL<unknown>[] = [];

    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }

    let ordersQuery = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethodType: orders.paymentMethodType,
        paymentTermDays: orders.paymentTermDays,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        createdAt: orders.createdAt,
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
        customerEmail: users.email,
        customerPhone: users.phoneNumber,
        shippingCity: addresses.city,
        userType: users.userType,
        trackingNumber: orders.trackingNumber,
        shippingCompany: orders.shippingCompany,
        estimatedDelivery: orders.estimatedDelivery,
        cancelledAt: orders.cancelledAt,
        cancelReason: orders.cancelReason,
        notes: orders.notes,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(addresses, eq(orders.shippingAddressId, addresses.id));

    if (conditions.length === 1) {
      ordersQuery = ordersQuery.where(conditions[0]);
    } else if (conditions.length > 1) {
      ordersQuery = ordersQuery.where(and(...conditions));
    }

    const orderRows = await ordersQuery.orderBy(orders.createdAt);
    const orderIds = orderRows.map((row) => row.id);

    const itemSummaryMap: Record<string, string> = {};

    if (orderIds.length > 0) {
      const itemRows = await db
        .select({
          orderId: orderItems.orderId,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          totalPrice: orderItems.totalPrice,
          productCode: products.productCode,
          productName: productTranslations.name,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(
          productTranslations,
          and(
            eq(productTranslations.productId, products.id),
            eq(productTranslations.languageCode, DEFAULT_LANGUAGE_CODE)
          )
        )
        .where(inArray(orderItems.orderId, orderIds));

      const grouped: Record<string, string[]> = {};

      itemRows.forEach((item) => {
        const orderId = item.orderId;
        if (!grouped[orderId]) {
          grouped[orderId] = [];
        }

        const name = item.productName ?? item.productCode ?? "Ürün";
        const quantity = Number(item.quantity);
        const unit = formatDecimal(item.unitPrice);
        const total = formatDecimal(item.totalPrice);

        grouped[orderId].push(`${name} x${quantity} (${unit}) → ${total}`);
      });

      Object.entries(grouped).forEach(([orderId, summaryParts]) => {
        itemSummaryMap[orderId] = summaryParts.join(" | ");
      });
    }

    const exportRows = orderRows.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: formatOptionalString(order.paymentMethodType),
      paymentTermDays: order.paymentTermDays ?? "",
      totalAmount: formatDecimal(order.totalAmount),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      customerName: resolveUserFullName(order.customerFirstName, order.customerLastName),
      customerEmail: order.customerEmail,
      customerPhone: formatOptionalString(order.customerPhone),
      shippingCity: order.shippingCity,
      userType: resolveUserType(order.userType),
      trackingNumber: formatOptionalString(order.trackingNumber),
      shippingCompany: formatOptionalString(order.shippingCompany),
      estimatedDelivery: formatOptionalDate(order.estimatedDelivery),
      cancelledAt: formatOptionalDate(order.cancelledAt),
      cancelReason: formatOptionalString(order.cancelReason),
      notes: formatOptionalString(order.notes),
      itemSummary: itemSummaryMap[order.id] ?? "",
    }));

    const exportFile = await buildExportFile({
      sheetName: "Orders",
      columns: [
        { header: "Sipariş No", key: "orderNumber", width: 18 },
        { header: "Durum", key: "status", width: 16 },
        { header: "Ödeme Durumu", key: "paymentStatus", width: 18 },
        { header: "Ödeme Yöntemi", key: "paymentMethod", width: 20 },
        { header: "Ödeme Vadesi", key: "paymentTermDays", width: 16 },
        { header: "Tutar", key: "totalAmount", width: 14 },
        { header: "Para Birimi", key: "currency", width: 12 },
        { header: "Oluşturulma", key: "createdAt", width: 24 },
        { header: "Müşteri", key: "customerName", width: 26 },
        { header: "E-posta", key: "customerEmail", width: 26 },
        { header: "Telefon", key: "customerPhone", width: 18 },
        { header: "Şehir", key: "shippingCity", width: 18 },
        { header: "Kullanıcı Tipi", key: "userType", width: 16 },
        { header: "Takip No", key: "trackingNumber", width: 20 },
        { header: "Kargo Firması", key: "shippingCompany", width: 20 },
        { header: "Tahmini Teslim", key: "estimatedDelivery", width: 24 },
        { header: "İptal Tarihi", key: "cancelledAt", width: 24 },
        { header: "İptal Nedeni", key: "cancelReason", width: 24 },
        { header: "Notlar", key: "notes", width: 30 },
        { header: "Ürünler", key: "itemSummary", width: 60 },
      ],
      rows: exportRows,
      format,
    });

    return exportFile;
  }
}
