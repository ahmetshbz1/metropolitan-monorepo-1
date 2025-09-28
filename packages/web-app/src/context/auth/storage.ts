import { WebUser, SocialAuthData } from "./types";

// Token storage için localStorage wrapper
export const tokenStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },

  async getAccessToken(): Promise<string | null> {
    return localStorage.getItem("accessToken");
  },

  async getRefreshToken(): Promise<string | null> {
    return localStorage.getItem("refreshToken");
  },

  async hasTokens(): Promise<boolean> {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    return !!(accessToken && refreshToken);
  },

  async clearTokens(): Promise<void> {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

// User storage için localStorage wrapper
export const userStorage = {
  async save(user: WebUser): Promise<void> {
    localStorage.setItem("user", JSON.stringify(user));
  },

  async get(): Promise<WebUser | null> {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    localStorage.removeItem("user");
  },
};

// Social auth storage için localStorage wrapper
export const socialAuthStorage = {
  async save(data: SocialAuthData): Promise<void> {
    localStorage.setItem("socialAuthData", JSON.stringify(data));
  },

  async get(): Promise<SocialAuthData | null> {
    const dataStr = localStorage.getItem("socialAuthData");
    if (!dataStr) return null;

    try {
      return JSON.parse(dataStr);
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    localStorage.removeItem("socialAuthData");
  },
};

// Guest storage için localStorage wrapper
export const guestStorage = {
  async saveGuestId(guestId: string): Promise<void> {
    localStorage.setItem("guestId", guestId);
  },

  async getGuestId(): Promise<string | null> {
    return localStorage.getItem("guestId");
  },

  async clearGuestId(): Promise<void> {
    localStorage.removeItem("guestId");
  },
};

// Registration token storage
export const registrationStorage = {
  async saveToken(token: string): Promise<void> {
    localStorage.setItem("registrationToken", token);
  },

  async getToken(): Promise<string | null> {
    return localStorage.getItem("registrationToken");
  },

  async clearToken(): Promise<void> {
    localStorage.removeItem("registrationToken");
  },
};