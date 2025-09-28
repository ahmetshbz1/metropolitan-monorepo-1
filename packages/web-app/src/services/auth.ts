// Auth Service for Web App
// Based on mobile-app's authService.ts but adapted for web

import { api } from "@/lib/api";

export interface SendOTPResponse {
  success: boolean;
  message: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  isNewUser: boolean;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  registrationToken?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  userType: "individual" | "corporate";
  companyName?: string;
  taxId?: string;
  isVerified: boolean;
  profilePicture?: string;
}

// OTP gönder
export const sendOTP = async (
  phoneNumber: string,
  userType: "individual" | "corporate" = "individual"
): Promise<SendOTPResponse> => {
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
): Promise<VerifyOTPResponse> => {
  try {
    const response = await api.post("/auth/verify-otp", {
      phoneNumber,
      otpCode,
      userType,
    });
    const data = response.data;

    if (data.success) {
      // Mevcut kullanıcı - auth tokens döner
      if (data.accessToken || data.token) {
        return {
          success: true,
          message: data.message,
          isNewUser: false,
          token: data.token,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      }

      // Yeni kullanıcı - registration token döner
      if (data.registrationToken) {
        return {
          success: true,
          message: data.message,
          isNewUser: true,
          registrationToken: data.registrationToken,
        };
      }
    }

    return { success: false, message: data.message, isNewUser: false };
  } catch (e: any) {
    return {
      success: false,
      message: e.response?.data?.error || e.message,
      isNewUser: false,
    };
  }
};

// Kullanıcı kayıt
export const registerUser = async (
  registrationToken: string,
  userData: {
    firstName: string;
    lastName: string;
    email?: string;
    companyName?: string;
    taxId?: string;
    userType: "individual" | "corporate";
  }
): Promise<LoginResponse> => {
  try {
    const response = await api.post("/auth/register", {
      registrationToken,
      ...userData,
    });

    return {
      success: true,
      message: response.data.message,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: response.data.user,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e.response?.data?.error || e.message,
    };
  }
};

// Kullanıcı profili getir
export const getProfile = async (): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> => {
  try {
    const response = await api.get("/users/me");
    return { success: true, user: response.data };
  } catch (e: any) {
    return {
      success: false,
      message: e.response?.data?.error || e.message,
    };
  }
};

// Logout
export const logout = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    await api.post("/auth/logout");
    return { success: true, message: "Başarıyla çıkış yapıldı" };
  } catch (e: any) {
    return {
      success: false,
      message: e.response?.data?.error || e.message,
    };
  }
};