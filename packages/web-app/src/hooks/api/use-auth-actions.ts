import { authApi } from "@/services/api/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { userKeys } from "./use-user";

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
  const { setTokens, setRegistrationToken, setGuest } = useAuthStore();
  const isGuest = useAuthStore((state) => state.isGuest);
  const guestId = useAuthStore((state) => state.guestId);
  const socialAuthData = useAuthStore((state) => (state as any).socialAuthData);

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
    onSuccess: async (data) => {
      console.log("🔑 useVerifyOTP onSuccess - Full Response:", data);

      if (data.accessToken && data.refreshToken) {
        console.log("✅ Setting access & refresh tokens");
        setTokens(data.accessToken, data.refreshToken);
        setGuest(false, null);

        // Fetch user profile
        await queryClient.invalidateQueries({ queryKey: userKeys.current() });
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
  const { setTokens, setRegistrationToken, setGuest } = useAuthStore();
  const registrationToken = useAuthStore((state) => state.registrationToken);

  return useMutation({
    mutationFn: (userData: any) => {
      if (!registrationToken) {
        throw new Error("Registration token not found");
      }
      return authApi.completeProfile(userData, registrationToken);
    },
    onSuccess: async (data) => {
      if (data.accessToken && data.refreshToken) {
        setTokens(data.accessToken, data.refreshToken);
        setRegistrationToken(null);
        setGuest(false, null);

        // Fetch user profile
        await queryClient.invalidateQueries({ queryKey: userKeys.current() });
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
