import { apiClient } from "./client";

export interface Company {
  id: string;
  name: string;
  nip: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompaniesResponse {
  companies: Company[];
}

export interface UpdateCompanyInput {
  name: string;
  nip: string;
}

export const getCompanies = async (): Promise<CompaniesResponse> => {
  const response = await apiClient.get<CompaniesResponse>("/admin/companies");
  return response.data;
};

export const updateCompany = async (
  companyId: string,
  input: UpdateCompanyInput
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.patch(`/admin/companies/${companyId}`, input);
  return response.data;
};
