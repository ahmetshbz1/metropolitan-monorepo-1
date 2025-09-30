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
  socialAuthStorage,
} from "@/context/auth/storage";
import { firebaseSignOut } from "@/core/firebase/auth/signOut";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

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
  socialAuthData: any | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setRegistrationToken: (token: string | null) => void;
  setIsGuest: (value: boolean) => void;
  setGuestId: (id: string | null) => void;
  setPhoneNumber: (phone: string | null) => void;
  setSocialAuthData: (data: any | null) => void;
  migrateGuestToUser: (phoneNumber: string, guestId: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
}

export const useAuthActions = (deps: AuthActionsDeps): AuthActions => {
  const {
    token,
    registrationToken,
    guestId,
    phoneNumber,
    socialAuthData,
    setUser,
    setToken,
    setAccessToken,
    setRefreshToken,
    setRegistrationToken,
    setIsGuest,
    setGuestId,
    setPhoneNumber,
    setSocialAuthData,
    migrateGuestToUser,
    loginAsGuest,
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
      if (result.accessToken && result.refreshToken) {
        // New token system
        setAccessToken(result.accessToken);
        setRefreshToken(result.refreshToken);
        setToken(result.accessToken); // Backward compatibility
        await tokenStorage.saveTokens(result.accessToken, result.refreshToken);
      } else if (result.token) {
        // Old token system (backward compatibility)
        setToken(result.token);
        setAccessToken(result.token);
        await tokenStorage.save(result.token);
      }

      if (result.registrationToken) {
        // Removed console statement
        setRegistrationToken(result.registrationToken);
      }

      // Misafir verisi varsa sunucuya taşı
      if (guestId) {
        try {
          await migrateGuestToUser(phone, guestId);
        } catch (error) {
          // Removed console statement
        }
      }

      // Sadece mevcut kullanıcı (token dönen) için profil çek
      if (result.accessToken || result.token) {
        try {
          const profileResult = await fetchUserProfile();
          if (profileResult.success && profileResult.user) {
            const updatedUser = processUserData(profileResult.user);
            setUser(updatedUser);
            await userStorage.save(updatedUser);

            // Push notification kontrolü - mevcut kullanıcı için
            // Kullanıcının push tercihi true ise ve izin yoksa iste
            if (updatedUser.pushNotifications) {
              try {
                const NotificationService = await import('@/core/firebase/notifications/notificationService');

                // Önce mevcut izni kontrol et
                const hasPermission = await NotificationService.default.hasNotificationPermission();

                if (!hasPermission) {
                  // İzin yoksa iste
                  const token = await NotificationService.default.registerForPushNotifications();
                  if (token) {
                    // Removed console statement
                  }
                } else {
                  // İzin var ama token'ı backend'e gönderelim (telefon değişmiş olabilir)
                  const token = await NotificationService.default.getExpoPushToken();
                  if (!token) {
                    // Token yoksa tekrar register et
                    await NotificationService.default.registerForPushNotifications();
                  }
                }
              } catch (error) {
                // Removed console statement
              }
            }
          }
        } catch (error) {
          // Removed console statement
        }
      }
    }

    return result;
  };

  const completeProfile = async (userData: CompleteProfileInput) => {
    if (!registrationToken) {
      return { success: false, message: "Kayıt token'ı bulunamadı." };
    }

    // Add firebaseUid and appleUserId from social auth data if available
    const profileData = {
      ...userData,
      ...(socialAuthData?.uid ? { firebaseUid: socialAuthData.uid } : {}),
      ...(socialAuthData?.appleUserId ? { appleUserId: socialAuthData.appleUserId } : {}),
      ...(socialAuthData?.provider ? { authProvider: socialAuthData.provider } : {}),
    };

    const result = await completeProfileService(profileData, registrationToken);

    if (result.success) {
      if (result.accessToken && result.refreshToken) {
        // New token system
        setAccessToken(result.accessToken);
        setRefreshToken(result.refreshToken);
        setToken(result.accessToken); // Backward compatibility
        await tokenStorage.saveTokens(result.accessToken, result.refreshToken);
      } else if (result.token) {
        // Old token system (backward compatibility)
        setToken(result.token);
        setAccessToken(result.token);
        await tokenStorage.save(result.token);
      }

      setRegistrationToken(null);

      // Misafir verisi varsa taşı
      if (guestId && phoneNumber) {
        try {
          await migrateGuestToUser(phoneNumber, guestId);
        } catch (error) {
          // Removed console statement
        }
      }

      // Clear social auth data after successful profile completion
      setSocialAuthData(null);
      await socialAuthStorage.remove();

      // Kullanıcı profilini çek
      try {
        // Removed console statement
        const profileResult = await fetchUserProfile();
        if (profileResult.success && profileResult.user) {
          // Removed console statement
          const processedUser = processUserData(profileResult.user);
          setUser(processedUser);
          await userStorage.save(processedUser);
          // Removed console statement
        } else {
          // Removed console statement
        }
      } catch (error) {
        // Removed console statement
      }

      // Push notification izni artık checkout veya profil ayarlarında isteniyor
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
      // Removed console statement
      // Logout işlemi local olarak devam etsin
    }

    // Firebase'den çıkış yap
    try {
      await firebaseSignOut();
    } catch (e: any) {
      // Removed console statement
    }

    // Tüm kimlik doğrulama verilerini temizle
    await clearAllAuthData();

    // Local state'i temizle
    setUser(null);
    setToken(null);
    setAccessToken(null);
    setRefreshToken(null);
    setRegistrationToken(null);
    setPhoneNumber(null);
    setSocialAuthData(null);

    // Logout sonrası yeni misafir kullanıcı oluştur
    await loginAsGuest();

    // Ana sayfaya yönlendir
    router.replace('/(tabs)');
  };

  return {
    sendOTP,
    verifyOTP,
    completeProfile,
    logout,
  };
};