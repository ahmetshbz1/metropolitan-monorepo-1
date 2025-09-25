//  "useAuthHook.ts"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { useTranslation } from "react-i18next";

// Custom hooks
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { useAuthState } from "@/hooks/auth/useAuthState";
import { useGuestAuth } from "@/hooks/auth/useGuestAuth";
import { useProfileManagement } from "@/hooks/auth/useProfileManagement";

export const useAuthHook = () => {
  const { t } = useTranslation();

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
