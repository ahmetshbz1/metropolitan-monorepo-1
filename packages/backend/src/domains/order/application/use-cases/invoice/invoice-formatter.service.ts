//  "invoice-formatter.service.ts"
//  metropolitan backend
//  Service for formatting invoice data

import type { InvoiceData } from "@metropolitan/shared/types/order";

import { SELLER_CONFIG } from "../../../domain/config/seller.config";
import { VatCalculatorService } from "../../../domain/services/vat-calculator.service";

export class InvoiceFormatterService {
  /**
   * Format the final invoice data structure
   */
  static format(order: any, items: any[], invoiceNumber: string): InvoiceData {
    const { netAmount, vatAmount } = VatCalculatorService.calculate(
      Number(order.totalAmount)
    );

    // Vade bilgisini kullan (varsa), yoksa default 7 gün
    const paymentTermDays = order.paymentTermDays || 7;

    return {
      invoiceNumber,
      orderNumber: order.orderNumber,
      issueDate: order.createdAt.toISOString(),
      dueDate: this.calculateDueDate(
        order.createdAt,
        paymentTermDays
      ).toISOString(),
      paymentTermDays,

      seller: this.getSellerInfo(),
      buyer: this.getBuyerInfo(order),
      items: this.formatItems(items),

      netAmount,
      vatAmount,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,

      notes: order.notes || undefined,
      totalAmountInWords: "TODO", // This should be implemented with a number-to-words library
      paymentMethod: order.paymentMethodType || "transfer",
      accountNumber: "TODO", // This should come from configuration
    };
  }

  /**
   * Generate invoice number from order number
   */
  static generateInvoiceNumber(orderNumber: string): string {
    return `FAT-${orderNumber}`;
  }

  /**
   * Calculate due date based on payment terms
   */
  private static calculateDueDate(
    issueDate: Date,
    paymentTermDays: number
  ): Date {
    return new Date(
      issueDate.getTime() + paymentTermDays * 24 * 60 * 60 * 1000
    );
  }

  /**
   * Get seller (company) information from configuration
   */
  private static getSellerInfo() {
    return SELLER_CONFIG;
  }

  /**
   * Get buyer information from order
   */
  private static getBuyerInfo(order: any) {
    if (!order || !order.user || !order.address) {
      throw new Error("Sipariş bilgileri eksik: user veya address bulunamadı");
    }

    return {
      name:
        order.company?.name ||
        `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim(),
      address: order.address.street || "",
      city: order.address.city || "",
      postalCode: order.address.postalCode || "",
      country: order.address.country || "",
      nip: order.company?.nip || null,
      email: order.user.email || "",
      phone: order.user.phoneNumber || "",
    };
  }

  /**
   * Format order items for invoice
   */
  private static formatItems(items: any[]) {
    const defaultVatRate = VatCalculatorService.getVatRatePercentage();

    return items.map((item) => ({
      description:
        item.product.name || `${item.product.brand} ${item.product.size}`,
      productCode: item.product.productCode,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      // Fakturownia'dan sync edilmiş VAT kullan, yoksa product tax, o da yoksa default
      vatRate: item.product.fakturowniaTax
        ? Number(item.product.fakturowniaTax)
        : item.product.tax
        ? Number(item.product.tax)
        : defaultVatRate,
      // Fakturownia product ID varsa ekle
      fakturowniaProductId: item.product.fakturowniaProductId || null,
    }));
  }
}
