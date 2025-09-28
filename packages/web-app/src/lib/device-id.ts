const DEVICE_ID_KEY = 'metropolitan_device_id';

const base64UrlDecode = (input: string): string => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);

  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    try {
      return window.atob(padded);
    } catch {
      return '';
    }
  }

  if (typeof atob === 'function') {
    try {
      return atob(padded);
    } catch {
      return '';
    }
  }

  return '';
};

export const extractDeviceIdFromToken = (token: string | null | undefined): string | null => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = base64UrlDecode(parts[1]);
    if (!payload) return null;
    const data = JSON.parse(payload);
    const deviceId = data?.deviceId;
    return typeof deviceId === 'string' ? deviceId : null;
  } catch {
    return null;
  }
};

export const isServerGeneratedDeviceId = (deviceId: string | null | undefined): deviceId is string => {
  if (!deviceId) return false;
  return /^dev_[a-f0-9]{32}$/i.test(deviceId);
};

export const deviceIdStorage = {
  async save(deviceId: string): Promise<void> {
    try {
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    } catch (error) {
      console.warn('Failed to save device ID:', error);
    }
  },

  async get(): Promise<string | null> {
    try {
      return localStorage.getItem(DEVICE_ID_KEY);
    } catch (error) {
      console.warn('Failed to get device ID:', error);
      return null;
    }
  },

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(DEVICE_ID_KEY);
    } catch (error) {
      console.warn('Failed to clear device ID:', error);
    }
  },
};

export const syncDeviceIdFromToken = async (token: string | null | undefined): Promise<string | null> => {
  const deviceId = extractDeviceIdFromToken(token);
  if (deviceId) {
    await deviceIdStorage.save(deviceId);
    return deviceId;
  }
  return null;
};

export { DEVICE_ID_KEY };
