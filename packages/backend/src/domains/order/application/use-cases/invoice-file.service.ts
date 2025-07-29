// invoice-file.service.ts
// Service for managing invoice PDF files on the file system

import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile, unlink } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import { orders } from "../../../../shared/infrastructure/database/schema";

export class InvoiceFileService {
  private static readonly UPLOADS_DIR = "./uploads/invoices";

  /**
   * Get PDF file path (customer ID based organization)
   */
  static getPdfPath(orderId: string, userId?: string): string {
    if (userId) {
      const customerDir = path.join(this.UPLOADS_DIR, userId);
      return path.join(customerDir, `invoice-${orderId}.pdf`);
    }
    // Fallback for legacy system
    return path.join(this.UPLOADS_DIR, `invoice-${orderId}.pdf`);
  }

  /**
   * Ensure uploads directory exists (customer ID based)
   */
  static ensureUploadsDir(userId?: string): void {
    if (userId) {
      const customerDir = path.join(this.UPLOADS_DIR, userId);
      if (!existsSync(customerDir)) {
        mkdirSync(customerDir, { recursive: true });
      }
    } else {
      if (!existsSync(this.UPLOADS_DIR)) {
        mkdirSync(this.UPLOADS_DIR, { recursive: true });
      }
    }
  }

  /**
   * Check if PDF exists on file system
   */
  static async pdfExists(orderId: string, userId?: string): Promise<boolean> {
    const pdfPath = this.getPdfPath(orderId, userId);
    return existsSync(pdfPath);
  }

  /**
   * Read PDF from file system
   */
  static async readPdf(orderId: string, userId?: string): Promise<Buffer> {
    const pdfPath = this.getPdfPath(orderId, userId);
    return readFile(pdfPath);
  }

  /**
   * Save PDF to file system and update database
   */
  static async savePdf(
    orderId: string,
    pdfBuffer: Buffer,
    userId?: string
  ): Promise<void> {
    this.ensureUploadsDir(userId);
    
    const pdfPath = this.getPdfPath(orderId, userId);
    await writeFile(pdfPath, pdfBuffer);

    // Update database with PDF path
    await db
      .update(orders)
      .set({
        invoicePdfPath: pdfPath,
        invoicePdfGeneratedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log(`Fatura kaydedildi: ${pdfPath}`);
  }

  /**
   * Delete PDF from file system
   */
  static async deletePdf(orderId: string, userId?: string): Promise<void> {
    // Try customer-specific path first
    const pdfPath = this.getPdfPath(orderId, userId);
    if (existsSync(pdfPath)) {
      await unlink(pdfPath);
      console.log(`PDF dosyası silindi: ${pdfPath}`);
    }

    // Also check legacy path for backward compatibility
    const legacyPdfPath = this.getPdfPath(orderId);
    if (existsSync(legacyPdfPath) && legacyPdfPath !== pdfPath) {
      await unlink(legacyPdfPath);
      console.log(`Legacy PDF dosyası silindi: ${legacyPdfPath}`);
    }
  }

  /**
   * Get order user ID and PDF path from database
   */
  static async getOrderFileInfo(orderId: string): Promise<{
    userId: string;
    invoicePdfPath: string | null;
  } | null> {
    const [order] = await db
      .select({
        userId: orders.userId,
        invoicePdfPath: orders.invoicePdfPath,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    return order || null;
  }

  /**
   * Clear PDF path from database
   */
  static async clearPdfPath(orderId: string): Promise<void> {
    await db
      .update(orders)
      .set({
        invoicePdfPath: null,
        invoicePdfGeneratedAt: null,
      })
      .where(eq(orders.id, orderId));
  }
}