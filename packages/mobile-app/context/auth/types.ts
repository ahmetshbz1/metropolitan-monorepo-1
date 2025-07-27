//  "types.ts"
//  metropolitan app
//  Created by Ahmet on 24.06.2025.

import type { ApiResponse, User } from "@metropolitan/shared";

// Extended User type for mobile-specific fields
export interface MobileUser extends User {
  profilePicture?: string; // Bileşenlerde kullanılacak tam, işlenmiş URL
  nip?: string;
  userType?: "individual" | "corporate";
}

export type AuthContextType = {
  user: MobileUser | null;
  token: string | null;
  registrationToken: string | null;
  isGuest: boolean;
  guestId: string | null;
  phoneNumber: string | null;
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
    userData: Omit<MobileUser, "phone" | "profilePicture"> & {
      userType: "individual" | "corporate";
      nip?: string;
      termsAccepted: boolean;
    }
  ) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (
    userData: Partial<Omit<MobileUser, "phone" | "profilePicture">>
  ) => Promise<{ success: boolean; message: string }>;
  uploadProfilePhoto: (
    imageUri: string
  ) => Promise<{ success: boolean; message: string }>;
  refreshUserProfile: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  loading: boolean;
};

export interface CompleteProfileInput {
  userType: "individual" | "corporate";
  firstName: string;
  lastName: string;
  email: string;
  nip?: string;
  termsAccepted: boolean;
}

// Re-export shared ApiResponse type
export type { ApiResponse };
