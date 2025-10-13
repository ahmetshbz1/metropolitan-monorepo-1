import { apiClient } from "../../api/client";

export interface PushNotificationPayload {
  title?: string;
  body?: string;
  customTranslations?: {
    tr: { title: string; body: string };
    en: { title: string; body: string };
    pl: { title: string; body: string };
  };
  type?: string;
  data?: Record<string, unknown>;
  badge?: number;
}

export interface BatchPushPayload extends PushNotificationPayload {
  userIds: string[];
}

export interface PushResponse {
  success: boolean;
  message: string;
  data?: {
    sent: number;
    failed: number;
  };
}

export const sendPushToUser = async (
  userId: string,
  payload: PushNotificationPayload
): Promise<PushResponse> => {
  const response = await apiClient.post<PushResponse>(
    `/admin/push/users/${userId}`,
    payload
  );
  return response.data;
};

export const sendBatchPush = async (
  payload: BatchPushPayload
): Promise<PushResponse> => {
  const response = await apiClient.post<PushResponse>(
    "/admin/push/batch",
    payload
  );
  return response.data;
};

export const sendBroadcastPush = async (
  payload: PushNotificationPayload
): Promise<PushResponse> => {
  const response = await apiClient.post<PushResponse>(
    "/admin/push/broadcast",
    payload
  );
  return response.data;
};

export interface TranslateResponse {
  success: boolean;
  data?: {
    en: string;
    pl: string;
  };
  message?: string;
}

export const translateText = async (text: string): Promise<TranslateResponse> => {
  const response = await apiClient.post<TranslateResponse>(
    "/admin/push/translate",
    { text }
  );
  return response.data;
};
