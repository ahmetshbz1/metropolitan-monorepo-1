//  "invoice.service.ts"
//  metropolitan backend
//  Created by Ahmet on 03.06.2025.

import { existsSync, mkdirSync, readFile, writeFile } from "fs";
import path from "path";
import { promisify } from "util";

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

import { InvoiceCacheService } from "./invoice-cache.service";
import { PDFService } from "./pdf.service";

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);

export class InvoiceService {
  private static readonly UPLOADS_DIR = "./uploads/invoices";

  /**
   * PDF dosya yolunu oluşturur (müşteri ID bazlı organizasyon)
   */
  private static getPdfPath(orderId: string, userId?: string): string {
    if (userId) {
      // Müşteri ID bazlı klasör organizasyonu
      const customerDir = path.join(this.UPLOADS_DIR, userId);
      return path.join(customerDir, `invoice-${orderId}.pdf`);
    }
    // Fallback: eski sistem
    return path.join(this.UPLOADS_DIR, `invoice-${orderId}.pdf`);
  }

  /**
   * Uploads klasörünün var olduğundan emin olur (müşteri ID bazlı)
   */
  private static ensureUploadsDir(userId?: string): void {
    if (userId) {
      // Müşteri ID bazlı klasör
      const customerDir = path.join(this.UPLOADS_DIR, userId);
      if (!existsSync(customerDir)) {
        mkdirSync(customerDir, { recursive: true });
      }
    } else {
      // Ana uploads klasörü
      if (!existsSync(this.UPLOADS_DIR)) {
        mkdirSync(this.UPLOADS_DIR, { recursive: true });
      }
    }
  }

  /**
   * Sipariş ID'sine göre fatura verisini hazırlar
   */
  static async getInvoiceData(
    orderId: string,
    userId: string
  ): Promise<InvoiceData> {
    // Sipariş detaylarını getir
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        notes: orders.notes,
        createdAt: orders.createdAt,
        paymentMethodType: orders.paymentMethodType, // Payment method eklendi
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

    if (!order) {
      throw new Error("Sipariş bulunamadı");
    }

    if (order.user.id !== userId) {
      throw new Error("Bu siparişe erişim yetkiniz yok");
    }

    // Sipariş öğelerini getir (sadece Polonya dili çevirileri)
    const items = await db
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
          eq(productTranslations.languageCode, "pl") // Sadece Polonya dili
        )
      )
      .where(eq(orderItems.orderId, orderId));

    // KDV hesaplama (Polonya'da standart %23)
    const vatRate = 0.23;
    const netAmount = Number(order.totalAmount) / (1 + vatRate);
    const vatAmount = Number(order.totalAmount) - netAmount;

    // Fatura numarası oluştur (sipariş numarasına dayalı)
    const invoiceNumber = `FAT-${order.orderNumber}`;

    return {
      invoiceNumber,
      orderNumber: order.orderNumber,
      issueDate: order.createdAt.toISOString(),
      dueDate: new Date(
        order.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // 30 gün sonra

      // Satıcı bilgileri (şirket bilgileriniz)
      seller: {
        name: "Metropolitan Sp. z o.o.",
        address: "ul. Przykładowa 123",
        city: "Warszawa",
        postalCode: "00-001",
        country: "Polska",
        nip: "1234567890",
        email: "info@metropolitan.pl",
        phone: "+48 123 456 789",
      },

      // Alıcı bilgileri
      buyer: {
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
      },

      // Sipariş öğeleri
      items: items.map((item) => ({
        description:
          item.product.name || `${item.product.brand} ${item.product.size}`,
        productCode: item.product.productCode,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        vatRate: vatRate * 100, // %23
      })),

      // Tutarlar
      netAmount,
      vatAmount,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,

      // Notlar
      notes: order.notes || undefined,
      totalAmountInWords: "TODO", // Bu alanın implementasyonu gerekiyor
      paymentMethod: order.paymentMethodType || "transfer", // Stripe payment method'u kullan
      accountNumber: "TODO", // Bu alanın implementasyonu gerekiyor
    };
  }

  /**
   * Fatura PDF'i oluşturur (hem cache hem de file system ile)
   */
  static async generateInvoicePDF(
    orderId: string,
    userId: string
  ): Promise<Buffer> {
    // Önce cache'den kontrol et
    const cachedPDF = await InvoiceCacheService.getCachedPDF(orderId);
    if (cachedPDF) {
      console.log(`Fatura cache'den geldi: ${orderId}`);
      return cachedPDF;
    }

    // Cache'de yoksa file system'den kontrol et
    const pdfPath = this.getPdfPath(orderId, userId);
    if (existsSync(pdfPath)) {
      console.log(`Fatura file system'den geldi: ${orderId}`);
      const pdfBuffer = await readFileAsync(pdfPath);

      // File system'den aldığımız PDF'i cache'e de koy
      await InvoiceCacheService.cachePDF(orderId, pdfBuffer);

      return pdfBuffer;
    }

    // Ne cache'de ne de file system'de yoksa yeni oluştur
    console.log(`Fatura oluşturuluyor: ${orderId}`);
    const invoiceData = await this.getInvoiceData(orderId, userId);
    const pdfBuffer = await PDFService.generateInvoicePDF(invoiceData, orderId);

    // Müşteri klasörünün var olduğundan emin ol
    this.ensureUploadsDir(userId);

    // PDF'i file system'e kaydet
    await writeFileAsync(pdfPath, pdfBuffer);

    // Veritabanında PDF path'ini güncelle
    await db
      .update(orders)
      .set({
        invoicePdfPath: pdfPath,
        invoicePdfGeneratedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Oluşturulan PDF'i cache'le
    await InvoiceCacheService.cachePDF(orderId, pdfBuffer);

    console.log(`Fatura kaydedildi: ${pdfPath}`);

    return pdfBuffer;
  }

  /**
   * Sipariş güncellendiğinde hem cache'i hem de file system PDF'ini temizle
   */
  static async invalidateInvoice(orderId: string): Promise<void> {
    // PDF ve Fakturownia ID cache'lerini temizle
    await InvoiceCacheService.clearInvoiceAndFakturowniaCache(orderId);

    // Önce siparişi veritabanından al (userId için)
    const [order] = await db
      .select({
        userId: orders.userId,
        invoicePdfPath: orders.invoicePdfPath,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order) {
      // Müşteri ID bazlı PDF yolunu kontrol et
      const pdfPath = this.getPdfPath(orderId, order.userId);
      if (existsSync(pdfPath)) {
        const fs = await import("fs");
        await fs.promises.unlink(pdfPath);
        console.log(`PDF dosyası silindi: ${pdfPath}`);
      }

      // Eski sistem path'ini de kontrol et (backward compatibility)
      const legacyPdfPath = this.getPdfPath(orderId);
      if (existsSync(legacyPdfPath)) {
        const fs = await import("fs");
        await fs.promises.unlink(legacyPdfPath);
        console.log(`Legacy PDF dosyası silindi: ${legacyPdfPath}`);
      }
    }

    // Veritabanından PDF bilgilerini temizle
    await db
      .update(orders)
      .set({
        invoicePdfPath: null,
        invoicePdfGeneratedAt: null,
      })
      .where(eq(orders.id, orderId));
  }

  /**
   * Sipariş güncellendiğinde fatura cache'ini temizle (backward compatibility)
   */
  static async invalidateInvoiceCache(orderId: string): Promise<void> {
    await this.invalidateInvoice(orderId);
  }
}
