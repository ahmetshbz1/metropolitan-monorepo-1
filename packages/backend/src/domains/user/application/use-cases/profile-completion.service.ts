//  "profile-completion.service.ts"
//  metropolitan backend
//  Created by Ahmet on 14.06.2025.

import type {
  CompanyInfo,
  CompleteProfilePayload as CompleteProfileRequest,
  NipVerificationResult,
} from "@metropolitan/shared/types/user";
import { and, eq } from "drizzle-orm";

import { db } from "../../../../shared/infrastructure/database/connection";
import {
  addresses,
  companies,
  users,
} from "../../../../shared/infrastructure/database/schema";
import { verifyNipAndGetName } from "../../../../shared/infrastructure/external/nip.service";

interface ProfileCompletionResponse {
  success: boolean;
  message: string;
  token?: string;
}

/**
 * Polish address format'ını parse eder
 * Format: "ŚWIĘTOKRZYSKA 36, 00-116 WARSZAWA"
 */
function parsePolishAddress(workingAddress: string) {
  // Regular expression to match Polish address format
  // Captures: street, postal code, city
  const addressRegex = /^(.+?),\s*(\d{2}-\d{3})\s+(.+)$/;
  const match = workingAddress.match(addressRegex);

  if (match) {
    return {
      street: match[1]!.trim(),
      postalCode: match[2]!.trim(),
      city: match[3]!.trim(),
      country: "Poland",
    };
  }

  // Fallback: full address as street if parsing fails
  return {
    street: workingAddress,
    postalCode: "",
    city: "",
    country: "Poland",
  };
}

export class ProfileCompletionService {
  /**
   * NIP doğrulama ve şirket bilgisi alma
   */
  static async verifyNip(nip: string): Promise<NipVerificationResult> {
    try {
      const nipInfo = await verifyNipAndGetName(nip);

      if (!nipInfo.success || !nipInfo.companyName) {
        return {
          success: false,
          message: nipInfo.message || "Invalid NIP.",
        };
      }

      // VAT durumu kontrolü
      if (nipInfo.statusVat !== "Czynny") {
        return {
          success: false,
          message:
            "Bu şirket VAT açısından aktif değil. Sadece aktif şirketler kayıt olabilir.",
        };
      }

      return {
        success: true,
        companyName: nipInfo.companyName,
      };
    } catch (_error) {
      return {
        success: false,
        message: "NIP verification failed",
      };
    }
  }

  /**
   * Şirket bulma veya oluşturma
   */
  static async findOrCreateCompany(
    nip: string,
    companyName: string
  ): Promise<CompanyInfo> {
    // Mevcut şirketi ara
    let company = await db.query.companies.findFirst({
      where: eq(companies.nip, nip),
    });

    // Şirket yoksa oluştur
    if (!company) {
      const newCompany = await db
        .insert(companies)
        .values({
          name: companyName,
          nip: nip,
        })
        .returning();

      company = newCompany[0];
    }

    if (!company) {
      throw new Error("Şirket bilgisi oluşturulamadı veya bulunamadı.");
    }

    return company;
  }

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
   * Tam profil tamamlama işlemi (B2B flow)
   */
  static async completeProfile(
    phoneNumber: string,
    profileData: CompleteProfileRequest,
    jwt: any
  ): Promise<ProfileCompletionResponse> {
    // 1. Şartları kabul etmiş mi kontrol et
    if (!profileData.termsAccepted) {
      throw new Error(
        "Kullanım koşulları ve gizlilik politikasını kabul etmelisiniz."
      );
    }

    let companyId: string | null = null;

    let nipValidation: any = null;
    if (profileData.userType === "corporate") {
      if (!profileData.nip) {
        throw new Error("Kurumsal hesap için NIP gereklidir.");
      }

      // 2a. NIP doğrulama
      nipValidation = await verifyNipAndGetName(profileData.nip);
      if (!nipValidation.success || !nipValidation.companyName) {
        throw new Error(nipValidation.message || "Geçersiz NIP.");
      }

      // 3a. VAT durumu kontrolü
      if (nipValidation.statusVat !== "Czynny") {
        throw new Error(
          "Bu şirket VAT açısından aktif değil. Sadece aktif şirketler kayıt olabilir."
        );
      }

      // 4a. Şirketi bul veya oluştur
      let company = await db.query.companies.findFirst({
        where: eq(companies.nip, profileData.nip),
      });

      if (!company) {
        const newCompany = await db
          .insert(companies)
          .values({
            name: nipValidation.companyName,
            nip: profileData.nip,
          })
          .returning();
        company = newCompany[0];
      }

      if (!company) {
        throw new Error("Şirket bilgisi oluşturulamadı veya bulunamadı.");
      }

      companyId = company.id;

      // 5a. Şirket adresini fatura adresi olarak kaydet (opsiyonel)
    }

    // 5. Kullanıcı profilini güncelle (her iki kullanıcı tipi için)
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        companyId: companyId,
        termsAcceptedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.phoneNumber, phoneNumber),
          eq(users.userType, profileData.userType)
        )
      )
      .returning({ id: users.id });

    if (!updatedUser) {
      throw new Error("Kullanıcı güncellenirken bir hata oluştu.");
    }

    // Kurumsal ise ve çalışma adresi varsa faturaya ekle
    if (
      profileData.userType === "corporate" &&
      nipValidation &&
      nipValidation.workingAddress
    ) {
      const parsedAddress = parsePolishAddress(nipValidation.workingAddress);
      await db.insert(addresses).values({
        userId: updatedUser.id,
        addressTitle: "Fatura Adresi",
        street: parsedAddress.street,
        city: parsedAddress.city,
        postalCode: parsedAddress.postalCode,
        country: parsedAddress.country,
      });
    }

    // 7. Login token oluştur
    const token = await jwt.sign({
      userId: updatedUser.id,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 gün
    });

    return {
      success: true,
      message: "Profil başarıyla tamamlandı.",
      token,
    };
  }
}
