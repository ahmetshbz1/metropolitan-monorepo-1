import { authApi } from "@/services/api/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { userKeys } from "./use-user";
import { useGuestAuth } from "../use-guest-auth";

export function useSendOTP() {
  const setPhoneNumber = useAuthStore((state) => state.setPhoneNumber);

  return useMutation({
    mutationFn: authApi.sendOTP,
    onSuccess: (data, variables) => {
      if (data.success) {
        setPhoneNumber(variables.phoneNumber);
      }
    },
  });
}

export function useVerifyOTP() {
  const queryClient = useQueryClient();
  const { setTokens, setRegistrationToken, setGuest, setUser, phoneNumber: storedPhone } = useAuthStore();
  const isGuest = useAuthStore((state) => state.isGuest);
  const guestId = useAuthStore((state) => state.guestId);
  const socialAuthData = useAuthStore((state) => state.socialAuthData);
  const { migrateGuest } = useGuestAuth();

  return useMutation({
    mutationFn: (params: {
      phoneNumber: string;
      otpCode: string;
      userType: "individual" | "corporate";
    }) =>
      authApi.verifyOTP({
        ...params,
        guestId: isGuest ? (guestId ?? undefined) : undefined,
        socialAuthData,
      }),
    onSuccess: async (data, variables) => {
      console.log("🔑 useVerifyOTP onSuccess - Full Response:", data);

      // Eğer guest session varsa ve login başarılıysa, migration yap
      if (guestId && data.accessToken) {
        console.log("🔄 Migrating guest data to user account...");
        try {
          await migrateGuest(variables.phoneNumber);
          console.log("✅ Guest data migrated successfully");
        } catch (error) {
          console.error("❌ Guest migration failed:", error);
          // Migration hatası logged, ama login devam ediyor
        }
      }

      if (data.accessToken && data.refreshToken) {
        console.log("✅ Setting access & refresh tokens");
        setTokens(data.accessToken, data.refreshToken);
        setGuest(false, null);

        // Immediately fetch user profile (like mobile-app does)
        try {
          console.log("🔄 Fetching user profile after OTP verification...");
          const user = await authApi.getCurrentUser();
          if (user) {
            setUser(user);
            console.log(
              "✅ User profile loaded successfully:",
              user.firstName,
              user.lastName
            );
          } else {
            console.log("⚠️ User profile is null");
          }
        } catch (error) {
          console.error("❌ Failed to fetch user profile after OTP:", error);
        }

        // Invalidate queries to refresh cart and favorites
        await queryClient.invalidateQueries({ queryKey: userKeys.current() });
        await queryClient.invalidateQueries({ queryKey: ['cart'] });
        await queryClient.invalidateQueries({ queryKey: ['favorites'] });
      } else if (data.registrationToken) {
        console.log("🆕 Setting registration token:", data.registrationToken);
        setRegistrationToken(data.registrationToken);
      } else {
        console.log("⚠️ No tokens in response:", {
          hasAccessToken: !!data.accessToken,
          hasRefreshToken: !!data.refreshToken,
          hasRegistrationToken: !!data.registrationToken,
        });
      }
    },
  });
}

export function useCompleteProfile() {
  const queryClient = useQueryClient();
  const { setTokens, setRegistrationToken, setGuest, setUser, phoneNumber } = useAuthStore();
  const registrationToken = useAuthStore((state) => state.registrationToken);
  const guestId = useAuthStore((state) => state.guestId);
  const { migrateGuest } = useGuestAuth();

  return useMutation({
    mutationFn: (userData: {
      firstName: string;
      lastName: string;
      email: string;
      userType: "individual" | "corporate";
      nip?: string;
      termsAccepted: boolean;
      privacyAccepted: boolean;
      marketingAccepted: boolean;
      marketingConsent?: boolean;
      firebaseUid?: string;
      authProvider?: string;
    }) => {
      if (!registrationToken) {
        throw new Error("Registration token not found");
      }
      return authApi.completeProfile(userData, registrationToken);
    },
    onSuccess: async (data) => {
      console.log("🎉 Complete Profile Success:", data);

      // Guest migration - yeni kullanıcı kayıt olduysa ve guest session varsa
      if (guestId && phoneNumber && data.accessToken) {
        console.log("🔄 Migrating guest data after profile completion...");
        try {
          await migrateGuest(phoneNumber);
          console.log("✅ Guest data migrated successfully");
        } catch (error) {
          console.error("❌ Guest migration failed:", error);
        }
      }

      if (data.accessToken && data.refreshToken) {
        console.log("✅ Setting tokens after profile completion");
        setTokens(data.accessToken, data.refreshToken);
        setRegistrationToken(null);
        setGuest(false, null);

        // Fetch user profile immediately after setting tokens
        try {
          const user = await authApi.getCurrentUser();
          if (user) {
            setUser(user);
            console.log("✅ Profile completed and user loaded");
          }
        } catch (error) {
          console.error("❌ Failed to fetch user profile:", error);
        }

        // Invalidate queries to refresh cart and favorites
        await queryClient.invalidateQueries({ queryKey: userKeys.current() });
        await queryClient.invalidateQueries({ queryKey: ['cart'] });
        await queryClient.invalidateQueries({ queryKey: ['favorites'] });
      }
    },
  });
}

export function useGuestLogin() {
  const setGuest = useAuthStore((state) => state.setGuest);

  return useMutation({
    mutationFn: authApi.guestLogin,
    onSuccess: (data) => {
      if (data.success && data.guestId) {
        setGuest(true, data.guestId);
      }
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth, accessToken } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (accessToken) {
        await authApi.logout(accessToken);
      }
    },
    onSettled: () => {
      // Always clear local state, even if server logout fails
      clearAuth();
      queryClient.clear(); // Clear all queries
      router.push("/");
    },
  });
}
