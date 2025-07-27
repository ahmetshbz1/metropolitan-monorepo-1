//  "authService.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { api } from "@/core/api";

// OTP gönder
export const sendOTP = async (
  phoneNumber: string,
  userType: "individual" | "corporate" = "individual"
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post("/auth/send-otp", {
      phoneNumber,
      userType,
    });
    return { success: true, message: response.data.message };
  } catch (e: any) {
    return { success: false, message: e.response?.data?.error || e.message };
  }
};

// OTP doğrula
export const verifyOTP = async (
  phoneNumber: string,
  otpCode: string,
  userType: "individual" | "corporate" = "individual"
): Promise<{
  success: boolean;
  message: string;
  isNewUser: boolean;
  token?: string;
  registrationToken?: string;
}> => {
  try {
    const response = await api.post("/auth/verify-otp", {
      phoneNumber,
      otpCode,
      userType,
    });
    const data = response.data;

    if (data.success) {
      // Mevcut kullanıcı - final auth token döner
      if (data.token) {
        return {
          success: true,
          message: data.message,
          isNewUser: false,
          token: data.token,
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
    console.error(
      "Logout API çağrısı başarısız, yerel çıkış ile devam ediliyor.",
      e
    );
  }
};