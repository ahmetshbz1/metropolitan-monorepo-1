// guest-utils.ts
// Web-app guest authentication utilities
// Manages guest user sessions and data migration

import api from './api';

/**
 * Misafir kullanıcı ID'si oluştur
 * Format: guest-timestamp-random
 */
export const generateGuestId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `guest-${timestamp}-${random}`;
};

/**
 * Tarayıcı bilgisi al
 */
export const getBrowserInfo = (): string => {
  if (typeof window === 'undefined') return 'Unknown Browser';

  const ua = window.navigator.userAgent;
  const browser = ua.match(/(chrome|safari|firefox|edge|opera)/i)?.[0] || 'Unknown';
  const os = ua.match(/(windows|mac|linux|android|ios)/i)?.[0] || 'Unknown';

  return `${browser} - ${os}`;
};

/**
 * Misafir oturumu oluştur
 */
export const createGuestSession = async (
  guestId: string
): Promise<{ success: boolean; expiresAt?: Date }> => {
  try {
    const deviceInfo = getBrowserInfo();
    const response = await api.post('/guest/session/create', {
      guestId,
      deviceInfo,
    });

    if (response.data.success) {
      return {
        success: true,
        expiresAt: new Date(response.data.expiresAt)
      };
    }
    return { success: false };
  } catch (error: any) {
    console.error('❌ Guest session creation failed:', error);
    return { success: false };
  }
};

/**
 * Misafir verilerini kullanıcıya migrate et
 */
export const migrateGuestData = async (
  phoneNumber: string,
  guestId: string
): Promise<{ success: boolean; message?: string; migratedData?: any }> => {
  try {
    const response = await api.post('/auth/migrate-guest-data', {
      phoneNumber,
      guestId,
    });

    return {
      success: response.data.success,
      message: response.data.message,
      migratedData: response.data.migratedData,
    };
  } catch (error: any) {
    console.error('❌ Guest data migration failed:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * LocalStorage'dan guest ID'yi al
 */
export const getStoredGuestId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('metropolitan_guest_id');
};

/**
 * Guest ID'yi localStorage'a kaydet
 */
export const saveGuestId = (guestId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('metropolitan_guest_id', guestId);
};

/**
 * Guest ID'yi localStorage'dan temizle
 */
export const clearGuestId = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('metropolitan_guest_id');
};