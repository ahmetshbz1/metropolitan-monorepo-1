import type {
  ApiResponse,
  User,
} from "@metropolitan/shared";

// Extended User type for web-specific fields
export interface WebUser extends User {
  profilePhotoUrl?: string; // Backend'in kullandığı alan adı
  nip?: string;
  userType?: "individual" | "corporate";
  authProvider?: string | null; // 'google' or null for phone-only
}

export interface SocialAuthData {
  uid: string;
  email?: string | null;
  fullName?: string | null;
  firstName?: string;
  lastName?: string;
  photoURL?: string | null;
  provider: 'google';
}

export type AuthContextType = {
  user: WebUser | null;
  token: string | null; // Access token for backward compatibility
  accessToken: string | null;
  refreshToken: string | null;
  registrationToken: string | null;
  isGuest: boolean;
  guestId: string | null;
  phoneNumber: string | null;
  socialAuthData: SocialAuthData | null; // Sosyal giriş bilgileri
  isAuthenticated: boolean;
  sendOTP: (
    phoneNumber: string,
    userType?: "individual" | "corporate"
  ) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (
    phoneNumber: string,
    otpCode: string,
    userType?: "individual" | "corporate"
  ) => Promise<{
    success: boolean;
    message: string;
    isNewUser: boolean;
  }>;
  completeProfile: (
    userData: Omit<WebUser, "phone" | "profilePhotoUrl"> & {
      userType: "individual" | "corporate";
      nip?: string;
      termsAccepted: boolean;
    }
  ) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (
    userData: Partial<Omit<WebUser, "phone" | "profilePhotoUrl">>
  ) => Promise<{ success: boolean; message: string }>;
  uploadProfilePhoto: (
    file: File
  ) => Promise<{ success: boolean; message: string }>;
  refreshUserProfile: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  loading: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
};

// Re-export shared ApiResponse type
export type { ApiResponse };