//  "invoice-formatter.service.ts"
//  metropolitan backend
//  Service for formatting invoice data

import type { InvoiceData } from "@metropolitan/shared/types/order";
import { VatCalculatorService } from "../../../domain/services/vat-calculator.service";
import { SELLER_CONFIG } from "../../../domain/config/seller.config";

export class InvoiceFormatterService {
  /**
   * Format the final invoice data structure
   */
  static format(
    order: any,
    items: any[],
    invoiceNumber: string
  ): InvoiceData {
    const { netAmount, vatAmount } = VatCalculatorService.calculate(Number(order.totalAmount));
    
    return {
      invoiceNumber,
      orderNumber: order.orderNumber,
      issueDate: order.createdAt.toISOString(),
      dueDate: this.calculateDueDate(order.createdAt).toISOString(),
      
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
   * Calculate due date (30 days from issue date)
   */
  private static calculateDueDate(issueDate: Date): Date {
    return new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
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
    const vatRatePercentage = VatCalculatorService.getVatRatePercentage();
    
    return items.map((item) => ({
      description:
        item.product.name || `${item.product.brand} ${item.product.size}`,
      productCode: item.product.productCode,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      vatRate: vatRatePercentage,
    }));
  }
}