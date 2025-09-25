//  "useAuthHook.ts"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

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
    loading,
    setUser,
    setToken,
    setAccessToken,
    setRefreshToken,
    setRegistrationToken,
    setIsGuest,
    setGuestId,
    setPhoneNumber,
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
    setUser,
    setToken,
    setAccessToken,
    setRefreshToken,
    setRegistrationToken,
    setIsGuest,
    setGuestId,
    setPhoneNumber,
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
        // Backend'e Firebase user bilgisini gönder ve JWT token al
        // Bu kısım backend'de Firebase auth entegrasyonu yapıldıktan sonra eklenecek
        console.log("Apple Sign-In başarılı:", result.user);
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
        // Backend'e Firebase user bilgisini gönder ve JWT token al
        // Bu kısım backend'de Firebase auth entegrasyonu yapıldıktan sonra eklenecek
        console.log("Google Sign-In başarılı:", result.user);
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
