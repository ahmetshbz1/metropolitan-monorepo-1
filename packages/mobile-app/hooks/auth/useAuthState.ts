//  "useAuthState.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

import { useEffect, useState } from "react";
import { User } from "@/context/auth/types";
import { loadAuthState } from "@/context/auth/storage";

export interface AuthState {
  user: User | null;
  token: string | null; // For backward compatibility
  accessToken: string | null;
  refreshToken: string | null;
  registrationToken: string | null;
  isGuest: boolean;
  guestId: string | null;
  phoneNumber: string | null;
  loading: boolean;
}

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Uygulama başlatıldığında kimlik doğrulama durumunu yükle
  useEffect(() => {
    const initializeAuth = async () => {
      const startTime = Date.now();

      try {
        const authState = await loadAuthState();

        if (authState.token) {
          setToken(authState.token);
          setAccessToken(authState.token); // Use same token for access token
        }

        if (authState.user) {
          setUser(authState.user);
        }

        if (authState.guestId) {
          setGuestId(authState.guestId);
          setIsGuest(true);
        }
      } catch (error) {
        console.error("❌ Kimlik doğrulama durumu yüklenemedi:", error);
      } finally {
        // Minimum 2 saniye splash screen göster
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 2000;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      }
    };

    initializeAuth();
  }, []);

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
    // State setters
    setUser,
    setToken,
    setAccessToken,
    setRefreshToken,
    setRegistrationToken,
    setIsGuest,
    setGuestId,
    setPhoneNumber,
  };
};