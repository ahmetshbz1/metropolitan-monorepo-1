//  "AuthContext.tsx"
//  metropolitan app
//  Created by Ahmet on 07.06.2025.

import React, { createContext, useContext, useMemo } from "react";

// Auth modülleri
import { AuthContextType } from "./auth/types";
import { useAuthHook } from "./auth/useAuthHook";

// NOTE: Kimlik doğrulama context'i - tüm auth state ve fonksiyonları sağlar
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  registrationToken: null,
  isGuest: false,
  guestId: null,
  phoneNumber: null,
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
      authHookValues.registrationToken,
      authHookValues.isGuest,
      authHookValues.guestId,
      authHookValues.phoneNumber,
      authHookValues.loading,
    ]
  );

  return (
    <AuthContext.Provider value={memoizedValue}>
      {children}
    </AuthContext.Provider>
  );
};
