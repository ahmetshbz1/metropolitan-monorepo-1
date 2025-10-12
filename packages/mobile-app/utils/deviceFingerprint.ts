// deviceFingerprint.ts
// Device fingerprinting for enhanced security

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Stabil device bilgilerini backend ile uyumlu tutmak için cache key
const DEVICE_INFO_CACHE_KEY = 'stable_device_info';

export interface DeviceInfo {
  platform: string;
  deviceModel: string;
  timezone: string;
}

/**
 * Get stable device information for fingerprinting
 * Cache'lenmiş değerleri kullanarak backend ile uyumlu stabil fingerprint sağlar
 *
 * Backend sadece şu alanları kullanır:
 * - platform (ios/android)
 * - deviceModel (örn: "iPhone 14 Pro")
 * - timezone (örn: "Europe/Istanbul")
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  try {
    // Cache'den kontrol et
    const cachedInfo = await AsyncStorage.getItem(DEVICE_INFO_CACHE_KEY);
    if (cachedInfo) {
      return JSON.parse(cachedInfo);
    }

    // İlk kez hesapla ve cache'le
    const deviceInfo: DeviceInfo = {
      platform: Platform.OS || 'unknown',
      deviceModel: Device.modelName || 'unknown',
      timezone: Localization.timezone || 'unknown',
    };

    // Cache'e kaydet (30 gün TTL ile - backend refresh token ile aynı)
    await AsyncStorage.setItem(DEVICE_INFO_CACHE_KEY, JSON.stringify(deviceInfo));

    return deviceInfo;
  } catch (error) {
    // Cache hatası durumunda fallback değerler döndür
    console.error('[Device Fingerprint] Cache error, using fallback values:', error);
    return {
      platform: Platform.OS || 'unknown',
      deviceModel: Device.modelName || 'unknown',
      timezone: Localization.timezone || 'unknown',
    };
  }
};

/**
 * Backend ile uyumlu device header'ları oluştur
 * Backend sadece şu header'ları kullanır: X-Platform, X-Device-Model, X-Timezone
 */
export const getDeviceHeaders = async (): Promise<Record<string, string>> => {
  const deviceInfo = await getDeviceInfo();

  return {
    'X-Platform': deviceInfo.platform,
    'X-Device-Model': deviceInfo.deviceModel,
    'X-Timezone': deviceInfo.timezone,
  };
};

/**
 * Cache'i temizle - logout veya session sıfırlama durumlarında kullan
 */
export const clearDeviceInfoCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DEVICE_INFO_CACHE_KEY);
  } catch (error) {
    console.error('[Device Fingerprint] Cache clear error:', error);
  }
};