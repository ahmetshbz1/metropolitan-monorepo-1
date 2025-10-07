import { apiClient } from "./client";

export interface User {
  id: string;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  userType: "individual" | "corporate";
  companyName: string | null;
  companyNip: string | null;
  authProvider: string | null;
  marketingConsent: boolean;
  createdAt: string;
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

export const getUsers = async (filters?: UserFilters): Promise<UsersResponse> => {
  const params = new URLSearchParams();
  if (filters?.userType) params.append("userType", filters.userType);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.offset) params.append("offset", String(filters.offset));

  const response = await apiClient.get<UsersResponse>(`/admin/users?${params.toString()}`);
  return response.data;
};
