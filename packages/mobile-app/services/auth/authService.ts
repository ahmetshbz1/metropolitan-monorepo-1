//  "authService.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { api } from "@/core/api";
import i18n from "@/core/i18n";

// OTP gönder
export const sendOTP = async (
  phoneNumber: string,
  userType: "individual" | "corporate" = "individual"
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post("/auth/send-otp", {
      phoneNumber,
      userType,
      language: i18n.language || "tr", // Send user's language preference
    });
    return { success: true, message: response.data.message };
  } catch (e: any) {
    // Backend returns { message: "..." } for rate limit errors
    const errorMessage = e.response?.data?.message || e.response?.data?.error || e.message || "Bir hata oluştu";
    return { success: false, message: errorMessage };
  }
};

// OTP doğrula
export const verifyOTP = async (
  phoneNumber: string,
  otpCode: string,
  userType: "individual" | "corporate" = "individual",
  socialAuthData?: { uid: string; email?: string; provider: 'apple' | 'google'; appleUserId?: string } | null
): Promise<{
  success: boolean;
  message: string;
  isNewUser: boolean;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  registrationToken?: string;
}> => {
  try {
    const requestBody: any = {
      phoneNumber,
      otpCode,
      userType,
    };

    if (socialAuthData) {
      requestBody.firebaseUid = socialAuthData.uid;
      requestBody.provider = socialAuthData.provider;
      if (socialAuthData.email) requestBody.email = socialAuthData.email;
      if (socialAuthData.appleUserId) requestBody.appleUserId = socialAuthData.appleUserId;
    }

    const response = await api.post("/auth/verify-otp", requestBody);
    const data = response.data;

    if (data.success) {
      // Mevcut kullanıcı - auth tokens döner
      if (data.accessToken || data.token) {
        return {
          success: true,
          message: data.message,
          isNewUser: false,
          token: data.token || data.accessToken, // Backward compatibility
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      }
      // Yeni kullanıcı - geçici registration token döner
      else if (data.registrationToken) {
        return {
          success: true,
          message: data.message,
          isNewUser: true,
          registrationToken: data.registrationToken,
        };
      }
    }

    throw new Error(
      data.message || "Doğrulama başarısız: Sunucudan geçersiz yanıt."
    );
  } catch (e: any) {
    return {
      success: false,
      message: e.response?.data?.message || e.message,
      isNewUser: false,
    };
  }
};

// Çıkış yap
export const logoutFromServer = async (): Promise<void> => {
  try {
    await api.post("/auth/logout");
  } catch (e) {
    // Logout API çağrısı başarısız, yerel çıkış ile devam ediliyor
  }
};