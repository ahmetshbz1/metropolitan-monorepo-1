//  "useAuthActions.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { CompleteProfileInput, User } from "@/context/auth/types";
import {
  completeProfile as completeProfileService,
  fetchUserProfile,
  logoutFromServer,
  processUserData,
  sendOTP as sendOTPService,
  verifyOTP as verifyOTPService,
} from "@/context/auth/authServices";
import {
  clearAllAuthData,
  tokenStorage,
  userStorage,
} from "@/context/auth/storage";

interface AuthActions {
  sendOTP: (
    phone: string,
    userType?: "individual" | "corporate"
  ) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (
    phone: string,
    otp: string,
    userType?: "individual" | "corporate"
  ) => Promise<{
    success: boolean;
    message: string;
    isNewUser: boolean;
  }>;
  completeProfile: (
    userData: CompleteProfileInput
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

interface AuthActionsDeps {
  token: string | null;
  registrationToken: string | null;
  guestId: string | null;
  phoneNumber: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRegistrationToken: (token: string | null) => void;
  setIsGuest: (value: boolean) => void;
  setGuestId: (id: string | null) => void;
  setPhoneNumber: (phone: string | null) => void;
  migrateGuestToUser: (phoneNumber: string, guestId: string) => Promise<void>;
}

export const useAuthActions = (deps: AuthActionsDeps): AuthActions => {
  const {
    token,
    registrationToken,
    guestId,
    phoneNumber,
    setUser,
    setToken,
    setRegistrationToken,
    setIsGuest,
    setGuestId,
    setPhoneNumber,
    migrateGuestToUser,
  } = deps;

  const sendOTP = async (
    phone: string,
    userType: "individual" | "corporate" = "individual"
  ) => {
    setPhoneNumber(phone);
    return await sendOTPService(phone, userType);
  };

  const verifyOTP = async (
    phone: string,
    otp: string,
    userType: "individual" | "corporate" = "individual"
  ) => {
    const result = await verifyOTPService(phone, otp, userType);

    if (result.success) {
      // Tokenları kaydet
      if (result.token) {
        setToken(result.token);
        await tokenStorage.save(result.token);
      }

      if (result.registrationToken) {
        setRegistrationToken(result.registrationToken);
      }

      // Misafir verisi varsa sunucuya taşı
      if (guestId) {
        try {
          await migrateGuestToUser(phone, guestId);
        } catch (error) {
          console.error("Misafir verisi taşıma hatası:", error);
        }
      }

      // Sadece mevcut kullanıcı (token dönen) için profil çek
      if (result.token) {
        try {
          const profileResult = await fetchUserProfile();
          if (profileResult.success && profileResult.user) {
            const updatedUser = processUserData(profileResult.user);
            setUser(updatedUser);
            await userStorage.save(updatedUser);
          }
        } catch (error) {
          console.error("Profil çekme hatası:", error);
        }
      }
    }

    return result;
  };

  const completeProfile = async (userData: CompleteProfileInput) => {
    if (!registrationToken) {
      return { success: false, message: "Kayıt token'ı bulunamadı." };
    }

    const result = await completeProfileService(userData, registrationToken);

    if (result.success) {
      if (result.token) {
        setToken(result.token);
        await tokenStorage.save(result.token);
      }

      setRegistrationToken(null);

      // Misafir verisi varsa taşı
      if (guestId && phoneNumber) {
        try {
          await migrateGuestToUser(phoneNumber, guestId);
        } catch (error) {
          console.error("Misafir verisi taşıma hatası:", error);
        }
      }

      // Kullanıcı profilini çek
      try {
        const profileResult = await fetchUserProfile();
        if (profileResult.success && profileResult.user) {
          const processedUser = processUserData(profileResult.user);
          setUser(processedUser);
          await userStorage.save(processedUser);
        }
      } catch (error) {
        console.error("Profil çekme hatası:", error);
      }
    }

    return result;
  };

  const logout = async () => {
    try {
      // Server'a logout isteği gönder
      if (token) {
        await logoutFromServer();
      }
    } catch (e: any) {
      console.error("Logout isteği başarısız:", e);
      // Logout işlemi local olarak devam etsin
    }

    // Local state'i temizle
    setUser(null);
    setToken(null);
    setRegistrationToken(null);
    setIsGuest(false);
    setGuestId(null);
    setPhoneNumber(null);

    // Tüm kimlik doğrulama verilerini temizle
    await clearAllAuthData();
  };

  return {
    sendOTP,
    verifyOTP,
    completeProfile,
    logout,
  };
};