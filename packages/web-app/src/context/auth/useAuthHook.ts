"use client";

import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SocialAuthData, WebUser } from "./types";
import { useAuthStore } from "@/stores/auth-store";
import { extractSessionIdFromToken, saveSessionId } from "@/lib/device-fingerprint";

// Firebase auth for Google
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export const useAuthHook = () => {
  const { t } = useTranslation();
  const router = useRouter();

  // Use Zustand store for auth state (single source of truth)
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const registrationToken = useAuthStore((state) => state.registrationToken);
  const isGuest = useAuthStore((state) => state.isGuest);
  const guestId = useAuthStore((state) => state.guestId);
  const phoneNumber = useAuthStore((state) => state.phoneNumber);
  const socialAuthData = useAuthStore((state) => state.socialAuthData);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  // Actions from Zustand
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setRegistrationToken = useAuthStore((state) => state.setRegistrationToken);
  const setGuest = useAuthStore((state) => state.setGuest);
  const setPhoneNumber = useAuthStore((state) => state.setPhoneNumber);
  const setSocialAuthData = useAuthStore((state) => state.setSocialAuthData);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // Backward compatibility
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync token with accessToken for backward compatibility
  useEffect(() => {
    if (accessToken) {
      setToken(accessToken);
    }
  }, [accessToken]);

  // Initialize auth state from storage - Zustand persist already handles this
  // We just need to wait for hydration and set loading to false
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds max wait

    // Wait for Zustand to hydrate from localStorage
    const checkHydration = () => {
      attempts++;

      if (_hasHydrated) {
        setLoading(false);
      } else if (attempts >= maxAttempts) {
        // Force hydration to complete to unblock the app
        useAuthStore.getState().setHasHydrated(true);
        setLoading(false);
      } else {
        // Check again in 100ms
        setTimeout(checkHydration, 100);
      }
    };

    // Start checking
    checkHydration();
  }, [_hasHydrated, user, accessToken, refreshToken, isGuest, guestId]);

  // Send OTP
  const sendOTP = async (
    phone: string,
    userType: "individual" | "corporate" = "individual"
  ) => {
    try {
      const response = await api.post("/auth/send-otp", {
        phoneNumber: phone,
        userType,
      });

      if (response.data.success) {
        setPhoneNumber(phone); // Save to Zustand store
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

      // 2. Token varsa kaydet (use Zustand setters)
      if (response.data.accessToken && response.data.refreshToken) {
        // Save to Zustand store (this will also save to localStorage via persist middleware)
        setTokens(response.data.accessToken, response.data.refreshToken);
        setToken(response.data.accessToken); // Backward compatibility

        // Extract and save session ID
        const sessionId = extractSessionIdFromToken(response.data.accessToken);
        if (sessionId) {
          saveSessionId(sessionId);
        }

        // Clear guest session
        setGuest(false, null);

        // 3. Profile fetch et (manual token header)
        try {
          const profileResponse = await api.get("/users/me", {
            headers: {
              Authorization: `Bearer ${response.data.accessToken}`
            }
          });
          if (profileResponse.data.success && profileResponse.data.data) {
            setUser(profileResponse.data.data);
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
          // Save to Zustand store
          setTokens(response.data.accessToken, response.data.refreshToken);
          setToken(response.data.accessToken); // Backward compatibility

          // Extract and save session ID
          const sessionId = extractSessionIdFromToken(response.data.accessToken);
          if (sessionId) {
            saveSessionId(sessionId);
          }
        }

        setRegistrationToken(null);
        setGuest(false, null);
        setSocialAuthData(null);

        // Fetch user profile after successful registration (manual header)
        try {
          const profileResponse = await api.get("/users/me", {
            headers: {
              Authorization: `Bearer ${response.data.accessToken}`
            }
          });
          if (profileResponse.data.success && profileResponse.data.data) {
            setUser(profileResponse.data.data);
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
          profilePhotoUrl: response.data.data.photoUrl,
        };
        setUser(updatedUser);

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
        setGuest(true, response.data.guestId);
      }
    } catch (error) {
      console.error("Guest login error:", error);
    }
  };

  // Logout - Use Zustand clearAuth
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

    // Clear Zustand store (this clears everything including localStorage)
    clearAuth();

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
              setTokens(response.data.accessToken, response.data.refreshToken);
              setToken(response.data.accessToken); // Backward compatibility

              // Extract and save session ID
              const sessionId = extractSessionIdFromToken(response.data.accessToken);
              if (sessionId) {
                saveSessionId(sessionId);
              }

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
