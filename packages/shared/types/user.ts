// "user.ts"
// metropolitan app
// Created by Ahmet on 15.07.2025.
export interface User {
  id?: string;
  /** Primary e-mail address of the user (unique). */
  email: string;

  /** Optional first name (client-facing). */
  firstName?: string;
  /** Optional last name (client-facing). */
  lastName?: string;

  /** Optional full name.  Back-end may store combined first/last name here. */
  name?: string;

  /** Phone number in E.164 format (without spaces). */
  phone?: string;

  /** Indicates whether the user account is active (soft-delete flag). */
  isActive?: boolean;

  /** Creation time – ISO string on the client, Date instance on the server. */
  createdAt?: Date | string;
  /** Last update time – ISO string on the client, Date instance on the server. */
  updatedAt?: Date | string;
}

/**
 * Profile completion payload sent from the mobile app when the user finalises their account.
 */
export interface CompleteProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  /** ‘corporate’ users provide a NIP (Polish VAT number). */
  userType: "corporate" | "individual";
  nip?: string;
  /** Indicates that the user has accepted the current Terms & Conditions. */
  termsAccepted: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ProfileResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    phoneNumber: string | null; // API compat için
    profilePhotoUrl: string | null;
    userType: "individual" | "corporate";
    companyInfo: CompanyInfo | null;
  };
}

export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    phoneNumber: string | null; // API compat için
    profilePhotoUrl: string | null;
    userType: "individual" | "corporate";
  };
}

export interface CompanyInfo {
  id: string;
  name: string;
  nip: string;
}

export interface NipVerificationResult {
  success: boolean;
  companyName?: string;
  nip?: string;
  message?: string;
}
