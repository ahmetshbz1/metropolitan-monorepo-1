"use client";

import React, { createContext, useContext, useMemo } from "react";
import { AuthContextType } from "./auth/types";
import { useAuthHook } from "./auth/useAuthHook";

// NOTE: Kimlik doğrulama context'i - tüm auth state ve fonksiyonları sağlar
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  accessToken: null,
  refreshToken: null,
  registrationToken: null,
  isGuest: false,
  guestId: null,
  phoneNumber: null,
  isAuthenticated: false,
  sendOTP: async () => ({ success: false, message: "Not implemented" }),
  verifyOTP: async () => ({
    success: false,
    message: "Not implemented",
    isNewUser: false,
  }),
  completeProfile: async () => ({ success: false, message: "Not implemented" }),
  updateUserProfile: async () => ({
    success: false,
    message: "Not implemented",
  }),
  uploadProfilePhoto: async () => ({
    success: false,
    message: "Not implemented",
  }),
  refreshUserProfile: async () => {},
  loginAsGuest: async () => {},
  logout: () => {},
  loading: true,
  signInWithGoogle: async () => ({ success: false, error: "Not implemented" }),
});

export const useAuth = () => useContext(AuthContext);

// NOTE: Auth context sağlayıcısı - tüm uygulamayı auth state ile sarar
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authHookValues = useAuthHook();

  // Gereksiz yeniden render'ları önlemek için memoize et
  const memoizedValue = useMemo(
    () => authHookValues,
    [
      authHookValues.user,
      authHookValues.token,
      authHookValues.accessToken,
      authHookValues.refreshToken,
      authHookValues.registrationToken,
      authHookValues.isGuest,
      authHookValues.guestId,
      authHookValues.phoneNumber,
      authHookValues.loading,
      authHookValues.sendOTP,
      authHookValues.verifyOTP,
      authHookValues.completeProfile,
      authHookValues.logout,
      authHookValues.loginAsGuest,
      authHookValues.updateUserProfile,
      authHookValues.uploadProfilePhoto,
      authHookValues.refreshUserProfile,
      authHookValues.signInWithGoogle,
    ]
  );

  return (
    <AuthContext.Provider value={memoizedValue}>
      {children}
    </AuthContext.Provider>
  );
};