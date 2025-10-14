import { eq } from "drizzle-orm";

import { logger } from "../../../../../shared/infrastructure/monitoring/logger.config";
import { db } from "../../../../../shared/infrastructure/database/connection";
import { users } from "../../../../../shared/infrastructure/database/schema";

export interface UpdateUserInput {
  userId: string;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  userType?: "individual" | "corporate";
  companyId?: string | null;
  profilePhotoUrl?: string | null;
  marketingConsent?: boolean;
  shareDataWithPartners?: boolean;
  analyticsData?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
}

export class UpdateUserService {
  static async execute(input: UpdateUserInput): Promise<{ success: boolean; message: string }> {
    try {
      const { userId, ...updateData } = input;

      const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (existingUser.length === 0) {
        throw new Error("Kullanıcı bulunamadı");
      }

      await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return {
        success: true,
        message: "Kullanıcı başarıyla güncellendi",
      };
    } catch (error) {
      logger.error({ error, context: "UpdateUserService" }, "UpdateUserService error");
      throw error;
    }
  }
}
