import { z } from "zod";

import { apiClient } from "./client";

const loginResponseSchema = z.object({
  success: z.literal(true),
  accessToken: z.string().min(1),
  expiresIn: z.number().positive(),
  tokenType: z.literal("Bearer"),
});

export type AdminLoginResponse = z.infer<typeof loginResponseSchema>;

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export const loginAdmin = async (
  payload: AdminLoginRequest
): Promise<AdminLoginResponse> => {
  const response = await apiClient.post("/admin/auth/login", payload);
  const parsed = loginResponseSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new Error("Beklenmeyen cevap formatı alındı");
  }

  return parsed.data;
};
