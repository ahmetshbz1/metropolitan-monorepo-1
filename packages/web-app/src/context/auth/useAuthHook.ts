"use client";

import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  guestStorage,
  registrationStorage,
  socialAuthStorage,
  syncDeviceIdFromToken,
  tokenStorage,
  userStorage,
} from "./storage";
import { SocialAuthData, WebUser } from "./types";

// Firebase auth for Google
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export const useAuthHook = () => {
  const { t } = useTranslation();
  const router = useRouter();

  // Auth state
  const [user, setUser] = useState<WebUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const [registrationToken, setRegistrationToken] = useState<string | null>(
    null
  );
  const [isGuest, setIsGuest] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [socialAuthData, setSocialAuthData] = useState<SocialAuthData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Load tokens
        const savedAccessToken = await tokenStorage.getAccessToken();
        const savedRefreshToken = await tokenStorage.getRefreshToken();
        const savedUser = await userStorage.get();
        const savedGuestId = await guestStorage.getGuestId();
        const savedSocialAuthData = await socialAuthStorage.get();
        const savedRegistrationToken = await registrationStorage.getToken();

        // Sadece user da varsa token'ları restore et
        if (savedAccessToken && savedRefreshToken && savedUser) {
          setAccessToken(savedAccessToken);
          setRefreshToken(savedRefreshToken);
          setToken(savedAccessToken);
          setUser(savedUser);
          setIsGuest(false);
          await syncDeviceIdFromToken(savedAccessToken);
        } else if (savedGuestId) {
          setGuestId(savedGuestId);
          setIsGuest(true);
        }

        if (savedSocialAuthData) {
          setSocialAuthData(savedSocialAuthData);
        }

        if (savedRegistrationToken) {
          setRegistrationToken(savedRegistrationToken);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Send OTP
  const sendOTP = async (
    phoneNumber: string,
    userType: "individual" | "corporate" = "individual"
  ) => {
    try {
      const response = await api.post("/auth/send-otp", {
        phoneNumber,
        userType,
      });

      if (response.data.success) {
        setPhoneNumber(phoneNumber);
        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message || "OTP gönderilirken bir hata oluştu",
      };
    }
  };

  // Verify OTP - Mobile mantığının kopyası
  const verifyOTP = async (
    phoneNumber: string,
    otpCode: string,
    userType: "individual" | "corporate" = "individual"
  ) => {
    try {
      // 1. Backend service çağır
      const response = await api.post("/auth/verify-otp", {
        phoneNumber,
        otpCode,
        userType,
        guestId: isGuest ? guestId : undefined,
        socialAuthData,
      });

      if (!response.data.success) {
        return {
          success: false,
          message: response.data.message,
          isNewUser: false,
        };
      }

      // 2. Token varsa kaydet
      if (response.data.accessToken && response.data.refreshToken) {
        setAccessToken(response.data.accessToken);
        setRefreshToken(response.data.refreshToken);
        setToken(response.data.accessToken);
        setIsGuest(false);
        setGuestId(null);

        await tokenStorage.saveTokens(
          response.data.accessToken,
          response.data.refreshToken
        );
        await guestStorage.clearGuestId();

        // 3. Profile fetch et (manual token header)
        try {
          const profileResponse = await api.get("/users/me", {
            headers: {
              Authorization: `Bearer ${response.data.accessToken}`
            }
          });
          if (profileResponse.data.success && profileResponse.data.data) {
            setUser(profileResponse.data.data);
            await userStorage.save(profileResponse.data.data);
          }
        } catch (profileError) {
          console.error("Profile fetch error:", profileError);
        }

        return {
          success: true,
          message: response.data.message,
          isNewUser: false,
        };
      }

      // Registration token varsa kaydet
      if (response.data.registrationToken) {
        setRegistrationToken(response.data.registrationToken);
        await registrationStorage.saveToken(response.data.registrationToken);

        return {
          success: true,
          message: response.data.message,
          isNewUser: true,
        };
      }

      return {
        success: false,
        message: "Beklenmeyen yanıt",
        isNewUser: false,
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message || "OTP doğrulanırken bir hata oluştu",
        isNewUser: false,
      };
    }
  };

  // Complete Profile
  const completeProfile = async (userData: any) => {
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
          privacyAccepted: userData.privacyAccepted,
          marketingConsent: userData.marketingAccepted,
          ...(socialAuthData?.uid ? { firebaseUid: socialAuthData.uid } : {}),
          ...(socialAuthData?.provider
            ? { authProvider: socialAuthData.provider }
            : {}),
        },
        {
          headers: {
            Authorization: `Bearer ${registrationToken}`,
          },
        }
      );

      if (response.data.success) {
        if (response.data.accessToken && response.data.refreshToken) {
          setAccessToken(response.data.accessToken);
          setRefreshToken(response.data.refreshToken);
          setToken(response.data.accessToken);
          await tokenStorage.saveTokens(
            response.data.accessToken,
            response.data.refreshToken
          );
        }

        setRegistrationToken(null);
        setIsGuest(false);
        setGuestId(null);

        // Clear storage
        await registrationStorage.clearToken();
        await guestStorage.clearGuestId();
        await socialAuthStorage.clear();

        // Fetch user profile after successful registration
        try {
          const profileResponse = await api.get("/users/me");
          if (profileResponse.data.success && profileResponse.data.data) {
            setUser(profileResponse.data.data);
            await userStorage.save(profileResponse.data.data);
          }
        } catch (profileError) {
          console.error("Error fetching user profile:", profileError);
        }

        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Profil tamamlanırken bir hata oluştu",
      };
    }
  };

  // Update User Profile
  const updateUserProfile = async (userData: Partial<WebUser>) => {
    try {
      const response = await api.put("/users/me", userData);

      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        await userStorage.save(response.data.data);

        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Profil güncellenirken bir hata oluştu",
      };
    }
  };

  // Upload Profile Photo
  const uploadProfilePhoto = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await api.post(
        "/users/me/profile-photo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success && response.data.data) {
        const updatedUser = {
          ...user,
          profilePicture: response.data.data.photoUrl,
        };
        setUser(updatedUser);
        await userStorage.save(updatedUser);

        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Fotoğraf yüklenirken bir hata oluştu",
      };
    }
  };

  // Refresh User Profile
  const refreshUserProfile = async () => {
    try {
      const response = await api.get("/users/me");
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        await userStorage.save(response.data.data);
      }
    } catch (error) {
      console.error("Profile refresh error:", error);
    }
  };

  // Login as Guest
  const loginAsGuest = async () => {
    try {
      const response = await api.post("/auth/guest-login");
      if (response.data.success) {
        setGuestId(response.data.guestId);
        setIsGuest(true);
        await guestStorage.saveGuestId(response.data.guestId);
      }
    } catch (error) {
      console.error("Guest login error:", error);
    }
  };

  // Logout - Mobile pattern'i
  const logout = async () => {
    try {
      // Server'a logout isteği gönder (manual header)
      if (accessToken) {
        await api.post("/auth/logout", {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Server hatası olsa bile local logout devam etsin
    }

    // Local state'i temizle
    setUser(null);
    setToken(null);
    setAccessToken(null);
    setRefreshToken(null);
    setRegistrationToken(null);
    setIsGuest(false);
    setGuestId(null);
    setPhoneNumber(null);
    setSocialAuthData(null);

    // Tüm storage'ı temizle
    await tokenStorage.clearTokens();
    await userStorage.clear();
    await socialAuthStorage.clear();
    await guestStorage.clearGuestId();
    await registrationStorage.clearToken();

    // Ana sayfaya yönlendir
    router.push("/");
  };

  // Google Sign-In
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        // Store social auth data
        const authData: SocialAuthData = {
          uid: result.user.uid,
          email: result.user.email,
          fullName: result.user.displayName,
          firstName: result.user.displayName?.split(" ")[0],
          lastName: result.user.displayName?.split(" ").slice(1).join(" "),
          photoURL: result.user.photoURL,
          provider: "google",
        };
        setSocialAuthData(authData);
        await socialAuthStorage.save(authData);

        // Check if user exists in backend
        try {
          const requestData: any = {
            firebaseUid: result.user.uid,
            provider: "google",
          };

          // Only include email if it's not null
          if (result.user.email) {
            requestData.email = result.user.email;
          }

          const response = await api.post("/auth/social-signin", requestData);

          if (response.data.success) {
            if (
              response.data.userExists &&
              response.data.profileComplete &&
              response.data.accessToken
            ) {
              // User exists with complete profile, login successful
              setUser(response.data.user);
              setAccessToken(response.data.accessToken);
              setRefreshToken(response.data.refreshToken);
              setToken(response.data.accessToken);

              // Save tokens to storage
              await tokenStorage.saveTokens(
                response.data.accessToken,
                response.data.refreshToken
              );
              await userStorage.save(response.data.user);

              router.push("/");
              return { success: true };
            } else {
              // New user or incomplete profile, navigate to phone login
              router.push("/auth/phone-login");
              return { success: true };
            }
          } else if (response.data.error === "PROVIDER_CONFLICT") {
            // Show error message for provider conflict
            return { success: false, error: response.data.message };
          }
        } catch (backendError) {
          // Navigate to phone login if backend error
          router.push("/auth/phone-login");
          return { success: true };
        }
      }
      return { success: true };
    } catch (error) {
      console.error("Google Sign-In error:", error);
      return { success: false, error: "Google Sign-In başarısız" };
    }
  };

  return {
    // State
    user,
    token,
    accessToken,
    refreshToken,
    registrationToken,
    isGuest,
    guestId,
    phoneNumber,
    socialAuthData,
    loading,
    isAuthenticated: !!(user && (token || accessToken)),

    // Actions
    sendOTP,
    verifyOTP,
    completeProfile,
    updateUserProfile,
    uploadProfilePhoto,
    refreshUserProfile,
    loginAsGuest,
    logout,
    signInWithGoogle,
  };
};
