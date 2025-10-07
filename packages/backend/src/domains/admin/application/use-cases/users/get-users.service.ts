import { desc, eq, sql, and, or, ilike } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { db } from "../../../../../shared/infrastructure/database/connection";
import { users, companies } from "../../../../../shared/infrastructure/database/schema";

export interface AdminUser {
  id: string;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  userType: "individual" | "corporate";
  companyName: string | null;
  companyNip: string | null;
  authProvider: string | null;
  marketingConsent: boolean;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface GetUsersFilters {
  userType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class GetAdminUsersService {
  static async execute(filters: GetUsersFilters = {}): Promise<{ users: AdminUser[]; total: number }> {
    try {
      const { userType, search, limit = 50, offset = 0 } = filters;

      const conditions: SQL<unknown>[] = [];

      if (userType) {
        conditions.push(eq(users.userType, userType));
      }

      if (search) {
        conditions.push(
          or(
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`),
            ilike(users.email, `%${search}%`),
            ilike(users.phoneNumber, `%${search}%`)
          )!
        );
      }

      const whereClause =
        conditions.length === 0
          ? undefined
          : conditions.length === 1
            ? conditions[0]
            : and(...conditions);

      let usersQuery = db
        .select({
          id: users.id,
          phoneNumber: users.phoneNumber,
          phoneNumberVerified: users.phoneNumberVerified,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          userType: users.userType,
          companyId: users.companyId,
          authProvider: users.authProvider,
          marketingConsent: users.marketingConsent,
          createdAt: users.createdAt,
          deletedAt: users.deletedAt,
          companyName: companies.name,
          companyNip: companies.nip,
        })
        .from(users)
        .leftJoin(companies, eq(users.companyId, companies.id));

      if (whereClause) {
        usersQuery = usersQuery.where(whereClause);
      }

      const usersData = await usersQuery
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      const result: AdminUser[] = usersData.map((user) => ({
        id: user.id,
        phoneNumber: user.phoneNumber,
        phoneNumberVerified: user.phoneNumberVerified,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType === "corporate" ? "corporate" : "individual",
        companyName: user.companyName,
        companyNip: user.companyNip,
        authProvider: user.authProvider,
        marketingConsent: user.marketingConsent,
        createdAt: user.createdAt,
        deletedAt: user.deletedAt,
      }));

      let totalQuery = db.select({ count: sql<number>`count(*)` }).from(users);

      if (whereClause) {
        totalQuery = totalQuery.where(whereClause);
      }

      const totalResult = await totalQuery;

      return {
        users: result,
        total: Number(totalResult[0]?.count || 0),
      };
    } catch (error) {
      console.error("GetAdminUsersService error:", error);
      throw error;
    }
  }
}
