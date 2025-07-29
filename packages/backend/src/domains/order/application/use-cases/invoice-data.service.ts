//  "invoice-data.service.ts"
//  metropolitan backend
//  Orchestrator for invoice data fetching and transformation

import type { InvoiceData } from "@metropolitan/shared/types/order";
import { InvoiceDataRepository } from "../../infrastructure/repositories/invoice-data.repository";
import { InvoiceFormatterService } from "./invoice/invoice-formatter.service";

/**
 * Service for managing invoice data operations
 * Coordinates between repository and formatter services
 */
export class InvoiceDataService {
  /**
   * Fetch and transform invoice data for given order
   */
  static async getInvoiceData(
    orderId: string,
    userId: string
  ): Promise<InvoiceData> {
    // Fetch order details from repository
    const order = await InvoiceDataRepository.fetchOrderDetails(orderId);
    
    if (!order) {
      throw new Error("Sipariş bulunamadı");
    }

    if (order.user.id !== userId) {
      throw new Error("Bu siparişe erişim yetkiniz yok");
    }

    // Fetch order items
    const items = await InvoiceDataRepository.fetchOrderItems(orderId);
    
    // Generate invoice number
    const invoiceNumber = InvoiceFormatterService.generateInvoiceNumber(order.orderNumber);

    // Format and return invoice data
    return InvoiceFormatterService.format(order, items, invoiceNumber);
  }
}