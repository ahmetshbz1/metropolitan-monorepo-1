// "user-profile-operations.service.ts"
// metropolitan backend
// User profile update operations

import type { CompleteProfilePayload as CompleteProfileRequest } from "@metropolitan/shared/types/user";
import { and, eq } from "drizzle-orm";
import { db } from "../../../../shared/infrastructure/database/connection";
import { users } from "../../../../shared/infrastructure/database/schema";

export class UserProfileOperationsService {
  /**
   * Kullanıcı profilini tamamlama
   */
  static async completeUserProfile(
    phoneNumber: string,
    userType: "individual" | "corporate",
    request: CompleteProfileRequest,
    companyId: string | null
  ) {
    const { firstName, lastName, email } = request;

    const updatedUsers = await db
      .update(users)
      .set({
        firstName,
        lastName,
        email,
        companyId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(users.phoneNumber, phoneNumber), eq(users.userType, userType))
      )
      .returning();

    const user = updatedUsers[0];

    if (!user) {
      throw new Error("User not found to update.");
    }

    return user;
  }

  /**
   * Update user profile with terms acceptance
   */
  static async updateProfileWithTerms(
    phoneNumber: string,
    userType: "individual" | "corporate",
    profileData: {
      firstName: string;
      lastName: string;
      email: string;
      companyId: string | null;
    }
  ) {
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        companyId: profileData.companyId,
        termsAcceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.phoneNumber, phoneNumber),
          eq(users.userType, userType)
        )
      )
      .returning({ id: users.id });

    if (!updatedUser) {
      throw new Error("Kullanıcı güncellenirken bir hata oluştu.");
    }

    return updatedUser;
  }

  /**
   * Check if user exists
   */
  static async getUserByPhone(
    phoneNumber: string,
    userType: "individual" | "corporate"
  ) {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.phoneNumber, phoneNumber),
        eq(users.userType, userType)
      ),
    });

    return user;
  }

  /**
   * Validate terms acceptance
   */
  static validateTermsAcceptance(termsAccepted?: boolean): void {
    if (!termsAccepted) {
      throw new Error(
        "Kullanım koşulları ve gizlilik politikasını kabul etmelisiniz."
      );
    }
  }
}