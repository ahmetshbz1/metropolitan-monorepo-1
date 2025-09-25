// deviceFingerprint.ts
// Device fingerprinting for enhanced security

import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';

export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  deviceModel?: string;
  appVersion?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  deviceName?: string;
  osVersion?: string;
}

/**
 * Get comprehensive device information for fingerprinting
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  const { width, height } = Dimensions.get('screen');

  const deviceInfo: DeviceInfo = {
    platform: Platform.OS,
    osVersion: Platform.Version?.toString(),
    deviceModel: Device.modelName || 'Unknown',
    deviceName: Device.deviceName || undefined,
    appVersion: Constants.expoConfig?.version || Application.nativeApplicationVersion || 'Unknown',
    screenResolution: `${Math.round(width)}x${Math.round(height)}`,
    timezone: Localization.timezone,
    language: Localization.locale,
    userAgent: `Metropolitan/${Constants.expoConfig?.version || '1.0.0'} (${Platform.OS}; ${Device.modelName})`,
  };

  return deviceInfo;
};

/**
 * Add device info to request headers
 */
export const getDeviceHeaders = async (): Promise<Record<string, string>> => {
  const deviceInfo = await getDeviceInfo();

  const headers: Record<string, string> = {};

  if (deviceInfo.userAgent) headers['User-Agent'] = deviceInfo.userAgent;
  if (deviceInfo.platform) headers['X-Platform'] = deviceInfo.platform;
  if (deviceInfo.deviceModel) headers['X-Device-Model'] = deviceInfo.deviceModel;
  if (deviceInfo.appVersion) headers['X-App-Version'] = deviceInfo.appVersion;
  if (deviceInfo.screenResolution) headers['X-Screen-Resolution'] = deviceInfo.screenResolution;
  if (deviceInfo.timezone) headers['X-Timezone'] = deviceInfo.timezone;
  if (deviceInfo.language) headers['Accept-Language'] = deviceInfo.language;

  return headers;
};