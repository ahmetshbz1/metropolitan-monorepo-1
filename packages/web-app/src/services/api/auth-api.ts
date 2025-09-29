import type { SocialAuthData, WebUser } from "@/context/auth/types";
import api from "@/lib/api";

interface SendOTPRequest {
  phoneNumber: string;
  userType: "individual" | "corporate";
}

interface VerifyOTPRequest {
  phoneNumber: string;
  otpCode: string;
  userType: "individual" | "corporate";
  guestId?: string;
  socialAuthData?: SocialAuthData | null;
}

interface CompleteProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  userType: "individual" | "corporate";
  nip?: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
  firebaseUid?: string;
  authProvider?: string;
}

interface SocialSignInRequest {
  firebaseUid: string;
  provider: string;
  email?: string;
}

export const authApi = {
  sendOTP: async (data: SendOTPRequest) => {
    const response = await api.post("/auth/send-otp", data);
    return response.data;
  },

  verifyOTP: async (data: VerifyOTPRequest) => {
    const response = await api.post("/auth/verify-otp", data);
    return response.data;
  },

  completeProfile: async (
    data: CompleteProfileRequest,
    registrationToken: string
  ) => {
    // Backend mounts profileRoutes under /users group, so endpoint is /users/complete-profile
    const response = await api.post("/users/complete-profile", data, {
      headers: { Authorization: `Bearer ${registrationToken}` },
    });
    return response.data;
  },

  socialSignIn: async (data: SocialSignInRequest) => {
    const response = await api.post("/auth/social-signin", data);
    return response.data;
  },

  guestLogin: async () => {
    const response = await api.post("/auth/guest-login");
    return response.data;
  },

  logout: async (accessToken: string) => {
    const response = await api.post(
      "/auth/logout",
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    const userData = response.data.data;

    // Convert relative profilePhotoUrl to absolute URL (like mobile-app does)
    if (userData.profilePhotoUrl && !userData.profilePhotoUrl.startsWith('http')) {
      const baseURL = api.defaults.baseURL?.replace('/api', '') || '';
      userData.profilePhotoUrl = `${baseURL}${userData.profilePhotoUrl}`;
    }

    return userData as WebUser;
  },

  updateProfile: async (data: Partial<WebUser>) => {
    const response = await api.put("/users/me", data);
    const userData = response.data.data;

    // Convert relative profilePhotoUrl to absolute URL
    if (userData.profilePhotoUrl && !userData.profilePhotoUrl.startsWith('http')) {
      const baseURL = api.defaults.baseURL?.replace('/api', '') || '';
      userData.profilePhotoUrl = `${baseURL}${userData.profilePhotoUrl}`;
    }

    return userData as WebUser;
  },

  uploadProfilePhoto: async (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    const response = await api.post("/users/me/profile-photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};
