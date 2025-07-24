//  "authServices.ts"
//  metropolitan app
//  Created by Ahmet on 26.06.2025.

import { api, API_BASE_URL } from "@/core/api";
import { CompleteProfileInput, User } from "./types";

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

// Profil fotoğrafı yükle
export const uploadProfilePhoto = async (
  imageUri: string
): Promise<{ success: boolean; message: string; photoUrl?: string }> => {
  try {
    const formData = new FormData();
    
    // Dosya adını ve türünü URI'den çıkarmaya çalış
    const filename = imageUri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    let type = "image/jpeg"; // Varsayılan tip
    
    if (match) {
      const ext = match[1].toLowerCase();
      if (ext === "png") {
        type = "image/png";
      } else if (ext === "jpg" || ext === "jpeg") {
        type = "image/jpeg";
      } else if (ext === "gif") {
        type = "image/gif";
      }
    }
    
    // React Native FormData için doğru format
    const photo = {
      uri: imageUri,
      type: type,
      name: filename,
    };
    
    // @ts-ignore - React Native FormData tipi farklı
    formData.append("photo", photo);
    
    const response = await api.post("/users/me/profile-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const data = response.data;
    if (data.success && data.data.photoUrl) {
      return {
        success: true,
        message: data.message,
        photoUrl: data.data.photoUrl,
      };
    } else {
      return {
        success: false,
        message: data.message || "Fotoğraf yükleme başarısız.",
      };
    }
  } catch (e: any) {
    console.error("Fotoğraf yükleme başarısız:", e.response?.data || e.message);
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
