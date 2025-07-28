//  "settings.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

/**
 * User preference settings that are persisted across sessions and devices.
 * These settings can be synced between mobile, web, and other clients.
 */
export interface UserSettings {
  /** UI theme preference */
  theme: "light" | "dark" | "system";
  
  /** Mobile app specific settings */
  mobile?: {
    /** Enable haptic feedback on interactions */
    hapticsEnabled: boolean;
    /** Enable push notifications */
    notificationsEnabled: boolean;
    /** Enable notification sounds */
    notificationSoundsEnabled: boolean;
  };
  
  /** Language preference (ISO 639-1 code) */
  language?: "tr" | "en" | "pl";
  
  /** Currency preference for price display */
  currency?: "TRY" | "EUR" | "PLN";
  
  /** Email notification preferences */
  emailNotifications?: {
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
}

/**
 * Default user settings for new users
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: "system",
  mobile: {
    hapticsEnabled: true,
    notificationsEnabled: true,
    notificationSoundsEnabled: true,
  },
  language: "tr",
  currency: "TRY",
  emailNotifications: {
    orderUpdates: true,
    promotions: false,
    newsletter: false,
  },
};

/**
 * Request payload for updating user settings
 */
export interface UpdateUserSettingsRequest {
  settings: Partial<UserSettings>;
}

/**
 * Response from user settings endpoints
 */
export interface UserSettingsResponse {
  success: boolean;
  data: UserSettings;
  message?: string;
}