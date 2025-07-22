//  "useAuthHook.ts"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { useEffect, useState } from "react";
// Alert kaldırıldı – kullanılmıyor
import { useTranslation } from "react-i18next";

// Auth modülleri
import {
  completeProfile as completeProfileService,
  fetchUserProfile,
  logoutFromServer as logoutFromServerService,
  processUserData,
  sendOTP as sendOTPService,
  updateUserProfile as updateUserProfileService,
  uploadProfilePhoto as uploadProfilePhotoService,
  verifyOTP as verifyOTPService,
} from "./authServices";
import {
  createGuestSession as createGuestSessionService,
  generateGuestId,
  migrateGuestData,
} from "./guestUtils";
import {
  clearAllAuthData,
  guestStorage,
  loadAuthState,
  tokenStorage,
  userStorage,
} from "./storage";
import { User } from "./types";

export const useAuthHook = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [registrationToken, setRegistrationToken] = useState<string | null>(
    null
  );
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Uygulama başlatıldığında kimlik doğrulama durumunu yükle
  useEffect(() => {
    const initializeAuth = async () => {
      const startTime = Date.now();
      
      try {
        console.log("🚀 Auth initialization başlatılıyor...");
        const authState = await loadAuthState();
        console.log("📦 Auth state yüklendi:", authState);

        if (authState.token) {
          console.log("🔑 Token bulundu, set ediliyor");
          setToken(authState.token);
        }

        if (authState.user) {
          console.log("👤 User bulundu, set ediliyor");
          setUser(authState.user);
        }

        if (authState.guestId) {
          console.log("🎭 Guest ID bulundu, set ediliyor");
          setGuestId(authState.guestId);
          setIsGuest(true);
        }

        console.log("✅ Auth initialization tamamlandı");
      } catch (error) {
        console.error("❌ Kimlik doğrulama durumu yüklenemedi:", error);
      } finally {
        // Minimum 2 saniye splash screen göster
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 2000;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        setTimeout(() => {
          console.log("⏰ Auth loading false yapılıyor");
          setLoading(false);
        }, remainingTime);
      }
    };

    initializeAuth();
  }, []);

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
          await migrateGuestData(phone, guestId);
          await guestStorage.clearGuest();
          setGuestId(null);
          setIsGuest(false);
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

  const completeProfile = async (
    userData: Omit<User, "phone" | "profilePicture"> & {
      userType: "individual" | "corporate";
      nip?: string;
      termsAccepted: boolean;
    }
  ) => {
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
          await migrateGuestData(phoneNumber, guestId);
          await guestStorage.clearGuest();
          setGuestId(null);
          setIsGuest(false);
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

  const updateUserProfile = async (
    userData: Partial<Omit<User, "phone" | "profilePicture">>
  ) => {
    if (!token) {
      return {
        success: false,
        message: "Kimlik doğrulama token'ı bulunamadı.",
      };
    }

    const result = await updateUserProfileService(userData);

    if (result.success && result.data) {
      setUser(result.data);
      await userStorage.save(result.data);
    }

    return { success: result.success, message: result.message };
  };

  const uploadProfilePhoto = async (imageUri: string) => {
    if (!token) {
      return {
        success: false,
        message: "Kimlik doğrulama token'ı bulunamadı.",
      };
    }

    const result = await uploadProfilePhotoService(imageUri);

    if (result.success && result.photoUrl) {
      // Kullanıcı state'ini yeni fotoğraf URL'si ile güncelle
      setUser((currentUser) => {
        if (!currentUser) return null;
        const updatedUser = {
          ...currentUser,
          profilePhotoUrl: result.photoUrl!,
        };
        const processedUser = processUserData(updatedUser);
        // Storage'ı da güncelle
        userStorage.save(processedUser);
        return processedUser;
      });
    }

    return { success: result.success, message: result.message };
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (!token) return;

    const result = await fetchUserProfile();

    if (result.success && result.user) {
      setUser(result.user);
      await userStorage.save(result.user);
    }
  };

  const loginAsGuest = async (): Promise<void> => {
    const newGuestId = generateGuestId();
    const result = await createGuestSessionService(newGuestId);

    if (result.success) {
      setIsGuest(true);
      setGuestId(newGuestId);
      await guestStorage.saveGuestId(newGuestId);
    } else {
      console.error("Misafir oturumu oluşturulamadı");
    }
  };

  const logout = async () => {
    try {
      // Server'a logout isteği gönder
      if (token) {
        await logoutFromServerService();
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
    // State
    user,
    token,
    registrationToken,
    isGuest,
    guestId,
    phoneNumber,
    loading,

    // Actions
    sendOTP,
    verifyOTP,
    completeProfile,
    updateUserProfile,
    uploadProfilePhoto,
    refreshUserProfile,
    loginAsGuest,
    logout,
  };
};
