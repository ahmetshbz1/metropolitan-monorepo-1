//  "profile-completion.service.ts"
//  metropolitan backend
//  Created by Ahmet on 14.06.2025.
//  Refactored to use modular services

import type {
  CompleteProfilePayload as CompleteProfileRequest,
  NipVerificationResult,
} from "@metropolitan/shared/types/user";

import { AddressManagementService } from "./address-management.service";
import { CompanyManagementService } from "./company-management.service";
import { NipVerificationService } from "./nip-verification.service";
import { UserProfileOperationsService } from "./user-profile-operations.service";

interface ProfileCompletionResponse {
  success: boolean;
  message: string;
  token?: string;
}

/**
 * Profile Completion Service Coordinator
 * Orchestrates the profile completion flow using specialized services
 */
export class ProfileCompletionService {
  /**
   * NIP doğrulama ve şirket bilgisi alma
   * @deprecated Use NipVerificationService.verifyNip directly
   */
  static async verifyNip(nip: string): Promise<NipVerificationResult> {
    return NipVerificationService.verifyNip(nip);
  }

  /**
   * Şirket bulma veya oluşturma
   * @deprecated Use CompanyManagementService.findOrCreateCompany directly
   */
  static async findOrCreateCompany(nip: string, companyName: string) {
    return CompanyManagementService.findOrCreateCompany(nip, companyName);
  }

  /**
   * Kullanıcı profilini tamamlama
   * @deprecated Use UserProfileOperationsService.completeUserProfile directly
   */
  static async completeUserProfile(
    phoneNumber: string,
    userType: "individual" | "corporate",
    request: CompleteProfileRequest,
    companyId: string | null
  ) {
    return UserProfileOperationsService.completeUserProfile(
      phoneNumber,
      userType,
      request,
      companyId
    );
  }

  /**
   * Tam profil tamamlama işlemi (B2B flow)
   */
  static async completeProfile(
    phoneNumber: string,
    profileData: CompleteProfileRequest,
    jwt: any
  ): Promise<ProfileCompletionResponse> {
    // 1. Validate terms acceptance
    UserProfileOperationsService.validateTermsAcceptance(profileData.termsAccepted);

    let companyId: string | null = null;
    let nipValidation: any = null;

    // 2. Handle corporate profile flow
    if (profileData.userType === "corporate") {
      if (!profileData.nip) {
        throw new Error("Kurumsal hesap için NIP gereklidir.");
      }

      // Validate NIP and get company info
      nipValidation = await NipVerificationService.validateNipForRegistration(
        profileData.nip
      );

      // Find or create company
      const company = await CompanyManagementService.findOrCreateCompany(
        profileData.nip,
        nipValidation.companyName
      );

      companyId = company.id;
    }

    // 3. Update user profile
    const updatedUser = await UserProfileOperationsService.updateProfileWithTerms(
      phoneNumber,
      profileData.userType,
      {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        companyId: companyId,
      }
    );

    // 4. Create billing address for corporate users
    if (
      profileData.userType === "corporate" &&
      nipValidation &&
      nipValidation.workingAddress
    ) {
      await AddressManagementService.createBillingAddress(
        updatedUser.id,
        nipValidation.workingAddress
      );
    }

    // 5. Generate login token
    const token = await jwt.sign({
      userId: updatedUser.id,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    });

    return {
      success: true,
      message: "Profil başarıyla tamamlandı.",
      token,
    };
  }

  /**
   * Complete individual profile
   */
  static async completeIndividualProfile(
    phoneNumber: string,
    profileData: CompleteProfileRequest,
    jwt: any
  ): Promise<ProfileCompletionResponse> {
    // Ensure it's individual type
    if (profileData.userType !== "individual") {
      throw new Error("Bu metod sadece bireysel hesaplar içindir.");
    }

    return this.completeProfile(phoneNumber, profileData, jwt);
  }

  /**
   * Complete corporate profile
   */
  static async completeCorporateProfile(
    phoneNumber: string,
    profileData: CompleteProfileRequest,
    jwt: any
  ): Promise<ProfileCompletionResponse> {
    // Ensure it's corporate type
    if (profileData.userType !== "corporate") {
      throw new Error("Bu metod sadece kurumsal hesaplar içindir.");
    }

    if (!profileData.nip) {
      throw new Error("Kurumsal hesap için NIP gereklidir.");
    }

    return this.completeProfile(phoneNumber, profileData, jwt);
  }
}
