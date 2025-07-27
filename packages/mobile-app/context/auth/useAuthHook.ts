//  "useAuthHook.ts"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

import { useTranslation } from "react-i18next";

// Custom hooks
import { useAuthState } from "@/hooks/auth/useAuthState";
import { useGuestAuth } from "@/hooks/auth/useGuestAuth";
import { useProfileManagement } from "@/hooks/auth/useProfileManagement";
import { useAuthActions } from "@/hooks/auth/useAuthActions";

export const useAuthHook = () => {
  const { t } = useTranslation();
  
  // Auth state management
  const {
    user,
    token,
    registrationToken,
    isGuest,
    guestId,
    phoneNumber,
    loading,
    setUser,
    setToken,
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
