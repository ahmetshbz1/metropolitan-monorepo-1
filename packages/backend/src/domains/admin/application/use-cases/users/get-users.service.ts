import { desc, eq, sql, and, or, ilike } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { logger } from "../../../../../shared/infrastructure/monitoring/logger.config";
import { db } from "../../../../../shared/infrastructure/database/connection";
import { users, companies } from "../../../../../shared/infrastructure/database/schema";

export interface AdminUser {
  id: string;
  companyId: string | null;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  phoneNumberChangedAt: Date | null;
  previousPhoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  firebaseUid: string | null;
  appleUserId: string | null;
  authProvider: string | null;
  userType: "individual" | "corporate";
  profilePhotoUrl: string | null;
  termsAcceptedAt: Date | null;
  privacyAcceptedAt: Date | null;
  marketingConsentAt: Date | null;
  marketingConsent: boolean;
  shareDataWithPartners: boolean;
  analyticsData: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  companyName: string | null;
  companyNip: string | null;
  createdAt: Date;
  updatedAt: Date;
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
          companyId: users.companyId,
          phoneNumber: users.phoneNumber,
          phoneNumberVerified: users.phoneNumberVerified,
          phoneNumberChangedAt: users.phoneNumberChangedAt,
          previousPhoneNumber: users.previousPhoneNumber,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          firebaseUid: users.firebaseUid,
          appleUserId: users.appleUserId,
          authProvider: users.authProvider,
          userType: users.userType,
          profilePhotoUrl: users.profilePhotoUrl,
          termsAcceptedAt: users.termsAcceptedAt,
          privacyAcceptedAt: users.privacyAcceptedAt,
          marketingConsentAt: users.marketingConsentAt,
          marketingConsent: users.marketingConsent,
          shareDataWithPartners: users.shareDataWithPartners,
          analyticsData: users.analyticsData,
          smsNotifications: users.smsNotifications,
          pushNotifications: users.pushNotifications,
          emailNotifications: users.emailNotifications,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
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
        companyId: user.companyId,
        phoneNumber: user.phoneNumber,
        phoneNumberVerified: user.phoneNumberVerified,
        phoneNumberChangedAt: user.phoneNumberChangedAt,
        previousPhoneNumber: user.previousPhoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        firebaseUid: user.firebaseUid,
        appleUserId: user.appleUserId,
        authProvider: user.authProvider,
        userType: user.userType === "corporate" ? "corporate" : "individual",
        profilePhotoUrl: user.profilePhotoUrl,
        termsAcceptedAt: user.termsAcceptedAt,
        privacyAcceptedAt: user.privacyAcceptedAt,
        marketingConsentAt: user.marketingConsentAt,
        marketingConsent: user.marketingConsent,
        shareDataWithPartners: user.shareDataWithPartners,
        analyticsData: user.analyticsData,
        smsNotifications: user.smsNotifications,
        pushNotifications: user.pushNotifications,
        emailNotifications: user.emailNotifications,
        companyName: user.companyName,
        companyNip: user.companyNip,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
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
      logger.error({ error, context: "GetAdminUsersService" }, "GetAdminUsersService error");
      throw error;
    }
  }
}
