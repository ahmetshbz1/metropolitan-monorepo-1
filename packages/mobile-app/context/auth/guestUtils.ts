//  "guestUtils.ts"
//  metropolitan app
//  Created by Ahmet on 01.07.2025.

import { api } from "@/core/api";
import * as Device from "expo-device";

// Misafir kullanıcı ID'si oluştur
export const generateGuestId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `guest-${timestamp}-${random}`;
};

// Cihaz bilgisi al
export const getDeviceInfo = (): string => {
  const deviceName = Device.deviceName || "Unknown Device";
  const osName = Device.osName || "Unknown OS";
  const osVersion = Device.osVersion || "Unknown Version";
  return `${deviceName} - ${osName} ${osVersion}`;
};

// Misafir oturumu oluştur
export const createGuestSession = async (
  guestId: string
): Promise<{ success: boolean }> => {
  try {
    const deviceInfo = getDeviceInfo();
    const response = await api.post("/guest/session/create", {
      guestId,
      deviceInfo,
    });

    if (response.data.success) {
      return { success: true };
    }
    return { success: false };
  } catch (error: any) {
    console.error("Misafir oturumu oluşturulamadı:", error);
    return { success: false };
  }
};

// Misafir verilerini migrate et
export const migrateGuestData = async (
  phoneNumber: string,
  guestId: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const migrationResponse = await api.post("/auth/migrate-guest-data", {
      phoneNumber,
      guestId,
    });

    return {
      success: migrationResponse.data.success,
      message: migrationResponse.data.message,
    };
  } catch (error: any) {
    console.error("Misafir verisi migration hatası:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};
