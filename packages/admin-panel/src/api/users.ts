import { apiClient } from "./client";

export interface User {
  id: string;
  companyId: string | null;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  phoneNumberChangedAt: string | null;
  previousPhoneNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  firebaseUid: string | null;
  appleUserId: string | null;
  authProvider: string | null;
  userType: "individual" | "corporate";
  profilePhotoUrl: string | null;
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
  marketingConsentAt: string | null;
  marketingConsent: boolean;
  shareDataWithPartners: boolean;
  analyticsData: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  companyName: string | null;
  companyNip: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface UserFilters {
  userType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateUserInput {
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  userType?: "individual" | "corporate";
  companyId?: string | null;
  profilePhotoUrl?: string | null;
  marketingConsent?: boolean;
  shareDataWithPartners?: boolean;
  analyticsData?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
}

export const getUsers = async (filters?: UserFilters): Promise<UsersResponse> => {
  const params = new URLSearchParams();
  if (filters?.userType) params.append("userType", filters.userType);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.offset) params.append("offset", String(filters.offset));

  const response = await apiClient.get<UsersResponse>(`/admin/users?${params.toString()}`);
  return response.data;
};

export const updateUser = async (
  userId: string,
  input: UpdateUserInput
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.patch(`/admin/users/${userId}`, input);
  return response.data;
};

export const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};
