import axios from "axios";

import { ADMIN_TOKEN_STORAGE_KEY, API_BASE_URL } from "../config/env";

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Custom event for session expiration
export const SESSION_EXPIRED_EVENT = "admin:session-expired";

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - 401 hatalarını yakala
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired event dispatch et
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);
