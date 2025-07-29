// "nip-verification.service.ts"
// metropolitan backend
// NIP verification and validation operations

import type { NipVerificationResult } from "@metropolitan/shared/types/user";
import { verifyNipAndGetName } from "../../../../shared/infrastructure/external/nip.service";

export class NipVerificationService {
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
   * Validate NIP for corporate profile completion
   */
  static async validateNipForRegistration(nip: string) {
    const nipValidation = await verifyNipAndGetName(nip);
    
    if (!nipValidation.success || !nipValidation.companyName) {
      throw new Error(nipValidation.message || "Geçersiz NIP.");
    }

    // VAT durumu kontrolü
    if (nipValidation.statusVat !== "Czynny") {
      throw new Error(
        "Bu şirket VAT açısından aktif değil. Sadece aktif şirketler kayıt olabilir."
      );
    }

    return nipValidation;
  }
}