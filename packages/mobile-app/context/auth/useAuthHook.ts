//  "useAuthHook.ts"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import api from "@/core/api";
import { socialAuthStorage, tokenStorage, userStorage, guestStorage, versionStorage, clearAllAuthData } from "@/context/auth/storage";
import { useToast } from "@/hooks/useToast";

// Custom hooks
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { useAuthState } from "@/hooks/auth/useAuthState";
import { useGuestAuth } from "@/hooks/auth/useGuestAuth";
import { useProfileManagement } from "@/hooks/auth/useProfileManagement";

// Firebase auth
import { signInWithApple as firebaseSignInWithApple, checkAppleAuthAvailable } from "@/core/firebase/auth/appleAuth";
import { signInWithGoogle as firebaseSignInWithGoogle } from "@/core/firebase/auth/googleAuth";

// App version for session management
import * as Application from "expo-application";
import Constants from "expo-constants";

export const useAuthHook = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

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
    loginAsGuest,
  });

  // Check Apple Sign-In availability
  useEffect(() => {
    checkAppleAuthAvailable().then(setIsAppleSignInAvailable);
  }, []);

  // Save app version (removed automatic session cleanup)
  useEffect(() => {
    const saveAppVersion = async () => {
      try {
        const currentVersion = Constants.expoConfig?.version || Application.nativeApplicationVersion || "1.0.0";
        await versionStorage.saveCurrentVersion(currentVersion);
      } catch (error) {
        console.log("⚠️ [VERSION SAVE ERROR]", error);
      }
    };

    saveAppVersion();
  }, []); // Run only once on app start

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
          // 🔍 Social signin response logged

          if (response.data.success) {
            if (response.data.userExists && response.data.profileComplete && response.data.accessToken) {
              // User exists with complete profile, login successful
              // Removed console statement

              // First save to storage
              await tokenStorage.saveTokens(response.data.accessToken, response.data.refreshToken);
              await userStorage.save(response.data.user);

              // Clear guest status if exists
              await guestStorage.clearGuest();

              // Then update state
              setUser(response.data.user);
              setAccessToken(response.data.accessToken);
              setRefreshToken(response.data.refreshToken);
              setToken(response.data.accessToken); // Backward compatibility
              setIsGuest(false); // Explicitly set not guest
              setGuestId(null); // Clear guest ID

              // Checkout için geldiyse checkout'a, değilse tabs'a git
              if (pendingCheckout) {
                setPendingCheckout(false);
                router.replace("/checkout/address");
              } else {
                router.replace("/(tabs)");
              }
            } else {
              // New user or incomplete profile, navigate to phone login
              // Removed console statement
              router.push("/(auth)/phone-login");
            }
          } else if (response.data.error === 'PROVIDER_CONFLICT') {
            // Phone number already linked to different provider
            // ❌ Provider conflict: ${response.data.message}

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
      return { success: false, error: t("auth.apple_sign_in_failed") };
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
          // 🔍 Social signin response logged

          if (response.data.success) {
            if (response.data.userExists && response.data.profileComplete && response.data.accessToken) {
              // User exists with complete profile, login successful
              // Removed console statement

              // First save to storage
              await tokenStorage.saveTokens(response.data.accessToken, response.data.refreshToken);
              await userStorage.save(response.data.user);

              // Clear guest status if exists
              await guestStorage.clearGuest();

              // Then update state
              setUser(response.data.user);
              setAccessToken(response.data.accessToken);
              setRefreshToken(response.data.refreshToken);
              setToken(response.data.accessToken); // Backward compatibility
              setIsGuest(false); // Explicitly set not guest
              setGuestId(null); // Clear guest ID

              // Checkout için geldiyse checkout'a, değilse tabs'a git
              if (pendingCheckout) {
                setPendingCheckout(false);
                router.replace("/checkout/address");
              } else {
                router.replace("/(tabs)");
              }
            } else {
              // New user or incomplete profile, navigate to phone login
              // Removed console statement
              router.push("/(auth)/phone-login");
            }
          } else if (response.data.error === 'PROVIDER_CONFLICT') {
            // Phone number already linked to different provider
            // ❌ Provider conflict: ${response.data.message}

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
      return { success: false, error: t("auth.google_sign_in_failed") };
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
    pendingCheckout,

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

    // State setters (for cart)
    setGuestId,
    setIsGuest,
    setPendingCheckout,
  };
};
