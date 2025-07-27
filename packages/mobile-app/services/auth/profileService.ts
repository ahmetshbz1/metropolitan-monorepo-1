//  "profileService.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { api, API_BASE_URL } from "@/core/api";
import { CompleteProfileInput, User } from "@/context/auth/types";

// Kullanıcı verisini işleyip profil resmini oluşturan yardımcı fonksiyon
export const processUserData = (userData: User): User => {
  // Null/undefined kontrolü ekle
  if (!userData) {
    console.error("processUserData: userData is null or undefined");
    return {} as User;
  }

  if (userData.profilePhotoUrl) {
    userData.profilePicture = `${API_BASE_URL}${userData.profilePhotoUrl}`;
  }
  if ((userData as any).phoneNumber) {
    userData.phone = (userData as any).phoneNumber;
  }
  return userData;
};

// Profil tamamla
export const completeProfile = async (
  userData: CompleteProfileInput,
  registrationToken: string
): Promise<{ success: boolean; message: string; token?: string }> => {
  try {
    const response = await api.post(
      "/users/complete-profile",
      {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        userType: userData.userType,
        ...(userData.nip ? { nip: userData.nip } : {}),
        termsAccepted: userData.termsAccepted,
      },
      {
        headers: {
          Authorization: `Bearer ${registrationToken}`,
        },
      }
    );
    const data = response.data;

    if (data.success && data.token) {
      return {
        success: true,
        message: data.message,
        token: data.token,
      };
    } else {
      return {
        success: false,
        message: data.message || "Profil tamamlama başarısız",
      };
    }
  } catch (e: any) {
    return {
      success: false,
      message: e.response?.data?.message || e.message,
    };
  }
};

// Kullanıcı profilini güncelle
export const updateUserProfile = async (
  userData: Partial<Omit<User, "phone" | "profilePicture">>
): Promise<{ success: boolean; message: string; data?: User }> => {
  try {
    const response = await api.put("/users/me", userData);
    const data = response.data;

    if (data.success) {
      const processedUser = processUserData(data.data);
      return {
        success: true,
        message: data.message,
        data: processedUser,
      };
    } else {
      return {
        success: false,
        message: data.message || "Profil güncelleme başarısız.",
      };
    }
  } catch (e: any) {
    console.error("Profil güncelleme başarısız:", e);
    return {
      success: false,
      message: e.response?.data?.message || e.message,
    };
  }
};

// Kullanıcı profilini yenile
export const fetchUserProfile = async (): Promise<{
  success: boolean;
  user?: User;
  shouldLogout?: boolean;
}> => {
  try {
    const meResponse = await api.get("/users/me");
    const meData = meResponse.data;
    if (meData.success && meData.data) {
      const processedUser = processUserData(meData.data);
      return {
        success: true,
        user: processedUser,
      };
    } else {
      console.error(
        "Kullanıcı profili yenilenemedi:",
        meData.success ? "data field eksik" : "sunucu success:false döndü",
        meData
      );
      return { success: false };
    }
  } catch (e: any) {
    console.error(
      "Profil yenileme başarısız:",
      e.response?.data?.message || e.message
    );
    // 401 Unauthorized durumunda logout gerekebilir
    if (e.response?.status === 401) {
      return { success: false, shouldLogout: true };
    }
    return { success: false };
  }
};