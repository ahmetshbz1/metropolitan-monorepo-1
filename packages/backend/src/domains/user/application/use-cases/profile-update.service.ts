//  "profile-update.service.ts"
//  metropolitan backend
//  Created by Ahmet on 05.06.2025, last modified on 15.07.2025.

import type {
  ProfileResponse,
  ProfileUpdateResponse,
  UpdateProfileRequest,
} from "@metropolitan/shared/types/user";
import { eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import { users } from "../../../../shared/infrastructure/database/schema";

export class ProfileUpdateService {
  /**
   * Kullanıcı profil bilgilerini getirir
   */
  static async getUserProfile(userId: string): Promise<ProfileResponse> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        company: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email || "",
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phoneNumber,
        phoneNumber: user.phoneNumber, // API compat için
        profilePhotoUrl: user.profilePhotoUrl,
        userType: user.userType as "individual" | "corporate",
        companyInfo:
          user.userType === "corporate" && user.company
            ? {
                id: user.company.id,
                name: user.company.name,
                nip: user.company.nip,
              }
            : null,
      },
    };
  }

  /**
   * Profil güncelleme verilerini validate eder
   */
  static validateUpdateData(request: UpdateProfileRequest) {
    const { firstName, lastName, email } = request;

    // Sadece sağlanan alanlarla güncelleme objesi oluştur
    const updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;

    // Veri sağlanmadıysa güncellemeye izin verme
    if (Object.keys(updateData).length === 1) {
      throw new Error("No fields to update provided.");
    }

    return updateData;
  }

  /**
   * Kullanıcı profilini günceller
   */
  static async updateUserProfile(
    userId: string,
    request: UpdateProfileRequest
  ): Promise<ProfileUpdateResponse> {
    // Güncelleme verilerini validate et
    const updateData = this.validateUpdateData(request);

    // Kullanıcıyı güncelle
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser[0]) {
      throw new Error("User not found to update.");
    }

    const updated = updatedUser[0];
    return {
      success: true,
      message: "Profile updated successfully.",
      data: {
        id: updated.id,
        email: updated.email || "",
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phoneNumber,
        phoneNumber: updated.phoneNumber, // API compat için
        profilePhotoUrl: updated.profilePhotoUrl,
        userType: updated.userType as "individual" | "corporate",
      },
    };
  }

  /**
   * Kullanıcının var olup olmadığını kontrol eder
   */
  static async checkUserExists(userId: string): Promise<boolean> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true },
    });

    return !!user;
  }
}
