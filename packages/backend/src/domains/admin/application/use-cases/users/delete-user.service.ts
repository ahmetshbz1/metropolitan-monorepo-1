import { eq } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { users } from "../../../../../shared/infrastructure/database/schema";
import { logger } from "../../../../../shared/infrastructure/monitoring/logger.config";

export class DeleteUserService {
  static async execute(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (existingUser.length === 0) {
        throw new Error("Kullanıcı bulunamadı");
      }

      await db
        .update(users)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return {
        success: true,
        message: "Kullanıcı başarıyla silindi (soft delete)",
      };
    } catch (error) {
      logger.error({ error, context: "DeleteUserService" }, "DeleteUserService error");
      throw error;
    }
  }
}
