//  "admin-user.repository.ts"
//  metropolitan backend
//  Created by OpenAI Codex on 30.12.2025.

import { eq, sql } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import { adminUsers } from "../../../../shared/infrastructure/database/schema";

export type AdminUserRecord = typeof adminUsers.$inferSelect;
export type NewAdminUserRecord = typeof adminUsers.$inferInsert;

interface FailedAttemptUpdate {
  attemptCount: number;
  lockedUntil: Date | null;
}

export interface AdminUserRepositoryPort {
  countAdmins(): Promise<number>;
  findByEmail(email: string): Promise<AdminUserRecord | null>;
  create(admin: NewAdminUserRecord): Promise<AdminUserRecord>;
  registerFailedAttempt(adminId: string, update: FailedAttemptUpdate): Promise<void>;
  markSuccessfulLogin(adminId: string): Promise<void>;
}

export class AdminUserRepository implements AdminUserRepositoryPort {
  constructor(private readonly database = db) {}

  async countAdmins(): Promise<number> {
    const result = await this.database
      .select({ count: sql<number>`count(*)::int` })
      .from(adminUsers);

    return result[0]?.count ?? 0;
  }

  async findByEmail(email: string): Promise<AdminUserRecord | null> {
    const result = await this.database
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  async create(admin: NewAdminUserRecord): Promise<AdminUserRecord> {
    const [created] = await this.database
      .insert(adminUsers)
      .values({
        ...admin,
        email: admin.email,
        createdAt: admin.createdAt ?? new Date(),
        updatedAt: admin.updatedAt ?? new Date(),
      })
      .returning();

    return created;
  }

  async registerFailedAttempt(
    adminId: string,
    update: FailedAttemptUpdate
  ): Promise<void> {
    await this.database
      .update(adminUsers)
      .set({
        failedAttemptCount: update.attemptCount,
        lastFailedAttemptAt: new Date(),
        lockedUntil: update.lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, adminId));
  }

  async markSuccessfulLogin(adminId: string): Promise<void> {
    await this.database
      .update(adminUsers)
      .set({
        failedAttemptCount: 0,
        lastFailedAttemptAt: null,
        lockedUntil: null,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, adminId));
  }
}
