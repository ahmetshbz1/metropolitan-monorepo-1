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
import {
  generateDeviceFingerprint,
  generateSessionId,
  generateJTI,
  extractDeviceInfo,
  storeDeviceSession,
  storeRefreshToken,
} from "../../../identity/infrastructure/security/device-fingerprint";

interface ProfileCompletionResponse {
  success: boolean;
  message: string;
  token?: string; // Backward compatibility
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
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
    jwt: any,
    headers?: any
  ): Promise<ProfileCompletionResponse> {
    // 1. Validate terms and privacy policy acceptance
    UserProfileOperationsService.validateTermsAcceptance(profileData.termsAccepted);
    UserProfileOperationsService.validatePrivacyAcceptance(profileData.privacyAccepted);

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
        privacyAccepted: profileData.privacyAccepted,
        marketingConsent: profileData.marketingConsent,
        firebaseUid: profileData.firebaseUid,
        authProvider: profileData.authProvider,
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

    // 5. Generate enhanced tokens with device fingerprinting
    let deviceInfo = {};
    let deviceId = "unknown";
    let sessionId = generateSessionId();
    let ipAddress = "unknown";

    if (headers) {
      deviceInfo = extractDeviceInfo(headers);
      deviceId = generateDeviceFingerprint(deviceInfo, headers);
      ipAddress = headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";
    }

    const accessJTI = generateJTI();
    const refreshJTI = generateJTI();

    // Access token (15 minutes)
    const accessTokenPayload = {
      sub: updatedUser.id,
      type: "access",
      sessionId,
      deviceId,
      jti: accessJTI,
      aud: "mobile-app",
      iss: "metropolitan-api",
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    console.log("Creating access token with payload:", { userId: updatedUser.id, type: "access" });
    const accessToken = await jwt.sign(accessTokenPayload);

    // Refresh token (30 days)
    const refreshToken = await jwt.sign({
      sub: updatedUser.id,
      type: "refresh",
      sessionId,
      deviceId,
      jti: refreshJTI,
      aud: "mobile-app",
      iss: "metropolitan-api",
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    });

    // Store device session and refresh token in Redis
    if (headers) {
      await storeDeviceSession(
        updatedUser.id,
        deviceId,
        sessionId,
        deviceInfo,
        ipAddress
      );
      await storeRefreshToken(
        updatedUser.id,
        refreshToken,
        deviceId,
        sessionId,
        refreshJTI
      );
    }

    return {
      success: true,
      message: "Profil başarıyla tamamlandı.",
      token: accessToken, // Backward compatibility
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
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
