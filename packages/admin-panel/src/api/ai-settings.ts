import { apiClient } from "./client";

export interface AISettings {
  id: string;
  provider: string;
  apiKey: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAISettingsInput {
  provider: string;
  apiKey: string;
  model: string;
}

export interface AIModel {
  id: string;
  name: string;
  description?: string;
}

export interface AvailableModelsResponse {
  gemini: AIModel[];
  openai: AIModel[];
}

export const getAISettings = async (): Promise<AISettings | null> => {
  const response = await apiClient.get<AISettings | null>("/admin/ai-settings");
  return response.data;
};

export const getAvailableModels = async (): Promise<AvailableModelsResponse> => {
  const response = await apiClient.get<AvailableModelsResponse>("/admin/ai-settings/models");
  return response.data;
};

export const updateAISettings = async (
  input: UpdateAISettingsInput
): Promise<AISettings> => {
  const response = await apiClient.put<AISettings>("/admin/ai-settings", input);
  return response.data;
};
