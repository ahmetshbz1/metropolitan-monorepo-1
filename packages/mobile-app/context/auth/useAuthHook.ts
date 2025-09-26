//  "useAuthHook.ts"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import api from "@/core/api";
import { socialAuthStorage, tokenStorage, userStorage } from "@/context/auth/storage";
import { useToast } from "@/hooks/useToast";

// Custom hooks
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { useAuthState } from "@/hooks/auth/useAuthState";
import { useGuestAuth } from "@/hooks/auth/useGuestAuth";
import { useProfileManagement } from "@/hooks/auth/useProfileManagement";

// Firebase auth
import { signInWithApple as firebaseSignInWithApple, checkAppleAuthAvailable } from "@/core/firebase/auth/appleAuth";
import { signInWithGoogle as firebaseSignInWithGoogle } from "@/core/firebase/auth/googleAuth";

export const useAuthHook = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  // Auth state management
  const {
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
    setUser,
    setToken,
    setAccessToken,
    setRefreshToken,
    setRegistrationToken,
    setIsGuest,
    setGuestId,
    setPhoneNumber,
    setSocialAuthData,
  } = useAuthState();

  // Guest authentication
  const { loginAsGuest, migrateGuestToUser } = useGuestAuth(
    setIsGuest,
    setGuestId
  );

  // Profile management
  const { updateUserProfile, uploadProfilePhoto, refreshUserProfile } =
    useProfileManagement(token, setUser);

  // Auth actions
  const { sendOTP, verifyOTP, completeProfile, logout } = useAuthActions({
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
  });

  // Check Apple Sign-In availability
  useEffect(() => {
    checkAppleAuthAvailable().then(setIsAppleSignInAvailable);
  }, []);

  // Firebase Social Auth
  const signInWithApple = async () => {
    try {
      const result = await firebaseSignInWithApple();
      if (result.success && result.user) {
        // Store social auth data
        const authData = {
          uid: result.user.uid,
          appleUserId: result.user.appleUserId, // Apple's unique user ID
          email: result.user.email,
          fullName: result.user.fullName,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          photoURL: result.user.photoURL,
          provider: 'apple' as const,
        };
        setSocialAuthData(authData);
        await socialAuthStorage.save(authData);

        // Check if user exists in backend
        try {
          const requestData: any = {
            firebaseUid: result.user.uid,
            appleUserId: result.user.appleUserId, // CRITICAL: Send Apple's unique user ID
            provider: 'apple',
          };

          // Only include email if it's not null
          if (result.user.email) {
            requestData.email = result.user.email;
          }

          const response = await api.post("/auth/social-signin", requestData);
          console.log("🔍 Social signin response:", {
            provider: requestData.provider,
            success: response.data.success,
            userExists: response.data.userExists,
            profileComplete: response.data.profileComplete,
            hasAccessToken: !!response.data.accessToken,
            error: response.data.error,
            message: response.data.message
          });

          if (response.data.success) {
            if (response.data.userExists && response.data.profileComplete && response.data.accessToken) {
              // User exists with complete profile, login successful
              console.log(`✅ ${requestData.provider} user exists with complete profile, logging in directly`);
              setUser(response.data.user);
              setAccessToken(response.data.accessToken);
              setRefreshToken(response.data.refreshToken);
              setToken(response.data.accessToken); // Backward compatibility

              // Save tokens to storage
              await tokenStorage.saveTokens(response.data.accessToken, response.data.refreshToken);
              await userStorage.save(response.data.user);

              router.replace("/(tabs)");
            } else {
              // New user or incomplete profile, navigate to phone login
              console.log(`🆕 ${requestData.provider} new user or incomplete profile, redirecting to phone login`);
              router.push("/(auth)/phone-login");
            }
          } else if (response.data.error === 'PROVIDER_CONFLICT') {
            // Phone number already linked to different provider
            console.error("❌ Provider conflict:", response.data.message);

            // Show localized error message with suggested action
            const existingProviderName = response.data.existingProvider === 'apple' ? 'Apple' : 'Google';
            const attemptedProviderName = response.data.attemptedProvider === 'apple' ? 'Apple' : 'Google';

            showToast(
              t('auth.provider_conflict_with_suggestion', {
                existingProvider: existingProviderName,
                attemptedProvider: attemptedProviderName
              }),
              'error',
              7000
            );

            return { success: false, error: response.data.message };
          }
        } catch (backendError) {
          // Navigate to phone login if backend error
          router.push("/(auth)/phone-login");
        }
      }
      return result;
    } catch (error) {
      console.error("Apple Sign-In hatası:", error);
      return { success: false, error: "Apple Sign-In başarısız" };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await firebaseSignInWithGoogle();
      if (result.success && result.user) {
        // Store social auth data
        const authData = {
          uid: result.user.uid,
          email: result.user.email,
          fullName: result.user.fullName,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          photoURL: result.user.photoURL,
          provider: 'google' as const,
        };
        setSocialAuthData(authData);
        await socialAuthStorage.save(authData);

        // Check if user exists in backend
        try {
          const requestData: any = {
            firebaseUid: result.user.uid,
            provider: 'google',
          };

          // Only include email if it's not null
          if (result.user.email) {
            requestData.email = result.user.email;
          }

          const response = await api.post("/auth/social-signin", requestData);
          console.log("🔍 Social signin response:", {
            provider: requestData.provider,
            success: response.data.success,
            userExists: response.data.userExists,
            profileComplete: response.data.profileComplete,
            hasAccessToken: !!response.data.accessToken,
            error: response.data.error,
            message: response.data.message
          });

          if (response.data.success) {
            if (response.data.userExists && response.data.profileComplete && response.data.accessToken) {
              // User exists with complete profile, login successful
              console.log(`✅ ${requestData.provider} user exists with complete profile, logging in directly`);
              setUser(response.data.user);
              setAccessToken(response.data.accessToken);
              setRefreshToken(response.data.refreshToken);
              setToken(response.data.accessToken); // Backward compatibility

              // Save tokens to storage
              await tokenStorage.saveTokens(response.data.accessToken, response.data.refreshToken);
              await userStorage.save(response.data.user);

              router.replace("/(tabs)");
            } else {
              // New user or incomplete profile, navigate to phone login
              console.log(`🆕 ${requestData.provider} new user or incomplete profile, redirecting to phone login`);
              router.push("/(auth)/phone-login");
            }
          } else if (response.data.error === 'PROVIDER_CONFLICT') {
            // Phone number already linked to different provider
            console.error("❌ Provider conflict:", response.data.message);

            // Show localized error message with suggested action
            const existingProviderName = response.data.existingProvider === 'apple' ? 'Apple' : 'Google';
            const attemptedProviderName = response.data.attemptedProvider === 'apple' ? 'Apple' : 'Google';

            showToast(
              t('auth.provider_conflict_with_suggestion', {
                existingProvider: existingProviderName,
                attemptedProvider: attemptedProviderName
              }),
              'error',
              7000
            );

            return { success: false, error: response.data.message };
          }
        } catch (backendError) {
          // Navigate to phone login if backend error
          router.push("/(auth)/phone-login");
        }
      }
      return result;
    } catch (error) {
      console.error("Google Sign-In hatası:", error);
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
    isAppleSignInAvailable,

    // Actions
    sendOTP,
    verifyOTP,
    completeProfile,
    updateUserProfile,
    uploadProfilePhoto,
    refreshUserProfile,
    loginAsGuest,
    logout,
    signInWithApple,
    signInWithGoogle,
  };
};
