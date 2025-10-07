const rawApiUrl = import.meta.env.VITE_API_URL ?? "";

const normalizeUrl = (value: string): string => {
  if (!value) {
    return "http://localhost:3000";
  }
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return value.replace(/\/$/, "");
  }
};

export const API_BASE_URL = normalizeUrl(rawApiUrl);
export const API_URL = `${API_BASE_URL}/api`;
export const ADMIN_TOKEN_STORAGE_KEY = "metropolitan_admin_access_token";

export const getAuthHeaders = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
