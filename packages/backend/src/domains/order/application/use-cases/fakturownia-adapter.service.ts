//  "fakturownia-adapter.service.ts"
//  metropolitan backend
//  Created by Ahmet on 20.07.2025.

import type { InvoiceData } from "@metropolitan/shared/types/order";

import type {
  FakturowniaInvoice,
  FakturowniaInvoiceItem,
} from "../../../../shared/infrastructure/external/fakturownia.service";

export class FakturowniaAdapterService {
  /**
   * InvoiceData'yı Fakturownia API formatına çevirir
   */
  static convertToFakturowniaFormat(
    invoiceData: InvoiceData
  ): FakturowniaInvoice {
    // Pozisyonları Fakturownia formatına çevir
    const positions: FakturowniaInvoiceItem[] = invoiceData.items.map(
      (item) => ({
        name: `${item.description} (${item.productCode})`,
        tax: item.vatRate, // %23 -> 23
        total_price_gross: item.totalPrice,
        quantity: item.quantity,
        kind: "service", // Hizmet olarak tanımla
      })
    );

    // Ana fatura objesi
    const fakturowniaInvoice: FakturowniaInvoice = {
      kind: "vat", // VAT faturası
      sell_date: this.formatDateForFakturownia(invoiceData.issueDate),
      buyer_name: invoiceData.buyer.name,
      buyer_street: invoiceData.buyer.address,
      buyer_city: invoiceData.buyer.city,
      buyer_post_code: invoiceData.buyer.postalCode,
      buyer_country: invoiceData.buyer.country,
      buyer_tax_no: invoiceData.buyer.nip || undefined,
      buyer_email: invoiceData.buyer.email || undefined,
      buyer_phone: invoiceData.buyer.phone || undefined,
      payment_type: this.mapPaymentMethod(invoiceData.paymentMethod),
      payment_to: this.formatDateForFakturownia(invoiceData.dueDate),
      positions,
    };

    return fakturowniaInvoice;
  }

  /**
   * ISO date string'i Fakturownia formatına çevirir (YYYY-MM-DD)
   */
  private static formatDateForFakturownia(isoDateString: string): string {
    try {
      const date = new Date(isoDateString);
      return date.toISOString().split("T")[0]; // YYYY-MM-DD formatı
    } catch (error) {
      console.error("Date formatting error:", error);
      return new Date().toISOString().split("T")[0]; // Fallback to today
    }
  }

  /**
   * Payment method'u Fakturownia formatına çevirir
   */
  private static mapPaymentMethod(paymentMethod: string): string {
    switch (paymentMethod.toLowerCase()) {
      case "card":
      case "credit_card":
        return "card";
      case "transfer":
      case "bank_transfer":
        return "transfer";
      case "cash":
        return "cash";
      case "blik":
        return "blik";
      case "apple_pay":
        return "card"; // Apple Pay kart ödemesi olarak göster
      case "google_pay":
        return "card"; // Google Pay kart ödemesi olarak göster
      default:
        return "transfer"; // Default olarak havale
    }
  }

  /**
   * Payment method için Fakturownia'da özel etiket oluşturur
   */
  private static getPaymentLabel(paymentMethod: string): string {
    switch (paymentMethod.toLowerCase()) {
      case "bank_transfer":
        return "Płatność: Przelew";
      case "card":
        return "Płatność: Karta";
      case "blik":
        return "Płatność: BLIK";
      case "cash":
        return "Płatność: Gotówka";
      default:
        return "Płatność: Przelew"; // Default olarak havale
    }
  }

  /**
   * Fakturownia response'unu InvoiceData uyumlu formata çevirir (opsiyonel)
   */
  static convertFromFakturowniaResponse(
    fakturowniaResponse: any,
    originalInvoiceData: InvoiceData
  ): Partial<InvoiceData> {
    return {
      ...originalInvoiceData,
      invoiceNumber: fakturowniaResponse.number,
      issueDate: fakturowniaResponse.sell_date,
      totalAmount: parseFloat(fakturowniaResponse.total_price_gross),
    };
  }

  /**
   * Müşteri bilgilerini Fakturownia client formatına çevirir
   */
  static convertToFakturowniaClient(invoiceData: InvoiceData) {
    return {
      name: invoiceData.buyer.name,
      street: invoiceData.buyer.address,
      city: invoiceData.buyer.city,
      post_code: invoiceData.buyer.postalCode,
      country: invoiceData.buyer.country,
      tax_no: invoiceData.buyer.nip || undefined,
      email: invoiceData.buyer.email || undefined,
      phone: invoiceData.buyer.phone || undefined,
    };
  }

  /**
   * Fatura numarası generate eder (Fakturownia kendi oluşturmazsa)
   */
  static generateInvoiceNumber(orderNumber: string): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    return `MET/${year}/${month}/${orderNumber}`;
  }

  /**
   * Validation: InvoiceData'nın Fakturownia için uygunluğunu kontrol eder
   */
  static validateForFakturownia(invoiceData: InvoiceData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Zorunlu alanları kontrol et
    if (!invoiceData.buyer.name) {
      errors.push("Alıcı adı eksik");
    }

    if (!invoiceData.buyer.address) {
      errors.push("Alıcı adresi eksik");
    }

    if (!invoiceData.buyer.city) {
      errors.push("Alıcı şehri eksik");
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      errors.push("Fatura kalemleri eksik");
    }

    // Items validation
    invoiceData.items.forEach((item, index) => {
      if (!item.description) {
        errors.push(`Kalem ${index + 1}: Açıklama eksik`);
      }
      if (item.quantity <= 0) {
        errors.push(`Kalem ${index + 1}: Geçersiz miktar`);
      }
      if (item.totalPrice <= 0) {
        errors.push(`Kalem ${index + 1}: Geçersiz tutar`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
