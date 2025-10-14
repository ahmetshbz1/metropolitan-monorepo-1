// "data-export.service.ts"
// metropolitan backend
// User data export service (GDPR compliance)

import { exec } from "child_process";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@bogeychan/elysia-logger";
import { db } from "../../../../shared/infrastructure/database/connection";
import {
  addresses,
  orders,
  users,
  orderItems,
} from "../../../../shared/infrastructure/database/schema";

type ExportAddress = typeof addresses.$inferSelect;
type ExportOrderItem = typeof orderItems.$inferSelect;
type ExportOrder = typeof orders.$inferSelect & { items: ExportOrderItem[] };

interface ExportResult {
  downloadUrl?: string;
  requestId?: string;
  password?: string;
}

interface UserDataExport {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    userType: string;
    createdAt: string;
    updatedAt: string;
  };
  addresses: ExportAddress[];
  orders: ExportOrder[];
  preferences: {
    smsNotifications: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    marketingConsent: boolean;
  };
  exportInfo: {
    exportedAt: string;
    exportId: string;
    format: string;
  };
}

const execAsync = promisify(exec);

export class DataExportService {
  /**
   * Export user data based on method (email or download)
   */
  static async exportUserData(
    userId: string,
    method: "email" | "download"
  ): Promise<ExportResult> {
    // Collect user data
    const userData = await this.collectUserData(userId);

    // Generate export file
    const exportId = uuidv4();
    const password = this.generateSecurePassword();
    const jsonFileName = `user_data_${userId}_${Date.now()}.json`;
    const zipFileName = `user_data_${userId}_${Date.now()}.zip`;
    const zipFilePath = path.join(
      process.cwd(),
      "uploads",
      "exports",
      zipFileName
    );

    // Ensure exports directory exists
    const exportsDir = path.dirname(zipFilePath);
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Create encrypted zip file
    await this.createEncryptedZip(
      userData,
      zipFilePath,
      jsonFileName,
      password
    );

    if (method === "email") {
      // Send email with download link and password
      await this.sendExportEmail(
        userData.user.email,
        zipFileName,
        exportId,
        password
      );
      return { requestId: exportId };
    } else {
      // Return direct download URL (relative path without /api prefix)
      const downloadUrl = `/users/download-export/${zipFileName}?token=${exportId}`;
      return { downloadUrl, password };
    }
  }

  /**
   * Generate a secure password for file encryption
   */
  private static generateSecurePassword(): string {
    // Sadece alfanumerik karakterler (shell escape sorunları önlemek için)
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Create an encrypted ZIP file containing user data
   */
  private static async createEncryptedZip(
    userData: UserDataExport,
    zipFilePath: string,
    jsonFileName: string,
    password: string
  ): Promise<void> {
    // Önce JSON dosyasını geçici olarak oluştur
    const tempDir = path.join(process.cwd(), "uploads", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempJsonPath = path.join(tempDir, jsonFileName);
    fs.writeFileSync(tempJsonPath, JSON.stringify(userData, null, 2));

    try {
      // Sistem zip komutu ile şifreli ZIP oluştur
      // Parametreleri ayrı ayrı escape ediyoruz
      const command = `zip -P ${password} -j "${zipFilePath}" "${tempJsonPath}"`;
      logger.info({ zipFilePath, hasPassword: !!password }, "Creating encrypted ZIP");

      await execAsync(command);
      logger.info({ zipFilePath }, "Encrypted ZIP created successfully");
    } catch (error) {
      logger.error({ zipFilePath, error: error instanceof Error ? error.message : String(error) }, "ZIP creation failed");
      throw new Error(`Failed to create encrypted ZIP: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Geçici dosyayı sil
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }
    }
  }

  /**
   * Collect all user data for export
   */
  private static async collectUserData(
    userId: string
  ): Promise<UserDataExport> {
    // Get user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
        smsNotifications: true,
        pushNotifications: true,
        emailNotifications: true,
        marketingConsent: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get user addresses
    const userAddresses = await db.query.addresses.findMany({
      where: eq(addresses.userId, userId),
    });

    // Get user orders with items
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        items: true,
      },
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber,
        userType: user.userType,
        createdAt: user.createdAt?.toISOString() || "",
        updatedAt: user.updatedAt?.toISOString() || "",
      },
      addresses: userAddresses.map((addr) => ({
        id: addr.id,
        title: addr.title,
        firstName: addr.firstName,
        lastName: addr.lastName,
        phoneNumber: addr.phoneNumber,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        isDefault: addr.isDefault,
        createdAt: addr.createdAt?.toISOString(),
      })),
      orders: userOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        createdAt: order.createdAt?.toISOString(),
        items:
          order.items?.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
          })) || [],
      })),
      preferences: {
        smsNotifications: user.smsNotifications,
        pushNotifications: user.pushNotifications,
        emailNotifications: user.emailNotifications,
        marketingConsent: user.marketingConsent,
      },
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportId: uuidv4(),
        format: "JSON",
      },
    };
  }

  /**
   * Send export data via email
   */
  private static async sendExportEmail(
    email: string,
    fileName: string,
    exportId: string
  ): Promise<void> {
    // TODO: Implement email sending
    // This would integrate with your email service (SendGrid, SES, etc.)
    logger.info({ email, fileName, exportId }, "Sending export email");

    // For now, just log the action
    // In production, you'd send an email with a secure download link
  }

  /**
   * Get export status by request ID
   */
  static async getExportStatus(
    requestId: string,
    userId: string
  ): Promise<{
    status: "pending" | "completed" | "expired";
    downloadUrl?: string;
    expiresAt?: string;
  }> {
    // TODO: Implement proper status tracking with database
    // For now, return mock data
    return {
      status: "completed",
      downloadUrl: `/api/users/download-export/user_data_${userId}_${Date.now()}.json?token=${requestId}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
  }
}
